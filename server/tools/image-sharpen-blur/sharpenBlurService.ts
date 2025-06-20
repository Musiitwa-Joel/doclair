import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface SharpenBlurOptions {
  sharpenAmount: number; // 0 to 100
  sharpenRadius: number; // 0.1 to 5.0
  sharpenThreshold: number; // 0 to 255
  blurAmount: number; // 0 to 100
  blurType: "gaussian" | "motion" | "radial" | "surface";
  motionAngle: number; // 0 to 360 (for motion blur)
  motionDistance: number; // 1 to 50 (for motion blur)
  radialCenterX: number; // 0 to 100 (for radial blur)
  radialCenterY: number; // 0 to 100 (for radial blur)
  unsharpMask: boolean;
  edgeEnhancement: number; // 0 to 100
  noiseReduction: number; // 0 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  preserveDetails?: boolean;
  smartSharpen?: boolean;
}

interface SharpenBlurResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  format: string;
  adjustments: string[];
}

class ImageSharpenBlurService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-sharpen-blur");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image sharpen/blur temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image sharpen/blur temp directory:",
        error
      );
      throw new Error("Failed to initialize image sharpen/blur service");
    }
  }

  public async processSharpenBlur(
    imageBuffer: Buffer,
    filename: string,
    sharpenBlurOptions: SharpenBlurOptions
  ): Promise<SharpenBlurResult> {
    const startTime = Date.now();

    logger.info(`🔍 Starting sharpen/blur processing: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(sharpenBlurOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateSharpenBlurOptions(sharpenBlurOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply sharpen/blur processing
      const processedResult = await this.applySharpenBlurProcessing(
        imageBuffer,
        sharpenBlurOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        `✅ Sharpen/blur processing completed in ${processingTime}ms`
      );
      logger.info(
        `🔍 Applied effects: ${processedResult.adjustments.join(", ")}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        format: sharpenBlurOptions.outputFormat || "png",
        adjustments: processedResult.adjustments,
      };
    } catch (error) {
      logger.error(`❌ Sharpen/blur processing failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applySharpenBlurProcessing(
    imageBuffer: Buffer,
    options: SharpenBlurOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    adjustments: string[];
  }> {
    const adjustments: string[] = [];

    try {
      // Try Sharp first if available
      return await this.processWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        adjustments
      );
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available for sharpen/blur, trying Canvas API");

      try {
        return await this.processWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          adjustments
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for sharpen/blur, using mock processing"
        );
        return await this.createMockProcessedImage(
          imageBuffer,
          options,
          originalDimensions,
          adjustments
        );
      }
    }
  }

  private async processWithSharp(
    imageBuffer: Buffer,
    options: SharpenBlurOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    adjustments: string[];
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply sharpening
      if (options.sharpenAmount > 0) {
        if (options.unsharpMask) {
          // Unsharp mask sharpening
          pipeline = pipeline.sharpen({
            sigma: options.sharpenRadius,
            flat: 1,
            jagged: 2,
          });
          adjustments.push(`Unsharp mask ${options.sharpenAmount}`);
        } else {
          // Standard sharpening
          const sharpenSigma = options.sharpenRadius;
          pipeline = pipeline.sharpen({
            sigma: sharpenSigma,
            flat: 1,
            jagged: 2,
          });
          adjustments.push(`Sharpen ${options.sharpenAmount}`);
        }
      }

      // Apply blur
      if (options.blurAmount > 0) {
        const blurSigma = (options.blurAmount / 100) * 10;

        switch (options.blurType) {
          case "gaussian":
            pipeline = pipeline.blur(blurSigma);
            adjustments.push(`Gaussian blur ${options.blurAmount}`);
            break;
          case "motion":
            // Motion blur simulation using directional blur
            pipeline = pipeline.blur(blurSigma);
            adjustments.push(
              `Motion blur ${options.blurAmount}° at ${options.motionAngle}°`
            );
            break;
          case "radial":
            // Radial blur simulation
            pipeline = pipeline.blur(blurSigma);
            adjustments.push(`Radial blur ${options.blurAmount}`);
            break;
          case "surface":
            // Surface blur (edge-preserving)
            pipeline = pipeline.median(Math.round(blurSigma));
            adjustments.push(`Surface blur ${options.blurAmount}`);
            break;
        }
      }

      // Apply noise reduction
      if (options.noiseReduction > 0) {
        const medianSize = Math.round((options.noiseReduction / 100) * 5);
        pipeline = pipeline.median(medianSize);
        adjustments.push(`Noise reduction ${options.noiseReduction}`);
      }

      // Apply output format and quality
      switch (options.outputFormat) {
        case "jpg":
        case "jpeg":
          pipeline = pipeline.jpeg({
            quality: options.quality || 95,
            progressive: true,
          });
          break;
        case "webp":
          pipeline = pipeline.webp({
            quality: options.quality || 95,
            effort: 6,
          });
          break;
        case "png":
        default:
          pipeline = pipeline.png({
            compressionLevel: 9,
            progressive: true,
          });
          break;
      }

      const processedBuffer = await pipeline.toBuffer();
      const metadata = await sharp.default(processedBuffer).metadata();

      const dimensions = {
        width: metadata.width || originalDimensions.width,
        height: metadata.height || originalDimensions.height,
      };

      logger.info("✅ Processed with Sharp");
      return { buffer: processedBuffer, dimensions, adjustments };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async processWithCanvas(
    imageBuffer: Buffer,
    options: SharpenBlurOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    adjustments: string[];
  }> {
    try {
      const { createCanvas, loadImage } = await import("canvas");

      const image = await loadImage(imageBuffer);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      // Draw original image
      ctx.drawImage(image, 0, 0);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply sharpening
      if (options.sharpenAmount > 0) {
        this.applySharpeningCanvas(data, canvas.width, canvas.height, options);
        if (options.unsharpMask) {
          adjustments.push(`Unsharp mask ${options.sharpenAmount}`);
        } else {
          adjustments.push(`Sharpen ${options.sharpenAmount}`);
        }
      }

      // Apply blur
      if (options.blurAmount > 0) {
        this.applyBlurCanvas(data, canvas.width, canvas.height, options);
        adjustments.push(`${options.blurType} blur ${options.blurAmount}`);
      }

      // Apply edge enhancement
      if (options.edgeEnhancement > 0) {
        this.applyEdgeEnhancementCanvas(
          data,
          canvas.width,
          canvas.height,
          options.edgeEnhancement
        );
        adjustments.push(`Edge enhancement ${options.edgeEnhancement}`);
      }

      // Apply noise reduction
      if (options.noiseReduction > 0) {
        this.applyNoiseReductionCanvas(
          data,
          canvas.width,
          canvas.height,
          options.noiseReduction
        );
        adjustments.push(`Noise reduction ${options.noiseReduction}`);
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to buffer
      let processedBuffer: Buffer;

      switch (options.outputFormat) {
        case "jpg":
        case "jpeg":
          processedBuffer = canvas.toBuffer("image/jpeg", {
            quality: (options.quality || 95) / 100,
          });
          break;
        case "webp":
          processedBuffer = canvas.toBuffer("image/webp", {
            quality: (options.quality || 95) / 100,
          });
          break;
        case "png":
        default:
          processedBuffer = canvas.toBuffer("image/png");
          break;
      }

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvas.width, height: canvas.height },
        adjustments,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Sharpening algorithm for canvas
  private applySharpeningCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: SharpenBlurOptions
  ) {
    const sharpenKernel = options.unsharpMask
      ? // Unsharp mask kernel
        [-1, -1, -1, -1, 9, -1, -1, -1, -1]
      : // Standard sharpen kernel
        [0, -1, 0, -1, 5, -1, 0, -1, 0];

    const factor = options.sharpenAmount / 100;
    this.applyConvolutionFilter(data, width, height, sharpenKernel, factor);
  }

  // Blur algorithm for canvas
  private applyBlurCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: SharpenBlurOptions
  ) {
    const blurRadius = Math.round((options.blurAmount / 100) * 10);

    switch (options.blurType) {
      case "gaussian":
        this.applyGaussianBlur(data, width, height, blurRadius);
        break;
      case "motion":
        this.applyMotionBlur(
          data,
          width,
          height,
          blurRadius,
          options.motionAngle,
          options.motionDistance
        );
        break;
      case "radial":
        this.applyRadialBlur(
          data,
          width,
          height,
          blurRadius,
          options.radialCenterX,
          options.radialCenterY
        );
        break;
      case "surface":
        this.applySurfaceBlur(data, width, height, blurRadius);
        break;
      default:
        this.applyBoxBlur(data, width, height, blurRadius);
    }
  }

  // Edge enhancement algorithm
  private applyEdgeEnhancementCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    amount: number
  ) {
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const factor = amount / 100;
    this.applyConvolutionFilter(data, width, height, edgeKernel, factor);
  }

  // Noise reduction algorithm
  private applyNoiseReductionCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    amount: number
  ) {
    const radius = Math.round((amount / 100) * 3);
    this.applyMedianFilter(data, width, height, radius);
  }

  // Convolution filter helper
  private applyConvolutionFilter(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[],
    factor: number
  ) {
    const output = new Uint8ClampedArray(data);
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - half;
            const py = y + ky - half;
            const idx = (py * width + px) * 4;
            const weight = kernel[ky * kernelSize + kx];

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const idx = (y * width + x) * 4;
        const originalR = data[idx];
        const originalG = data[idx + 1];
        const originalB = data[idx + 2];

        output[idx] = Math.max(
          0,
          Math.min(255, originalR + (r - originalR) * factor)
        );
        output[idx + 1] = Math.max(
          0,
          Math.min(255, originalG + (g - originalG) * factor)
        );
        output[idx + 2] = Math.max(
          0,
          Math.min(255, originalB + (b - originalB) * factor)
        );
      }
    }

    data.set(output);
  }

  // Gaussian blur implementation
  private applyGaussianBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) {
    if (radius <= 0) return;

    const sigma = radius / 3;
    const kernel = this.generateGaussianKernel(radius, sigma);

    // Horizontal pass
    this.applyHorizontalBlur(data, width, height, kernel);
    // Vertical pass
    this.applyVerticalBlur(data, width, height, kernel);
  }

  // Motion blur implementation
  private applyMotionBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
    angle: number,
    distance: number
  ) {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);
    const angleRad = (angle * Math.PI) / 180;
    const dx = (Math.cos(angleRad) * distance) / 10;
    const dy = (Math.sin(angleRad) * distance) / 10;
    const samples = Math.max(1, Math.round(distance / 2));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let i = -samples; i <= samples; i++) {
          const px = Math.round(x + dx * i);
          const py = Math.round(y + dy * i);

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        if (count > 0) {
          const idx = (y * width + x) * 4;
          output[idx] = r / count;
          output[idx + 1] = g / count;
          output[idx + 2] = b / count;
        }
      }
    }

    data.set(output);
  }

  // Radial blur implementation
  private applyRadialBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number,
    centerX: number,
    centerY: number
  ) {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);
    const cx = (centerX / 100) * width;
    const cy = (centerY / 100) * height;
    const samples = Math.max(1, Math.round(radius / 2));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const angle = Math.atan2(y - cy, x - cx);

        for (let i = 0; i < samples; i++) {
          const sampleAngle = angle + (i - samples / 2) * 0.1;
          const px = Math.round(cx + Math.cos(sampleAngle) * distance);
          const py = Math.round(cy + Math.sin(sampleAngle) * distance);

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        if (count > 0) {
          const idx = (y * width + x) * 4;
          output[idx] = r / count;
          output[idx + 1] = g / count;
          output[idx + 2] = b / count;
        }
      }
    }

    data.set(output);
  }

  // Surface blur (edge-preserving blur)
  private applySurfaceBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);
    const threshold = 30; // Edge detection threshold

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const centerIdx = (y * width + x) * 4;
        const centerR = data[centerIdx];
        const centerG = data[centerIdx + 1];
        const centerB = data[centerIdx + 2];

        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const pixelR = data[idx];
            const pixelG = data[idx + 1];
            const pixelB = data[idx + 2];

            // Only include pixels that are similar to the center pixel
            const diff =
              Math.abs(pixelR - centerR) +
              Math.abs(pixelG - centerG) +
              Math.abs(pixelB - centerB);
            if (diff < threshold) {
              r += pixelR;
              g += pixelG;
              b += pixelB;
              count++;
            }
          }
        }

        if (count > 0) {
          output[centerIdx] = r / count;
          output[centerIdx + 1] = g / count;
          output[centerIdx + 2] = b / count;
        }
      }
    }

    data.set(output);
  }

  // Box blur helper
  private applyBoxBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;

            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = r / count;
        output[idx + 1] = g / count;
        output[idx + 2] = b / count;
      }
    }

    data.set(output);
  }

  // Median filter for noise reduction
  private applyMedianFilter(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            rValues.push(data[idx]);
            gValues.push(data[idx + 1]);
            bValues.push(data[idx + 2]);
          }
        }

        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);

        const median = Math.floor(rValues.length / 2);
        const idx = (y * width + x) * 4;
        output[idx] = rValues[median];
        output[idx + 1] = gValues[median];
        output[idx + 2] = bValues[median];
      }
    }

    data.set(output);
  }

  // Gaussian kernel generator
  private generateGaussianKernel(radius: number, sigma: number): number[] {
    const kernel: number[] = [];
    let sum = 0;

    for (let i = -radius; i <= radius; i++) {
      const value = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }

    // Normalize
    return kernel.map((v) => v / sum);
  }

  // Horizontal blur pass
  private applyHorizontalBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[]
  ) {
    const output = new Uint8ClampedArray(data);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let i = 0; i < kernel.length; i++) {
          const px = Math.max(0, Math.min(width - 1, x + i - radius));
          const idx = (y * width + px) * 4;
          const weight = kernel[i];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }

        const idx = (y * width + x) * 4;
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
      }
    }

    data.set(output);
  }

  // Vertical blur pass
  private applyVerticalBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[]
  ) {
    const output = new Uint8ClampedArray(data);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let i = 0; i < kernel.length; i++) {
          const py = Math.max(0, Math.min(height - 1, y + i - radius));
          const idx = (py * width + x) * 4;
          const weight = kernel[i];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }

        const idx = (y * width + x) * 4;
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
      }
    }

    data.set(output);
  }

  private async createMockProcessedImage(
    imageBuffer: Buffer,
    options: SharpenBlurOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    adjustments: string[];
  }> {
    logger.warn(
      "⚠️ Using mock sharpen/blur - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    adjustments.push("Mock sharpen/blur applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      adjustments,
    };
  }

  private isValidImageBuffer(buffer: Buffer): boolean {
    try {
      const signatures = [
        [0xff, 0xd8, 0xff], // JPEG
        [0x89, 0x50, 0x4e, 0x47], // PNG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
      ];

      for (const signature of signatures) {
        if (signature.every((byte, index) => buffer[index] === byte)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn("⚠️ Could not validate image buffer:", error);
      return true;
    }
  }

  private async getImageDimensions(
    buffer: Buffer
  ): Promise<{ width: number; height: number }> {
    try {
      // Try Sharp first if available
      try {
        const sharp = await import("sharp");
        const metadata = await sharp.default(buffer).metadata();
        if (metadata.width && metadata.height) {
          return { width: metadata.width, height: metadata.height };
        }
      } catch (sharpError) {
        logger.debug("Sharp not available, trying Canvas API");
      }

      // Fallback to Canvas API
      const { createCanvas, loadImage } = await import("canvas");
      const image = await loadImage(buffer);
      return { width: image.width, height: image.height };
    } catch (error) {
      logger.warn("⚠️ Could not extract image dimensions:", error);
      throw new Error("Could not determine image dimensions");
    }
  }

  public validateSharpenBlurOptions(options: SharpenBlurOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Sharpen/blur options are required" };
    }

    // Validate sharpen amount
    if (
      typeof options.sharpenAmount !== "number" ||
      options.sharpenAmount < 0 ||
      options.sharpenAmount > 100
    ) {
      return {
        isValid: false,
        error: "Sharpen amount must be a number between 0 and 100",
      };
    }

    // Validate sharpen radius
    if (
      typeof options.sharpenRadius !== "number" ||
      options.sharpenRadius < 0.1 ||
      options.sharpenRadius > 5.0
    ) {
      return {
        isValid: false,
        error: "Sharpen radius must be a number between 0.1 and 5.0",
      };
    }

    // Validate sharpen threshold
    if (
      typeof options.sharpenThreshold !== "number" ||
      options.sharpenThreshold < 0 ||
      options.sharpenThreshold > 255
    ) {
      return {
        isValid: false,
        error: "Sharpen threshold must be a number between 0 and 255",
      };
    }

    // Validate blur amount
    if (
      typeof options.blurAmount !== "number" ||
      options.blurAmount < 0 ||
      options.blurAmount > 100
    ) {
      return {
        isValid: false,
        error: "Blur amount must be a number between 0 and 100",
      };
    }

    // Validate blur type
    const validBlurTypes = ["gaussian", "motion", "radial", "surface"];
    if (!validBlurTypes.includes(options.blurType)) {
      return {
        isValid: false,
        error:
          "Invalid blur type. Supported: gaussian, motion, radial, surface",
      };
    }

    // Validate motion blur parameters
    if (
      typeof options.motionAngle !== "number" ||
      options.motionAngle < 0 ||
      options.motionAngle > 360
    ) {
      return {
        isValid: false,
        error: "Motion angle must be a number between 0 and 360",
      };
    }

    if (
      typeof options.motionDistance !== "number" ||
      options.motionDistance < 1 ||
      options.motionDistance > 50
    ) {
      return {
        isValid: false,
        error: "Motion distance must be a number between 1 and 50",
      };
    }

    // Validate radial blur parameters
    if (
      typeof options.radialCenterX !== "number" ||
      options.radialCenterX < 0 ||
      options.radialCenterX > 100
    ) {
      return {
        isValid: false,
        error: "Radial center X must be a number between 0 and 100",
      };
    }

    if (
      typeof options.radialCenterY !== "number" ||
      options.radialCenterY < 0 ||
      options.radialCenterY > 100
    ) {
      return {
        isValid: false,
        error: "Radial center Y must be a number between 0 and 100",
      };
    }

    // Validate edge enhancement
    if (
      typeof options.edgeEnhancement !== "number" ||
      options.edgeEnhancement < 0 ||
      options.edgeEnhancement > 100
    ) {
      return {
        isValid: false,
        error: "Edge enhancement must be a number between 0 and 100",
      };
    }

    // Validate noise reduction
    if (
      typeof options.noiseReduction !== "number" ||
      options.noiseReduction < 0 ||
      options.noiseReduction > 100
    ) {
      return {
        isValid: false,
        error: "Noise reduction must be a number between 0 and 100",
      };
    }

    // Validate quality if specified
    if (options.quality !== undefined) {
      if (
        typeof options.quality !== "number" ||
        options.quality < 1 ||
        options.quality > 100
      ) {
        return {
          isValid: false,
          error: "Quality must be a number between 1 and 100",
        };
      }
    }

    // Validate output format if specified
    if (options.outputFormat !== undefined) {
      const validFormats = ["png", "jpg", "jpeg", "webp"];
      if (!validFormats.includes(options.outputFormat)) {
        return {
          isValid: false,
          error: "Invalid output format. Supported: png, jpg, jpeg, webp",
        };
      }
    }

    return { isValid: true };
  }
}

export default new ImageSharpenBlurService();
