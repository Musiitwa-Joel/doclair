import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface UnblurOptions {
  algorithm: "deconvolution" | "neural" | "adaptive" | "auto";
  strength: number; // 1-100
  radius: number; // 1-10
  iterations: number; // 1-10
  preserveDetails: boolean;
  reduceNoise: boolean;
  enhanceEdges: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface UnblurResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  enhancements: string[];
  clarityScore: number;
}

class ImageUnblurService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-unblur");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`📁 Image unblur temp directory ensured: ${this.tempDir}`);
    } catch (error) {
      logger.error("❌ Failed to create image unblur temp directory:", error);
      throw new Error("Failed to initialize image unblur service");
    }
  }

  public async unblurImage(
    imageBuffer: Buffer,
    filename: string,
    unblurOptions: UnblurOptions
  ): Promise<UnblurResult> {
    const startTime = Date.now();

    logger.info(`🔍 Starting image unblurring: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(unblurOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateUnblurOptions(unblurOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply unblurring processing
      const processedResult = await this.applyUnblurring(
        imageBuffer,
        unblurOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Image unblurring completed in ${processingTime}ms`);
      logger.info(
        `🔍 Applied techniques: ${processedResult.enhancements.join(", ")}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        enhancements: processedResult.enhancements,
        clarityScore: processedResult.clarityScore,
      };
    } catch (error) {
      logger.error(`❌ Image unblurring failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyUnblurring(
    imageBuffer: Buffer,
    options: UnblurOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    clarityScore: number;
  }> {
    const enhancements: string[] = [];

    try {
      // Try Sharp first if available
      return await this.unblurWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        enhancements
      );
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available for unblurring, trying Canvas API");

      try {
        return await this.unblurWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for unblurring, using mock processing"
        );
        return await this.createMockUnblurredImage(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      }
    }
  }

  private async unblurWithSharp(
    imageBuffer: Buffer,
    options: UnblurOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    clarityScore: number;
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different unblurring techniques based on the algorithm
      switch (options.algorithm) {
        case "deconvolution":
          // Simulate deconvolution with sharpening
          const sharpenAmount = (options.strength / 100) * 2;
          pipeline = pipeline.sharpen({
            sigma: options.radius * 0.5,
            flat: 1,
            jagged: 1 + sharpenAmount,
          });
          enhancements.push("Deconvolution algorithm");
          break;

        case "neural":
          // Simulate neural enhancement with multiple operations
          pipeline = pipeline.sharpen({
            sigma: options.radius * 0.4,
            flat: 1,
            jagged: 1.5,
          });
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 1.1,
            hue: 0,
          });
          enhancements.push("Neural enhancement");
          break;

        case "adaptive":
          // Simulate adaptive sharpening
          pipeline = pipeline.sharpen({
            sigma: options.radius * 0.6,
            flat: 0.8,
            jagged: 1.8,
          });
          enhancements.push("Adaptive sharpening");
          break;

        case "auto":
        default:
          // Auto mode combines multiple techniques
          pipeline = pipeline.sharpen({
            sigma: options.radius * 0.5,
            flat: 1,
            jagged: 1.5,
          });
          pipeline = pipeline.modulate({
            brightness: 1.02,
            saturation: 1.05,
            hue: 0,
          });
          enhancements.push("Auto unblur enhancement");
          break;
      }

      // Apply additional enhancements based on options
      if (options.preserveDetails) {
        // Enhance details while preserving structure
        pipeline = pipeline.sharpen({
          sigma: 0.8,
          flat: 0.5,
          jagged: 1.2,
        });
        enhancements.push("Detail preservation");
      }

      if (options.reduceNoise) {
        // Apply noise reduction
        pipeline = pipeline.median(Math.min(3, Math.ceil(options.radius / 2)));
        enhancements.push("Noise reduction");
      }

      if (options.enhanceEdges) {
        // Enhance edges
        pipeline = pipeline.convolve({
          width: 3,
          height: 3,
          kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        });
        enhancements.push("Edge enhancement");
      }

      // Apply iterations if specified
      if (options.iterations > 1) {
        // We can't actually repeat the operations in Sharp's pipeline,
        // but we can increase the strength of operations to simulate it
        const iterationFactor = Math.min(2, 1 + (options.iterations - 1) * 0.2);
        pipeline = pipeline.sharpen({
          sigma: options.radius * 0.3 * iterationFactor,
          flat: 1,
          jagged: 1.5 * iterationFactor,
        });
        enhancements.push(`${options.iterations}x iterations`);
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

      // Calculate clarity score based on enhancements applied
      const clarityScore = this.calculateClarityScore(enhancements, options);

      logger.info("✅ Processed with Sharp");
      return {
        buffer: processedBuffer,
        dimensions,
        enhancements,
        clarityScore,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async unblurWithCanvas(
    imageBuffer: Buffer,
    options: UnblurOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    clarityScore: number;
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

      // Apply different unblurring techniques based on the algorithm
      switch (options.algorithm) {
        case "deconvolution":
          this.applyDeconvolution(data, canvas.width, canvas.height, options);
          enhancements.push("Deconvolution algorithm");
          break;

        case "neural":
          this.applyNeuralUnblur(data, canvas.width, canvas.height, options);
          enhancements.push("Neural enhancement");
          break;

        case "adaptive":
          this.applyAdaptiveUnblur(data, canvas.width, canvas.height, options);
          enhancements.push("Adaptive sharpening");
          break;

        case "auto":
        default:
          this.applyAutoUnblur(data, canvas.width, canvas.height, options);
          enhancements.push("Auto unblur enhancement");
          break;
      }

      // Apply additional enhancements based on options
      if (options.preserveDetails) {
        this.applyDetailPreservation(data, canvas.width, canvas.height);
        enhancements.push("Detail preservation");
      }

      if (options.reduceNoise) {
        this.applyNoiseReduction(data, canvas.width, canvas.height);
        enhancements.push("Noise reduction");
      }

      if (options.enhanceEdges) {
        this.applyEdgeEnhancement(data, canvas.width, canvas.height);
        enhancements.push("Edge enhancement");
      }

      // Apply iterations if specified
      if (options.iterations > 1) {
        for (let i = 1; i < options.iterations; i++) {
          this.applyAdditionalIteration(
            data,
            canvas.width,
            canvas.height,
            options
          );
        }
        enhancements.push(`${options.iterations}x iterations`);
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

      // Calculate clarity score
      const clarityScore = this.calculateClarityScore(enhancements, options);

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvas.width, height: canvas.height },
        enhancements,
        clarityScore,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Deconvolution algorithm (simulated)
  private applyDeconvolution(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: UnblurOptions
  ): void {
    const strength = options.strength / 100;
    const radius = options.radius;

    // Create a sharpening kernel based on the blur radius
    const kernelSize = Math.max(3, Math.min(7, Math.floor(radius * 2) + 1));
    const kernel = this.createDeconvolutionKernel(kernelSize, strength);

    this.applyConvolutionFilter(data, width, height, kernel);
  }

  // Create a deconvolution kernel
  private createDeconvolutionKernel(size: number, strength: number): number[] {
    const kernel: number[] = [];
    const center = Math.floor(size / 2);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x === center && y === center) {
          kernel.push(1 + (size * size - 1) * strength);
        } else {
          kernel.push(-strength);
        }
      }
    }

    return kernel;
  }

  // Simulated neural unblur
  private applyNeuralUnblur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: UnblurOptions
  ): void {
    const strength = options.strength / 100;

    // First apply edge detection
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const edgeData = new Uint8ClampedArray(data);
    this.applyConvolutionFilter(
      edgeData,
      width,
      height,
      edgeKernel,
      0.5 * strength
    );

    // Then apply sharpening
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    this.applyConvolutionFilter(data, width, height, sharpenKernel, strength);

    // Blend edge detection with sharpened image
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + edgeData[i] * 0.3));
      data[i + 1] = Math.max(
        0,
        Math.min(255, data[i + 1] + edgeData[i + 1] * 0.3)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, data[i + 2] + edgeData[i + 2] * 0.3)
      );
    }
  }

  // Adaptive unblur
  private applyAdaptiveUnblur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: UnblurOptions
  ): void {
    const strength = options.strength / 100;
    const radius = options.radius;

    // Create a copy of the original data
    const original = new Uint8ClampedArray(data);

    // Apply strong sharpening
    const sharpenKernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];

    this.applyConvolutionFilter(data, width, height, sharpenKernel, strength);

    // Calculate local variance for each pixel (simplified)
    const varianceMap = new Float32Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        let sumSq = 0;
        let count = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const val =
              (original[idx] + original[idx + 1] + original[idx + 2]) / 3;
            sum += val;
            sumSq += val * val;
            count++;
          }
        }

        const mean = sum / count;
        const variance = sumSq / count - mean * mean;
        varianceMap[y * width + x] = variance;
      }
    }

    // Normalize variance map
    let maxVariance = 0;
    for (let i = 0; i < varianceMap.length; i++) {
      maxVariance = Math.max(maxVariance, varianceMap[i]);
    }

    if (maxVariance > 0) {
      for (let i = 0; i < varianceMap.length; i++) {
        varianceMap[i] /= maxVariance;
      }
    }

    // Blend original and sharpened based on variance
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const blendFactor = Math.min(
          1,
          varianceMap[y * width + x] * (1 + strength)
        );

        data[idx] = original[idx] * (1 - blendFactor) + data[idx] * blendFactor;
        data[idx + 1] =
          original[idx + 1] * (1 - blendFactor) + data[idx + 1] * blendFactor;
        data[idx + 2] =
          original[idx + 2] * (1 - blendFactor) + data[idx + 2] * blendFactor;
      }
    }
  }

  // Auto unblur
  private applyAutoUnblur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: UnblurOptions
  ): void {
    const strength = options.strength / 100;

    // Apply a combination of techniques

    // 1. Enhance contrast
    this.enhanceContrast(data, 1.1 + strength * 0.2);

    // 2. Apply sharpening
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    this.applyConvolutionFilter(data, width, height, sharpenKernel, strength);

    // 3. Enhance edges
    const edgeKernel = [-0.1, -0.1, -0.1, -0.1, 1.8, -0.1, -0.1, -0.1, -0.1];

    this.applyConvolutionFilter(
      data,
      width,
      height,
      edgeKernel,
      strength * 0.5
    );
  }

  // Detail preservation
  private applyDetailPreservation(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Create a copy of the original data
    const original = new Uint8ClampedArray(data);

    // Apply a slight blur to reduce noise
    const blurKernel = [
      1 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      4 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      1 / 16,
    ];

    this.applyConvolutionFilter(data, width, height, blurKernel);

    // Calculate high-frequency details by subtracting blurred from original
    const details = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
      details[i] = Math.max(0, original[i] - data[i] + 128);
      details[i + 1] = Math.max(0, original[i + 1] - data[i + 1] + 128);
      details[i + 2] = Math.max(0, original[i + 2] - data[i + 2] + 128);
      details[i + 3] = original[i + 3];
    }

    // Enhance details and add back to the image
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        0,
        Math.min(255, original[i] + (details[i] - 128) * 0.5)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, original[i + 1] + (details[i + 1] - 128) * 0.5)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, original[i + 2] + (details[i + 2] - 128) * 0.5)
      );
    }
  }

  // Noise reduction
  private applyNoiseReduction(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const output = new Uint8ClampedArray(data);
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;

        // Get surrounding pixels
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            rValues.push(data[neighborIdx]);
            gValues.push(data[neighborIdx + 1]);
            bValues.push(data[neighborIdx + 2]);
          }
        }

        // Sort and get median
        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);

        const medianIdx = Math.floor(rValues.length / 2);
        output[idx] = rValues[medianIdx];
        output[idx + 1] = gValues[medianIdx];
        output[idx + 2] = bValues[medianIdx];
      }
    }

    data.set(output);
  }

  // Edge enhancement
  private applyEdgeEnhancement(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const edgeData = new Uint8ClampedArray(data.length);
    edgeData.set(data);

    this.applyConvolutionFilter(edgeData, width, height, edgeKernel, 0.5);

    // Blend edge data with original
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * 0.7 + edgeData[i] * 0.3));
      data[i + 1] = Math.max(
        0,
        Math.min(255, data[i + 1] * 0.7 + edgeData[i + 1] * 0.3)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, data[i + 2] * 0.7 + edgeData[i + 2] * 0.3)
      );
    }
  }

  // Apply additional iteration of unblurring
  private applyAdditionalIteration(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: UnblurOptions
  ): void {
    const strength = (options.strength / 100) * 0.5; // Reduce strength for additional iterations

    // Apply a simple sharpening kernel
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    this.applyConvolutionFilter(data, width, height, sharpenKernel, strength);
  }

  // Enhance contrast
  private enhanceContrast(data: Uint8ClampedArray, factor: number): void {
    // Find average luminance
    let totalLuminance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }
    const avgLuminance = totalLuminance / (data.length / 4);

    // Apply contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        0,
        Math.min(255, avgLuminance + factor * (data[i] - avgLuminance))
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, avgLuminance + factor * (data[i + 1] - avgLuminance))
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, avgLuminance + factor * (data[i + 2] - avgLuminance))
      );
    }
  }

  // Convolution filter helper
  private applyConvolutionFilter(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[],
    factor: number = 1.0
  ): void {
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
        output[idx] = Math.max(0, Math.min(255, r * factor));
        output[idx + 1] = Math.max(0, Math.min(255, g * factor));
        output[idx + 2] = Math.max(0, Math.min(255, b * factor));
      }
    }

    data.set(output);
  }

  private calculateClarityScore(
    enhancements: string[],
    options: UnblurOptions
  ): number {
    // Base score
    let score = 7.0;

    // Add points for each enhancement
    if (enhancements.includes("Deconvolution algorithm")) score += 0.8;
    if (enhancements.includes("Neural enhancement")) score += 1.0;
    if (enhancements.includes("Adaptive sharpening")) score += 0.7;
    if (enhancements.includes("Auto unblur enhancement")) score += 0.6;
    if (enhancements.includes("Detail preservation")) score += 0.4;
    if (enhancements.includes("Noise reduction")) score += 0.3;
    if (enhancements.includes("Edge enhancement")) score += 0.5;

    // Adjust based on strength and iterations
    score += (options.strength / 100) * 0.5;
    score += (options.iterations - 1) * 0.2;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockUnblurredImage(
    imageBuffer: Buffer,
    options: UnblurOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    clarityScore: number;
  }> {
    logger.warn(
      "⚠️ Using mock unblurring - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    enhancements.push("Mock unblurring applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      enhancements,
      clarityScore: 7.0,
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

  public validateUnblurOptions(options: UnblurOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Unblur options are required" };
    }

    // Validate algorithm
    const validAlgorithms = ["deconvolution", "neural", "adaptive", "auto"];
    if (!validAlgorithms.includes(options.algorithm)) {
      return {
        isValid: false,
        error:
          "Invalid algorithm. Supported: deconvolution, neural, adaptive, auto",
      };
    }

    // Validate strength
    if (
      typeof options.strength !== "number" ||
      options.strength < 1 ||
      options.strength > 100
    ) {
      return {
        isValid: false,
        error: "Strength must be a number between 1 and 100",
      };
    }

    // Validate radius
    if (
      typeof options.radius !== "number" ||
      options.radius < 1 ||
      options.radius > 10
    ) {
      return {
        isValid: false,
        error: "Radius must be a number between 1 and 10",
      };
    }

    // Validate iterations
    if (
      typeof options.iterations !== "number" ||
      options.iterations < 1 ||
      options.iterations > 10
    ) {
      return {
        isValid: false,
        error: "Iterations must be a number between 1 and 10",
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

export default new ImageUnblurService();
