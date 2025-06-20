import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface RestoreOptions {
  enhanceMode: "auto" | "colorize" | "enhance" | "repair";
  colorizeStrength: number;
  enhanceDetails: boolean;
  repairDamage: boolean;
  removeNoise: boolean;
  sharpenImage: boolean;
  enhanceContrast: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface RestoreResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  enhancements: string[];
  restorationScore: number;
}

class ImageRestoreService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-restore");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image restoration temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image restoration temp directory:",
        error
      );
      throw new Error("Failed to initialize image restoration service");
    }
  }

  public async restorePhoto(
    imageBuffer: Buffer,
    filename: string,
    restoreOptions: RestoreOptions
  ): Promise<RestoreResult> {
    const startTime = Date.now();

    logger.info(`🖼️ Starting photo restoration: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(restoreOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateRestoreOptions(restoreOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply restoration processing
      const processedResult = await this.applyRestoration(
        imageBuffer,
        restoreOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Photo restoration completed in ${processingTime}ms`);
      logger.info(
        `🖼️ Applied enhancements: ${processedResult.enhancements.join(", ")}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        enhancements: processedResult.enhancements,
        restorationScore: processedResult.restorationScore,
      };
    } catch (error) {
      logger.error(`❌ Photo restoration failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyRestoration(
    imageBuffer: Buffer,
    options: RestoreOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    restorationScore: number;
  }> {
    const enhancements: string[] = [];

    try {
      // Try Sharp first if available
      return await this.restoreWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        enhancements
      );
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available for restoration, trying Canvas API");

      try {
        return await this.restoreWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for restoration, using mock processing"
        );
        return await this.createMockRestoredImage(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      }
    }
  }

  private async restoreWithSharp(
    imageBuffer: Buffer,
    options: RestoreOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    restorationScore: number;
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different processing based on the enhancement mode
      switch (options.enhanceMode) {
        case "colorize":
          // Apply colorization (simulated with sepia tone and color adjustments)
          pipeline = pipeline.tint({ r: 255, g: 240, b: 230 });
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.0 + options.colorizeStrength / 100,
            hue: 15,
          });
          enhancements.push("Colorization");
          break;

        case "enhance":
          // Apply detail enhancement
          pipeline = pipeline.sharpen({
            sigma: 1.2,
            flat: 1,
            jagged: 2,
          });
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.1,
            hue: 0,
          });
          enhancements.push("Detail enhancement");
          break;

        case "repair":
          // Apply damage repair (simulated with noise reduction and contrast)
          pipeline = pipeline.median(3);
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 1.0,
            hue: 0,
          });
          enhancements.push("Damage repair");
          break;

        case "auto":
        default:
          // Apply a combination of enhancements
          pipeline = pipeline.normalize();
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.05,
            hue: 0,
          });
          pipeline = pipeline.sharpen({
            sigma: 1.0,
            flat: 1,
            jagged: 1.5,
          });
          enhancements.push("Auto enhancement");
          break;
      }

      // Apply additional enhancements based on options
      if (options.enhanceDetails) {
        pipeline = pipeline.sharpen({
          sigma: 1.5,
          flat: 1,
          jagged: 2,
        });
        enhancements.push("Detail enhancement");
      }

      if (options.removeNoise) {
        pipeline = pipeline.median(2);
        enhancements.push("Noise reduction");
      }

      if (options.sharpenImage) {
        pipeline = pipeline.sharpen({
          sigma: 1.0,
          flat: 1,
          jagged: 1.5,
        });
        enhancements.push("Image sharpening");
      }

      if (options.enhanceContrast) {
        pipeline = pipeline.linear(1.1, -0.1);
        enhancements.push("Contrast enhancement");
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

      // Calculate restoration score based on enhancements applied
      const restorationScore = this.calculateRestorationScore(
        enhancements,
        options
      );

      logger.info("✅ Processed with Sharp");
      return {
        buffer: processedBuffer,
        dimensions,
        enhancements,
        restorationScore,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async restoreWithCanvas(
    imageBuffer: Buffer,
    options: RestoreOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    restorationScore: number;
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

      // Apply different processing based on the enhancement mode
      switch (options.enhanceMode) {
        case "colorize":
          this.applyColorization(data, options.colorizeStrength);
          enhancements.push("Colorization");
          break;

        case "enhance":
          this.applyDetailEnhancement(data, canvas.width, canvas.height);
          enhancements.push("Detail enhancement");
          break;

        case "repair":
          this.applyDamageRepair(data, canvas.width, canvas.height);
          enhancements.push("Damage repair");
          break;

        case "auto":
        default:
          this.applyAutoEnhancement(data, canvas.width, canvas.height);
          enhancements.push("Auto enhancement");
          break;
      }

      // Apply additional enhancements based on options
      if (options.enhanceDetails) {
        this.applyDetailEnhancement(data, canvas.width, canvas.height);
        if (!enhancements.includes("Detail enhancement")) {
          enhancements.push("Detail enhancement");
        }
      }

      if (options.removeNoise) {
        this.applyNoiseReduction(data, canvas.width, canvas.height);
        enhancements.push("Noise reduction");
      }

      if (options.sharpenImage) {
        this.applySharpen(data, canvas.width, canvas.height);
        enhancements.push("Image sharpening");
      }

      if (options.enhanceContrast) {
        this.applyContrastEnhancement(data);
        enhancements.push("Contrast enhancement");
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

      // Calculate restoration score
      const restorationScore = this.calculateRestorationScore(
        enhancements,
        options
      );

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvas.width, height: canvas.height },
        enhancements,
        restorationScore,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  private applyColorization(data: Uint8ClampedArray, strength: number): void {
    const colorStrength = strength / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // Apply sepia-like colorization
      let r = gray + 40 * colorStrength;
      let g = gray + 20 * colorStrength;
      let b = gray - 20 * colorStrength;

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  private applyDetailEnhancement(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const output = new Uint8ClampedArray(data);

    // Simple sharpening kernel
    const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);

            r += data[idx] * kernel[kernelIdx];
            g += data[idx + 1] * kernel[kernelIdx];
            b += data[idx + 2] * kernel[kernelIdx];
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = Math.max(0, Math.min(255, r));
        output[idx + 1] = Math.max(0, Math.min(255, g));
        output[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }

    data.set(output);
  }

  private applyDamageRepair(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const output = new Uint8ClampedArray(data);

    // Apply median filter to remove scratches and dust
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get surrounding pixels
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
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

  private applyAutoEnhancement(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // Find min/max values for auto levels
    let minR = 255,
      maxR = 0;
    let minG = 255,
      maxG = 0;
    let minB = 255,
      maxB = 0;

    for (let i = 0; i < data.length; i += 4) {
      minR = Math.min(minR, data[i]);
      maxR = Math.max(maxR, data[i]);
      minG = Math.min(minG, data[i + 1]);
      maxG = Math.max(maxG, data[i + 1]);
      minB = Math.min(minB, data[i + 2]);
      maxB = Math.max(maxB, data[i + 2]);
    }

    // Apply auto levels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - minR) / (maxR - minR)) * 255;
      data[i + 1] = ((data[i + 1] - minG) / (maxG - minG)) * 255;
      data[i + 2] = ((data[i + 2] - minB) / (maxB - minB)) * 255;
    }

    // Apply light sharpening
    this.applySharpen(data, width, height, 0.5);
  }

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

  private applySharpen(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    strength: number = 1.0
  ): void {
    const output = new Uint8ClampedArray(data);

    // Sharpening kernel
    const kernel = [
      -strength,
      -strength,
      -strength,
      -strength,
      1 + 8 * strength,
      -strength,
      -strength,
      -strength,
      -strength,
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);

            r += data[idx] * kernel[kernelIdx];
            g += data[idx + 1] * kernel[kernelIdx];
            b += data[idx + 2] * kernel[kernelIdx];
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = Math.max(0, Math.min(255, r));
        output[idx + 1] = Math.max(0, Math.min(255, g));
        output[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }

    data.set(output);
  }

  private applyContrastEnhancement(data: Uint8ClampedArray): void {
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
    const factor = 1.2; // Contrast factor
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

  private calculateRestorationScore(
    enhancements: string[],
    options: RestoreOptions
  ): number {
    // Base score
    let score = 7.5;

    // Add points for each enhancement
    if (enhancements.includes("Colorization")) score += 0.8;
    if (enhancements.includes("Detail enhancement")) score += 0.5;
    if (enhancements.includes("Damage repair")) score += 0.7;
    if (enhancements.includes("Noise reduction")) score += 0.4;
    if (enhancements.includes("Image sharpening")) score += 0.3;
    if (enhancements.includes("Contrast enhancement")) score += 0.3;
    if (enhancements.includes("Auto enhancement")) score += 0.5;

    // Adjust based on mode
    if (options.enhanceMode === "auto") score += 0.2;
    if (options.enhanceMode === "colorize") score += 0.5;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockRestoredImage(
    imageBuffer: Buffer,
    options: RestoreOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    restorationScore: number;
  }> {
    logger.warn(
      "⚠️ Using mock restoration - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    enhancements.push("Mock restoration applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      enhancements,
      restorationScore: 7.5,
    };
  }

  private isValidImageBuffer(buffer: Buffer): boolean {
    try {
      const signatures = [
        [0xff, 0xd8, 0xff], // JPEG
        [0x89, 0x50, 0x4e, 0x47], // PNG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
        [0x49, 0x49, 0x2a, 0x00], // TIFF (little endian)
        [0x4d, 0x4d, 0x00, 0x2a], // TIFF (big endian)
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

  public validateRestoreOptions(options: RestoreOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Restoration options are required" };
    }

    // Validate enhance mode
    const validModes = ["auto", "colorize", "enhance", "repair"];
    if (!validModes.includes(options.enhanceMode)) {
      return {
        isValid: false,
        error:
          "Invalid enhancement mode. Supported: auto, colorize, enhance, repair",
      };
    }

    // Validate colorize strength if in colorize mode
    if (
      options.enhanceMode === "colorize" &&
      (typeof options.colorizeStrength !== "number" ||
        options.colorizeStrength < 1 ||
        options.colorizeStrength > 100)
    ) {
      return {
        isValid: false,
        error: "Colorization strength must be a number between 1 and 100",
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

export default new ImageRestoreService();
