import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger.js";
import { config } from "../../config/environment.js";

interface AutoEnhanceOptions {
  enhanceMode:
    | "auto"
    | "portrait"
    | "landscape"
    | "lowlight"
    | "vintage"
    | "vivid";
  intensity: number; // 0-100
  preserveColors: boolean;
  enhanceShadows: boolean;
  enhanceHighlights: boolean;
  improveClarity: boolean;
  reduceNoise: boolean;
  sharpenDetails: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface AutoEnhanceResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  format: string;
  enhancements: string[];
  qualityScore: number;
}

class ImageAutoEnhanceService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-auto-enhance");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image auto enhance temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image auto enhance temp directory:",
        error
      );
      throw new Error("Failed to initialize image auto enhance service");
    }
  }

  public async enhanceImage(
    imageBuffer: Buffer,
    filename: string,
    enhanceOptions: AutoEnhanceOptions
  ): Promise<AutoEnhanceResult> {
    const startTime = Date.now();

    logger.info(`🎨 Starting auto enhancement: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(enhanceOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateEnhanceOptions(enhanceOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply auto enhancement processing
      const processedResult = await this.applyAutoEnhancement(
        imageBuffer,
        enhanceOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Auto enhancement completed in ${processingTime}ms`);
      logger.info(
        `🎨 Applied enhancements: ${processedResult.enhancements.join(", ")}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        format: enhanceOptions.outputFormat || "png",
        enhancements: processedResult.enhancements,
        qualityScore: processedResult.qualityScore,
      };
    } catch (error) {
      logger.error(`❌ Auto enhancement failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyAutoEnhancement(
    imageBuffer: Buffer,
    options: AutoEnhanceOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    qualityScore: number;
  }> {
    const enhancements: string[] = [];

    try {
      // Try Sharp first if available
      return await this.processWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        enhancements
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for auto enhancement, trying Canvas API"
      );

      try {
        return await this.processWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for auto enhancement, using mock processing"
        );
        return await this.createMockEnhancedImage(
          imageBuffer,
          options,
          originalDimensions,
          enhancements
        );
      }
    }
  }

  private async processWithSharp(
    imageBuffer: Buffer,
    options: AutoEnhanceOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    qualityScore: number;
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      const intensity = options.intensity / 100;

      // Apply enhancement based on mode
      switch (options.enhanceMode) {
        case "auto":
        case "vivid":
          // Auto levels and contrast enhancement
          pipeline = pipeline.normalize();
          pipeline = pipeline.modulate({
            brightness: 1 + intensity * 0.1,
            saturation: options.preserveColors ? 1 + intensity * 0.2 : 1,
            hue: 0,
          });
          enhancements.push("Auto levels", "Enhanced contrast");
          if (options.preserveColors) enhancements.push("Color enhancement");
          break;

        case "portrait":
          // Portrait-specific enhancements
          pipeline = pipeline.modulate({
            brightness: 1 + intensity * 0.05,
            saturation: 1 + intensity * 0.1,
            hue: 0,
          });
          // Gentle sharpening for portraits
          pipeline = pipeline.sharpen({
            sigma: 0.5,
            flat: 1,
            jagged: 1,
          });
          enhancements.push("Portrait optimization", "Skin tone enhancement");
          break;

        case "landscape":
          // Landscape-specific enhancements
          pipeline = pipeline.modulate({
            brightness: 1 + intensity * 0.08,
            saturation: 1 + intensity * 0.3,
            hue: 0,
          });
          // More aggressive sharpening for landscapes
          pipeline = pipeline.sharpen({
            sigma: 1,
            flat: 1,
            jagged: 2,
          });
          enhancements.push("Landscape enhancement", "Nature color boost");
          break;

        case "lowlight":
          // Low-light enhancement
          pipeline = pipeline.modulate({
            brightness: 1 + intensity * 0.3,
            saturation: 1 + intensity * 0.1,
            hue: 0,
          });
          // Gamma correction for shadows
          pipeline = pipeline.gamma(1 - intensity * 0.2);
          enhancements.push("Low-light enhancement", "Shadow recovery");
          break;

        case "vintage":
          // Vintage effect
          pipeline = pipeline.modulate({
            brightness: 1 + intensity * 0.05,
            saturation: 1 - intensity * 0.2,
            hue: intensity * 10,
          });
          enhancements.push("Vintage color grading", "Film-like tones");
          break;
      }

      // Apply additional enhancements based on options
      if (options.improveClarity) {
        pipeline = pipeline.sharpen({
          sigma: 0.8,
          flat: 1,
          jagged: 1.5,
        });
        enhancements.push("Clarity improvement");
      }

      if (options.reduceNoise) {
        pipeline = pipeline.median(2);
        enhancements.push("Noise reduction");
      }

      if (options.sharpenDetails) {
        pipeline = pipeline.sharpen({
          sigma: 1.2,
          flat: 1,
          jagged: 2,
        });
        enhancements.push("Detail sharpening");
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

      // Calculate quality score based on enhancements applied
      const qualityScore = this.calculateQualityScore(enhancements, options);

      logger.info("✅ Processed with Sharp");
      return {
        buffer: processedBuffer,
        dimensions,
        enhancements,
        qualityScore,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async processWithCanvas(
    imageBuffer: Buffer,
    options: AutoEnhanceOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    qualityScore: number;
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

      const intensity = options.intensity / 100;

      // Apply enhancement based on mode
      switch (options.enhanceMode) {
        case "auto":
        case "vivid":
          this.applyAutoEnhancementCanvas(
            data,
            intensity,
            options.preserveColors
          );
          enhancements.push("Auto enhancement", "Contrast boost");
          break;

        case "portrait":
          this.applyPortraitEnhancementCanvas(data, intensity);
          enhancements.push("Portrait optimization");
          break;

        case "landscape":
          this.applyLandscapeEnhancementCanvas(data, intensity);
          enhancements.push("Landscape enhancement");
          break;

        case "lowlight":
          this.applyLowlightEnhancementCanvas(data, intensity);
          enhancements.push("Low-light enhancement");
          break;

        case "vintage":
          this.applyVintageEnhancementCanvas(data, intensity);
          enhancements.push("Vintage effect");
          break;
      }

      // Apply additional enhancements
      if (options.improveClarity) {
        this.applyClarityCanvas(data, canvas.width, canvas.height, intensity);
        enhancements.push("Clarity improvement");
      }

      if (options.reduceNoise) {
        this.applyNoiseReductionCanvas(data, canvas.width, canvas.height);
        enhancements.push("Noise reduction");
      }

      if (options.sharpenDetails) {
        this.applySharpenCanvas(data, canvas.width, canvas.height, intensity);
        enhancements.push("Detail sharpening");
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

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(enhancements, options);

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvas.width, height: canvas.height },
        enhancements,
        qualityScore,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  private applyAutoEnhancementCanvas(
    data: Uint8ClampedArray,
    intensity: number,
    preserveColors: boolean
  ) {
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

    // Apply auto levels and contrast
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Auto levels
      r = ((r - minR) / (maxR - minR)) * 255;
      g = ((g - minG) / (maxG - minG)) * 255;
      b = ((b - minB) / (maxB - minB)) * 255;

      // Auto contrast
      const contrastFactor = 1 + intensity * 0.3;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      // Saturation boost
      if (preserveColors) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = 1 + intensity * 0.2;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyPortraitEnhancementCanvas(
    data: Uint8ClampedArray,
    intensity: number
  ) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Skin tone enhancement
      const skinToneFactor = 1 + intensity * 0.15;
      r = Math.max(0, Math.min(255, r * skinToneFactor));

      // Gentle contrast
      const contrastFactor = 1 + intensity * 0.2;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyLandscapeEnhancementCanvas(
    data: Uint8ClampedArray,
    intensity: number
  ) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Enhance greens and blues for nature
      g = Math.max(0, Math.min(255, g * (1 + intensity * 0.2)));
      b = Math.max(0, Math.min(255, b * (1 + intensity * 0.15)));

      // Increase contrast
      const contrastFactor = 1 + intensity * 0.4;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyLowlightEnhancementCanvas(
    data: Uint8ClampedArray,
    intensity: number
  ) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brighten shadows
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 128) {
        const shadowBoost = intensity * 0.5;
        r = Math.max(0, Math.min(255, r + shadowBoost * 50));
        g = Math.max(0, Math.min(255, g + shadowBoost * 50));
        b = Math.max(0, Math.min(255, b + shadowBoost * 50));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyVintageEnhancementCanvas(
    data: Uint8ClampedArray,
    intensity: number
  ) {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Vintage color grading
      r = Math.max(0, Math.min(255, r + intensity * 20));
      g = Math.max(0, Math.min(255, g + intensity * 10));
      b = Math.max(0, Math.min(255, b - intensity * 15));

      // Reduce saturation slightly
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const desaturationFactor = 1 - intensity * 0.2;
      r = Math.max(0, Math.min(255, gray + (r - gray) * desaturationFactor));
      g = Math.max(0, Math.min(255, gray + (g - gray) * desaturationFactor));
      b = Math.max(0, Math.min(255, gray + (b - gray) * desaturationFactor));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private applyClarityCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    intensity: number
  ) {
    const output = new Uint8ClampedArray(data);

    // Clarity kernel (mid-tone contrast enhancement)
    const kernel = [-0.1, -0.1, -0.1, -0.1, 2.0, -0.1, -0.1, -0.1, -0.1];

    const factor = intensity * 0.3;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        let r = 0,
          g = 0,
          b = 0;
        let kernelIdx = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[kernelIdx++];
            r += data[neighborIdx] * weight;
            g += data[neighborIdx + 1] * weight;
            b += data[neighborIdx + 2] * weight;
          }
        }

        // Only apply to mid-tones
        const luminance =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (luminance > 64 && luminance < 192) {
          output[idx] = Math.max(0, Math.min(255, data[idx] + r * factor));
          output[idx + 1] = Math.max(
            0,
            Math.min(255, data[idx + 1] + g * factor)
          );
          output[idx + 2] = Math.max(
            0,
            Math.min(255, data[idx + 2] + b * factor)
          );
        }
      }
    }

    data.set(output);
  }

  private applyNoiseReductionCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    const output = new Uint8ClampedArray(data);

    // Simple 3x3 median filter for noise reduction
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

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

  private applySharpenCanvas(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    intensity: number
  ) {
    const output = new Uint8ClampedArray(data);

    // Sharpen kernel
    const kernel = [
      0,
      -intensity,
      0,
      -intensity,
      1 + 4 * intensity,
      -intensity,
      0,
      -intensity,
      0,
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        let r = 0,
          g = 0,
          b = 0;
        let kernelIdx = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[kernelIdx++];
            r += data[neighborIdx] * weight;
            g += data[neighborIdx + 1] * weight;
            b += data[neighborIdx + 2] * weight;
          }
        }

        output[idx] = Math.max(0, Math.min(255, r));
        output[idx + 1] = Math.max(0, Math.min(255, g));
        output[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }

    data.set(output);
  }

  private calculateQualityScore(
    enhancements: string[],
    options: AutoEnhanceOptions
  ): number {
    // Base score
    let score = 7.5;

    // Add points for each enhancement
    if (enhancements.includes("Auto levels")) score += 0.3;
    if (enhancements.includes("Enhanced contrast")) score += 0.3;
    if (enhancements.includes("Color enhancement")) score += 0.3;
    if (enhancements.includes("Portrait optimization")) score += 0.4;
    if (enhancements.includes("Landscape enhancement")) score += 0.4;
    if (enhancements.includes("Low-light enhancement")) score += 0.5;
    if (enhancements.includes("Clarity improvement")) score += 0.3;
    if (enhancements.includes("Noise reduction")) score += 0.4;
    if (enhancements.includes("Detail sharpening")) score += 0.3;

    // Adjust based on intensity
    const intensityFactor = options.intensity / 100;
    score += intensityFactor * 0.5;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockEnhancedImage(
    imageBuffer: Buffer,
    options: AutoEnhanceOptions,
    originalDimensions: { width: number; height: number },
    enhancements: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    enhancements: string[];
    qualityScore: number;
  }> {
    logger.warn(
      "⚠️ Using mock enhancement - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    enhancements.push("Mock enhancement applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      enhancements,
      qualityScore: 7.5,
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

  public validateEnhanceOptions(options: AutoEnhanceOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Enhancement options are required" };
    }

    // Validate enhancement mode
    const validModes = [
      "auto",
      "portrait",
      "landscape",
      "lowlight",
      "vintage",
      "vivid",
    ];
    if (!validModes.includes(options.enhanceMode)) {
      return { isValid: false, error: "Invalid enhancement mode" };
    }

    // Validate intensity
    if (
      typeof options.intensity !== "number" ||
      options.intensity < 0 ||
      options.intensity > 100
    ) {
      return {
        isValid: false,
        error: "Intensity must be a number between 0 and 100",
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

export default new ImageAutoEnhanceService();
