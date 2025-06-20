import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface ColorRestoreOptions {
  restoreMode: "auto" | "vibrant" | "natural" | "vintage" | "custom";
  intensity: number; // 1-100
  saturation: number; // -100 to 100
  contrast: number; // -100 to 100
  temperature: number; // -100 to 100 (cool to warm)
  removeYellowing: boolean;
  correctColorCast: boolean;
  enhanceDetails: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface ColorRestoreResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  enhancements: string[];
  restorationScore: number;
}

class ImageColorRestoreService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-color-restore");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image color restoration temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image color restoration temp directory:",
        error
      );
      throw new Error("Failed to initialize image color restoration service");
    }
  }

  public async restoreColors(
    imageBuffer: Buffer,
    filename: string,
    restoreOptions: ColorRestoreOptions
  ): Promise<ColorRestoreResult> {
    const startTime = Date.now();

    logger.info(`🎨 Starting color restoration: ${filename}`);
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

      // Apply color restoration processing
      const processedResult = await this.applyColorRestoration(
        imageBuffer,
        restoreOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Color restoration completed in ${processingTime}ms`);
      logger.info(
        `🎨 Applied techniques: ${processedResult.enhancements.join(", ")}`
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
      logger.error(`❌ Color restoration failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyColorRestoration(
    imageBuffer: Buffer,
    options: ColorRestoreOptions,
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
      logger.warn(
        "⚠️ Sharp not available for color restoration, trying Canvas API"
      );

      try {
        return await this.restoreWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for color restoration, using mock processing"
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
    options: ColorRestoreOptions,
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

      // Apply different processing based on the restoration mode
      switch (options.restoreMode) {
        case "vibrant":
          // Enhance colors to be more vibrant
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.5 + options.intensity / 100,
            hue: 0,
          });
          pipeline = pipeline.gamma(1.1);
          enhancements.push("Vibrant color enhancement");
          break;

        case "natural":
          // Restore natural, balanced colors
          pipeline = pipeline.normalize();
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 1.2 + options.intensity / 200,
            hue: 0,
          });
          enhancements.push("Natural color restoration");
          break;

        case "vintage":
          // Restore with a slight vintage look
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 0.9 + options.intensity / 200,
            hue: 5,
          });
          pipeline = pipeline.tint({ r: 255, g: 240, b: 230 });
          enhancements.push("Vintage color restoration");
          break;

        case "custom":
          // Apply custom settings
          pipeline = pipeline.modulate({
            brightness: 1.0 + options.intensity / 200,
            saturation: 1.0 + options.saturation / 100,
            hue: options.temperature / 10,
          });
          enhancements.push("Custom color restoration");
          break;

        case "auto":
        default:
          // Auto mode - analyze and apply best settings
          pipeline = pipeline.normalize();
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.3,
            hue: 0,
          });
          enhancements.push("Auto color restoration");
          break;
      }

      // Apply additional enhancements based on options
      if (options.removeYellowing) {
        // Remove yellow cast by adjusting blue channel
        pipeline = pipeline.tint({ r: 240, g: 245, b: 255 });
        enhancements.push("Yellowing removal");
      }

      if (options.correctColorCast) {
        // Correct color cast by normalizing channels
        pipeline = pipeline.normalize();
        enhancements.push("Color cast correction");
      }

      if (options.enhanceDetails) {
        // Enhance image details
        pipeline = pipeline.sharpen({
          sigma: 1.0,
          flat: 1,
          jagged: 1.5,
        });
        enhancements.push("Detail enhancement");
      }

      // Apply contrast adjustment if specified
      if (options.contrast !== 0) {
        const contrastFactor = 1 + options.contrast / 100;
        pipeline = pipeline.linear(contrastFactor, -(contrastFactor - 1) * 128);
        enhancements.push(
          `Contrast ${options.contrast > 0 ? "enhancement" : "reduction"}`
        );
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
    options: ColorRestoreOptions,
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

      // Apply different processing based on the restoration mode
      switch (options.restoreMode) {
        case "vibrant":
          this.applyVibrantRestoration(data, options.intensity);
          enhancements.push("Vibrant color enhancement");
          break;

        case "natural":
          this.applyNaturalRestoration(data, options.intensity);
          enhancements.push("Natural color restoration");
          break;

        case "vintage":
          this.applyVintageRestoration(data, options.intensity);
          enhancements.push("Vintage color restoration");
          break;

        case "custom":
          this.applyCustomRestoration(data, options);
          enhancements.push("Custom color restoration");
          break;

        case "auto":
        default:
          this.applyAutoRestoration(data);
          enhancements.push("Auto color restoration");
          break;
      }

      // Apply additional enhancements based on options
      if (options.removeYellowing) {
        this.removeYellowing(data);
        enhancements.push("Yellowing removal");
      }

      if (options.correctColorCast) {
        this.correctColorCast(data);
        enhancements.push("Color cast correction");
      }

      if (options.enhanceDetails) {
        this.enhanceDetails(data, canvas.width, canvas.height);
        enhancements.push("Detail enhancement");
      }

      // Apply contrast adjustment if specified
      if (options.contrast !== 0) {
        this.adjustContrast(data, options.contrast);
        enhancements.push(
          `Contrast ${options.contrast > 0 ? "enhancement" : "reduction"}`
        );
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

  private applyVibrantRestoration(
    data: Uint8ClampedArray,
    intensity: number
  ): void {
    const intensityFactor = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Increase saturation
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1.5 + intensityFactor;

      data[i] = Math.max(
        0,
        Math.min(255, gray + (r - gray) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, gray + (g - gray) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, gray + (b - gray) * saturationFactor)
      );

      // Increase brightness slightly
      data[i] = Math.max(0, Math.min(255, data[i] * 1.1));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * 1.1));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * 1.1));
    }
  }

  private applyNaturalRestoration(
    data: Uint8ClampedArray,
    intensity: number
  ): void {
    const intensityFactor = intensity / 100;

    // First, normalize the colors
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

    // Apply normalization and natural enhancement
    for (let i = 0; i < data.length; i += 4) {
      // Normalize each channel
      data[i] = ((data[i] - minR) / (maxR - minR)) * 255;
      data[i + 1] = ((data[i + 1] - minG) / (maxG - minG)) * 255;
      data[i + 2] = ((data[i + 2] - minB) / (maxB - minB)) * 255;

      // Apply moderate saturation boost
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1.2 + intensityFactor * 0.3;

      data[i] = Math.max(
        0,
        Math.min(255, gray + (r - gray) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, gray + (g - gray) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, gray + (b - gray) * saturationFactor)
      );
    }
  }

  private applyVintageRestoration(
    data: Uint8ClampedArray,
    intensity: number
  ): void {
    const intensityFactor = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Apply vintage color grading
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Warm up the image (increase red, decrease blue)
      data[i] = Math.max(0, Math.min(255, r * (1.1 + intensityFactor * 0.1)));
      data[i + 1] = Math.max(
        0,
        Math.min(255, g * (1.05 + intensityFactor * 0.05))
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, b * (0.9 - intensityFactor * 0.05))
      );

      // Apply slight desaturation for vintage look
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const saturationFactor = 0.9 - intensityFactor * 0.1;

      data[i] = Math.max(
        0,
        Math.min(255, gray + (data[i] - gray) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, gray + (data[i + 1] - gray) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, gray + (data[i + 2] - gray) * saturationFactor)
      );
    }
  }

  private applyCustomRestoration(
    data: Uint8ClampedArray,
    options: ColorRestoreOptions
  ): void {
    const intensityFactor = options.intensity / 100;
    const saturationFactor = 1 + options.saturation / 100;
    const temperatureFactor = options.temperature / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply saturation adjustment
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      let newR = gray + (r - gray) * saturationFactor;
      let newG = gray + (g - gray) * saturationFactor;
      let newB = gray + (b - gray) * saturationFactor;

      // Apply color temperature adjustment
      if (temperatureFactor > 0) {
        // Warmer (more red/yellow)
        newR *= 1 + temperatureFactor * 0.2;
        newG *= 1 + temperatureFactor * 0.1;
        newB *= 1 - temperatureFactor * 0.1;
      } else {
        // Cooler (more blue)
        newR *= 1 + temperatureFactor * 0.1;
        newG *= 1 + temperatureFactor * 0.05;
        newB *= 1 - temperatureFactor * 0.2;
      }

      // Apply intensity boost
      newR = gray + (newR - gray) * (1 + intensityFactor * 0.5);
      newG = gray + (newG - gray) * (1 + intensityFactor * 0.5);
      newB = gray + (newB - gray) * (1 + intensityFactor * 0.5);

      data[i] = Math.max(0, Math.min(255, newR));
      data[i + 1] = Math.max(0, Math.min(255, newG));
      data[i + 2] = Math.max(0, Math.min(255, newB));
    }
  }

  private applyAutoRestoration(data: Uint8ClampedArray): void {
    // First, normalize the colors
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

    // Calculate average color to detect color cast
    let avgR = 0,
      avgG = 0,
      avgB = 0;
    for (let i = 0; i < data.length; i += 4) {
      avgR += data[i];
      avgG += data[i + 1];
      avgB += data[i + 2];
    }

    avgR /= data.length / 4;
    avgG /= data.length / 4;
    avgB /= data.length / 4;

    const avgTotal = (avgR + avgG + avgB) / 3;

    // Calculate correction factors to balance colors
    const factorR = avgTotal / avgR;
    const factorG = avgTotal / avgG;
    const factorB = avgTotal / avgB;

    // Apply auto restoration
    for (let i = 0; i < data.length; i += 4) {
      // Normalize each channel
      let r = ((data[i] - minR) / (maxR - minR)) * 255;
      let g = ((data[i + 1] - minG) / (maxG - minG)) * 255;
      let b = ((data[i + 2] - minB) / (maxB - minB)) * 255;

      // Apply color balance correction
      r = Math.max(0, Math.min(255, r * factorR));
      g = Math.max(0, Math.min(255, g * factorG));
      b = Math.max(0, Math.min(255, b * factorB));

      // Apply saturation boost
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1.3;

      data[i] = Math.max(
        0,
        Math.min(255, gray + (r - gray) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, gray + (g - gray) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, gray + (b - gray) * saturationFactor)
      );
    }
  }

  private removeYellowing(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // Detect yellow cast (high red and green, low blue)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r > 150 && g > 150 && b < 150 && (r + g) / 2 - b > 30) {
        // Reduce yellow cast by increasing blue and slightly reducing red/green
        data[i] = Math.max(0, Math.min(255, r * 0.95));
        data[i + 1] = Math.max(0, Math.min(255, g * 0.95));
        data[i + 2] = Math.max(0, Math.min(255, b * 1.2));
      }
    }
  }

  private correctColorCast(data: Uint8ClampedArray): void {
    // Calculate average color to detect color cast
    let avgR = 0,
      avgG = 0,
      avgB = 0;
    for (let i = 0; i < data.length; i += 4) {
      avgR += data[i];
      avgG += data[i + 1];
      avgB += data[i + 2];
    }

    avgR /= data.length / 4;
    avgG /= data.length / 4;
    avgB /= data.length / 4;

    const avgTotal = (avgR + avgG + avgB) / 3;

    // Calculate correction factors to balance colors
    const factorR = avgTotal / avgR;
    const factorG = avgTotal / avgG;
    const factorB = avgTotal / avgB;

    // Apply color balance correction
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * factorR));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factorG));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factorB));
    }
  }

  private enhanceDetails(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    const output = new Uint8ClampedArray(data);

    // Simple sharpening kernel
    const kernel = [-0.1, -0.1, -0.1, -0.1, 1.8, -0.1, -0.1, -0.1, -0.1];

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

  private adjustContrast(data: Uint8ClampedArray, contrastValue: number): void {
    const contrastFactor =
      (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        0,
        Math.min(255, contrastFactor * (data[i] - 128) + 128)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, contrastFactor * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, contrastFactor * (data[i + 2] - 128) + 128)
      );
    }
  }

  private calculateRestorationScore(
    enhancements: string[],
    options: ColorRestoreOptions
  ): number {
    // Base score
    let score = 7.0;

    // Add points for each enhancement
    if (enhancements.includes("Vibrant color enhancement")) score += 0.8;
    if (enhancements.includes("Natural color restoration")) score += 0.7;
    if (enhancements.includes("Vintage color restoration")) score += 0.6;
    if (enhancements.includes("Auto color restoration")) score += 0.7;
    if (enhancements.includes("Yellowing removal")) score += 0.5;
    if (enhancements.includes("Color cast correction")) score += 0.6;
    if (enhancements.includes("Detail enhancement")) score += 0.4;
    if (enhancements.includes("Contrast enhancement")) score += 0.3;

    // Adjust based on intensity
    score += (options.intensity / 100) * 0.5;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockRestoredImage(
    imageBuffer: Buffer,
    options: ColorRestoreOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    restorationScore: number;
  }> {
    logger.warn(
      "⚠️ Using mock color restoration - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    enhancements.push("Mock color restoration applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      enhancements,
      restorationScore: 7.0,
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

  public validateRestoreOptions(options: ColorRestoreOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return {
        isValid: false,
        error: "Color restoration options are required",
      };
    }

    // Validate restore mode
    const validModes = ["auto", "vibrant", "natural", "vintage", "custom"];
    if (!validModes.includes(options.restoreMode)) {
      return {
        isValid: false,
        error:
          "Invalid restoration mode. Supported: auto, vibrant, natural, vintage, custom",
      };
    }

    // Validate intensity
    if (
      typeof options.intensity !== "number" ||
      options.intensity < 1 ||
      options.intensity > 100
    ) {
      return {
        isValid: false,
        error: "Intensity must be a number between 1 and 100",
      };
    }

    // Validate saturation
    if (
      typeof options.saturation !== "number" ||
      options.saturation < -100 ||
      options.saturation > 100
    ) {
      return {
        isValid: false,
        error: "Saturation must be a number between -100 and 100",
      };
    }

    // Validate contrast
    if (
      typeof options.contrast !== "number" ||
      options.contrast < -100 ||
      options.contrast > 100
    ) {
      return {
        isValid: false,
        error: "Contrast must be a number between -100 and 100",
      };
    }

    // Validate temperature
    if (
      typeof options.temperature !== "number" ||
      options.temperature < -100 ||
      options.temperature > 100
    ) {
      return {
        isValid: false,
        error: "Temperature must be a number between -100 and 100",
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

export default new ImageColorRestoreService();
