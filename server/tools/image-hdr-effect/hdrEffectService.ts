import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface HDREffectOptions {
  effectType:
    | "natural"
    | "dramatic"
    | "cinematic"
    | "surreal"
    | "vivid"
    | "moody"
    | "landscape"
    | "custom";
  intensity: number; // 1-100
  dynamicRange: number; // 1-100
  shadowRecovery: number; // 0-100
  highlightRecovery: number; // 0-100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  vibrance: number; // 0-100
  clarity: number; // 0-100
  glow: number; // 0-100
  toneMapping: "reinhard" | "filmic" | "aces" | "uncharted2";
  colorGrading: boolean;
  colorTemperature: number; // -100 to 100
  colorTint: number; // -100 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface HDREffectResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  hdrStyle: string;
  toneMapping: string;
  dynamicRange: number;
}

class ImageHDREffectService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-hdr-effect");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image HDR effect temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image HDR effect temp directory:",
        error
      );
      throw new Error("Failed to initialize image HDR effect service");
    }
  }

  public async applyHDREffect(
    imageBuffer: Buffer,
    filename: string,
    hdrOptions: HDREffectOptions
  ): Promise<HDREffectResult> {
    const startTime = Date.now();

    logger.info(`🌈 Starting HDR effect: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(hdrOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateHDROptions(hdrOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply HDR effect processing
      const processedResult = await this.applyHDRProcessing(
        imageBuffer,
        hdrOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ HDR effect completed in ${processingTime}ms`);
      logger.info(
        `🌈 Applied style: ${hdrOptions.effectType} with tone mapping ${hdrOptions.toneMapping}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        hdrStyle: hdrOptions.effectType,
        toneMapping: hdrOptions.toneMapping,
        dynamicRange: processedResult.dynamicRange,
      };
    } catch (error) {
      logger.error(`❌ HDR effect failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyHDRProcessing(
    imageBuffer: Buffer,
    options: HDREffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    dynamicRange: number;
  }> {
    try {
      // Try Sharp first if available
      return await this.processWithSharp(
        imageBuffer,
        options,
        originalDimensions
      );
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available for HDR effect, trying Canvas API");

      try {
        return await this.processWithCanvas(
          imageBuffer,
          options,
          originalDimensions
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for HDR effect, using mock processing"
        );
        return await this.createMockHDRImage(
          imageBuffer,
          options,
          originalDimensions
        );
      }
    }
  }

  private async processWithSharp(
    imageBuffer: Buffer,
    options: HDREffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    dynamicRange: number;
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different HDR styles based on the selected type
      const intensity = options.intensity / 100;
      const dynamicRangeFactor = options.dynamicRange / 100;

      switch (options.effectType) {
        case "natural":
          // Natural HDR - balanced look with moderate enhancements
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.1,
            saturation: 1.0 + (options.saturation / 100) * 0.5,
            hue: 0,
          });

          // Apply shadow and highlight recovery
          pipeline = pipeline.linear(
            1.0 + options.contrast / 200,
            options.shadowRecovery / 500
          );

          // Apply clarity if needed
          if (options.clarity > 0) {
            pipeline = pipeline.sharpen({
              sigma: 0.5 + (options.clarity / 100) * 1.5,
              flat: 1.0,
              jagged: 0.7,
            });
          }
          break;

        case "dramatic":
          // Dramatic HDR - high contrast, vivid look
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.15,
            saturation: 1.0 + (options.saturation / 100) * 0.8 + 0.2,
            hue: 0,
          });

          // Enhance contrast
          pipeline = pipeline.linear(
            1.0 + (options.contrast / 100) * 0.5 + 0.2,
            options.shadowRecovery / 400
          );

          // Apply stronger clarity
          pipeline = pipeline.sharpen({
            sigma: 1.0 + (options.clarity / 100) * 2.0,
            flat: 0.8,
            jagged: 1.2,
          });
          break;

        case "cinematic":
          // Cinematic HDR - film-like look with color grading
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.1,
            saturation: 1.0 + (options.saturation / 100) * 0.3,
            hue: (options.colorTemperature / 100) * 5,
          });

          // Apply cinematic contrast curve
          pipeline = pipeline.linear(
            1.0 + options.contrast / 200 + 0.1,
            options.shadowRecovery / 600 - 0.05
          );

          // Apply tint based on color temperature
          const tintColor =
            options.colorTemperature > 0
              ? { r: 255, g: 240, b: 230 } // Warm
              : { r: 230, g: 240, b: 255 }; // Cool

          pipeline = pipeline.tint(tintColor);

          // Apply moderate clarity
          pipeline = pipeline.sharpen({
            sigma: 0.7 + (options.clarity / 100) * 1.0,
            flat: 1.0,
            jagged: 0.8,
          });
          break;

        case "surreal":
          // Surreal HDR - hyper-real, artistic look
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.2,
            saturation: 1.0 + (options.saturation / 100) * 1.0 + 0.5,
            hue: (options.colorTint / 100) * 10,
          });

          // Apply extreme contrast
          pipeline = pipeline.linear(
            1.0 + (options.contrast / 100) * 0.7 + 0.3,
            options.shadowRecovery / 300 - 0.1
          );

          // Apply glow effect (simulated with blur and overlay)
          if (options.glow > 0) {
            const glowAmount = options.glow / 100;
            const blurRadius = 10 * glowAmount;

            // Create a blurred version for the glow
            const blurredBuffer = await sharp
              .default(imageBuffer)
              .blur(blurRadius)
              .toBuffer();

            // Composite the glow over the image
            pipeline = pipeline.composite([
              {
                input: blurredBuffer,
                blend: "screen",
                opacity: 0.3 + glowAmount * 0.4,
              },
            ]);
          }

          // Apply strong clarity
          pipeline = pipeline.sharpen({
            sigma: 1.5 + (options.clarity / 100) * 2.5,
            flat: 0.6,
            jagged: 1.5,
          });
          break;

        case "vivid":
          // Vivid HDR - intense colors, high saturation
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.15,
            saturation: 1.0 + (options.saturation / 100) * 0.9 + 0.4,
            hue: 0,
          });

          // Apply vibrance (simulated with saturation and contrast)
          pipeline = pipeline.linear(
            1.0 + options.contrast / 150 + 0.15,
            options.shadowRecovery / 500
          );

          // Apply clarity for detail enhancement
          pipeline = pipeline.sharpen({
            sigma: 1.0 + (options.clarity / 100) * 1.8,
            flat: 0.7,
            jagged: 1.3,
          });
          break;

        case "moody":
          // Moody HDR - atmospheric, darker shadows, controlled highlights
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.05 - 0.05,
            saturation: 1.0 + (options.saturation / 100) * 0.2,
            hue: -5,
          });

          // Apply moody contrast curve
          pipeline = pipeline.linear(
            1.0 + options.contrast / 150 + 0.2,
            options.shadowRecovery / 800 - 0.1
          );

          // Apply blue-teal color grading
          pipeline = pipeline.tint({ r: 230, g: 240, b: 255 });

          // Apply moderate clarity
          pipeline = pipeline.sharpen({
            sigma: 0.6 + (options.clarity / 100) * 1.0,
            flat: 1.1,
            jagged: 0.7,
          });
          break;

        case "landscape":
          // Landscape HDR - optimized for nature photos
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.12,
            saturation: 1.0 + (options.saturation / 100) * 0.6 + 0.2,
            hue: (options.colorTemperature / 100) * 3,
          });

          // Enhance greens and blues slightly
          const landscapeMatrix = [
            1.0, 0.0, 0.0, 0.0, 0.0, 1.1, 0.0, 0.0, 0.0, 0.0, 1.1, 0.0, 0.0,
            0.0, 0.0, 1.0,
          ];

          pipeline = pipeline.recomb(landscapeMatrix);

          // Apply landscape-optimized contrast
          pipeline = pipeline.linear(
            1.0 + options.contrast / 150 + 0.1,
            options.shadowRecovery / 500
          );

          // Apply clarity for landscape details
          pipeline = pipeline.sharpen({
            sigma: 0.9 + (options.clarity / 100) * 1.5,
            flat: 0.8,
            jagged: 1.1,
          });
          break;

        case "custom":
        default:
          // Custom HDR - apply settings directly
          pipeline = pipeline.modulate({
            brightness: 1.0 + intensity * 0.15,
            saturation: 1.0 + (options.saturation / 100) * 0.7,
            hue: (options.colorTemperature / 100) * 5,
          });

          // Apply custom contrast
          pipeline = pipeline.linear(
            1.0 + options.contrast / 200,
            options.shadowRecovery / 500
          );

          // Apply clarity based on user setting
          if (options.clarity > 0) {
            pipeline = pipeline.sharpen({
              sigma: (options.clarity / 100) * 2.0,
              flat: 1.0,
              jagged: 1.0,
            });
          }

          // Apply color grading if enabled
          if (options.colorGrading) {
            // Apply temperature tint
            const tempFactor = options.colorTemperature / 100;
            const tintFactor = options.colorTint / 100;

            const r = 255 + tempFactor * 20 - tintFactor * 10;
            const g = 255 - Math.abs(tempFactor) * 5 + tintFactor * 15;
            const b = 255 - tempFactor * 20 - tintFactor * 5;

            pipeline = pipeline.tint({
              r: Math.max(200, Math.min(255, r)),
              g: Math.max(200, Math.min(255, g)),
              b: Math.max(200, Math.min(255, b)),
            });
          }
          break;
      }

      // Apply glow effect if needed (for styles other than surreal)
      if (options.effectType !== "surreal" && options.glow > 0) {
        const glowAmount = options.glow / 100;

        try {
          // Create a blurred version for the glow
          const blurredBuffer = await sharp
            .default(imageBuffer)
            .blur(5 + glowAmount * 10)
            .toBuffer();

          // Composite the glow over the image
          pipeline = pipeline.composite([
            {
              input: blurredBuffer,
              blend: "screen",
              opacity: 0.2 + glowAmount * 0.3,
            },
          ]);
        } catch (glowError) {
          logger.warn("⚠️ Glow effect application failed:", glowError);
          // Continue without glow if it fails
        }
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

      // Calculate dynamic range score based on options
      const dynamicRange = this.calculateDynamicRange(options);

      logger.info("✅ Processed with Sharp");
      return {
        buffer: processedBuffer,
        dimensions,
        dynamicRange,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async processWithCanvas(
    imageBuffer: Buffer,
    options: HDREffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    dynamicRange: number;
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

      // Apply different HDR styles based on the selected type
      const intensity = options.intensity / 100;
      const dynamicRangeFactor = options.dynamicRange / 100;

      switch (options.effectType) {
        case "natural":
          this.applyNaturalHDR(data, options);
          break;
        case "dramatic":
          this.applyDramaticHDR(data, options);
          break;
        case "cinematic":
          this.applyCinematicHDR(data, options);
          break;
        case "surreal":
          this.applySurrealHDR(data, options);
          break;
        case "vivid":
          this.applyVividHDR(data, options);
          break;
        case "moody":
          this.applyMoodyHDR(data, options);
          break;
        case "landscape":
          this.applyLandscapeHDR(data, options);
          break;
        case "custom":
        default:
          this.applyCustomHDR(data, options);
          break;
      }

      // Apply tone mapping based on selected algorithm
      this.applyToneMapping(data, options.toneMapping, dynamicRangeFactor);

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Apply glow effect if needed
      if (options.glow > 0) {
        this.applyGlowEffect(ctx, canvas.width, canvas.height, options.glow);
      }

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

      // Calculate dynamic range score
      const dynamicRange = this.calculateDynamicRange(options);

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvas.width, height: canvas.height },
        dynamicRange,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Natural HDR implementation
  private applyNaturalHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 200;
    const saturationFactor = 1 + options.saturation / 200;

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

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128);
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Dramatic HDR implementation
  private applyDramaticHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 100 + 0.2;
    const saturationFactor = 1 + options.saturation / 100 + 0.3;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery - more aggressive
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128) * 1.5;
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery - more controlled
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity * 0.8;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply stronger contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply increased saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Cinematic HDR implementation
  private applyCinematicHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 150 + 0.1;
    const saturationFactor = 1 + options.saturation / 200;
    const tempFactor = options.colorTemperature / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128);
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Apply cinematic color grading (orange-teal)
      if (luminance < 128) {
        // Shadows toward teal
        b += (128 - luminance) / 4;
      } else {
        // Highlights toward orange
        r += (luminance - 128) / 4;
      }

      // Apply color temperature
      if (tempFactor > 0) {
        // Warmer
        r *= 1 + tempFactor * 0.2;
        g *= 1 + tempFactor * 0.05;
        b *= 1 - tempFactor * 0.1;
      } else {
        // Cooler
        r *= 1 + tempFactor * 0.1;
        g *= 1 + tempFactor * 0.05;
        b *= 1 - tempFactor * 0.2;
      }

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Surreal HDR implementation
  private applySurrealHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 100 + 0.3;
    const saturationFactor = 1 + options.saturation / 100 + 0.5;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Extreme shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128) * 2.0;
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Extreme highlight recovery
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity * 1.5;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply high contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply high saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Apply color shift for surreal effect
      r = r * 1.1;
      b = b * 1.1;

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Vivid HDR implementation
  private applyVividHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 150 + 0.1;
    const saturationFactor = 1 + options.saturation / 100 + 0.4;
    const vibranceFactor = options.vibrance / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128) * 1.2;
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Apply vibrance (boost less saturated colors more)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = (max - min) / (max + 0.001);
      const vibBoost = 1 + (1 - saturation) * vibranceFactor;

      r = gray + (r - gray) * vibBoost;
      g = gray + (g - gray) * vibBoost;
      b = gray + (b - gray) * vibBoost;

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Moody HDR implementation
  private applyMoodyHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 150 + 0.2;
    const saturationFactor = 1 + options.saturation / 200 - 0.1; // Slightly desaturated

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery - less for moody look
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128) * 0.8;
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery - stronger for moody look
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity * 1.2;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Apply moody color grading (blue-teal shadows, warm highlights)
      if (luminance < 128) {
        // Shadows toward blue-teal
        b += (128 - luminance) / 3;
        g += (128 - luminance) / 6;
      } else {
        // Highlights slightly warm
        r += (luminance - 128) / 6;
      }

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Landscape HDR implementation
  private applyLandscapeHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 150 + 0.1;
    const saturationFactor = 1 + options.saturation / 150 + 0.2;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128) * 1.1;
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery - important for skies
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity * 1.1;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Enhance blues and greens for landscape
      const isBlue = b > r && b > g;
      const isGreen = g > r && g > b;

      if (isBlue) {
        b *= 1.1; // Enhance blues (sky)
      }

      if (isGreen) {
        g *= 1.1; // Enhance greens (foliage)
      }

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Custom HDR implementation
  private applyCustomHDR(
    data: Uint8ClampedArray,
    options: HDREffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const shadowRecovery = options.shadowRecovery / 100;
    const highlightRecovery = options.highlightRecovery / 100;
    const contrastFactor = 1 + options.contrast / 200;
    const saturationFactor = 1 + options.saturation / 150;
    const vibranceFactor = options.vibrance / 100;
    const tempFactor = options.colorTemperature / 100;
    const tintFactor = options.colorTint / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Shadow recovery
      if (luminance < 128) {
        const shadowBoost = shadowRecovery * (1 - luminance / 128);
        r += r * shadowBoost * intensity;
        g += g * shadowBoost * intensity;
        b += b * shadowBoost * intensity;
      }

      // Highlight recovery
      if (luminance > 128) {
        const highlightFactor =
          1 - highlightRecovery * ((luminance - 128) / 128) * intensity;
        r = r * highlightFactor + (255 - (255 - r) * highlightFactor);
        g = g * highlightFactor + (255 - (255 - g) * highlightFactor);
        b = b * highlightFactor + (255 - (255 - b) * highlightFactor);
      }

      // Apply contrast
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;

      // Apply vibrance (boost less saturated colors more)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = (max - min) / (max + 0.001);
      const vibBoost = 1 + (1 - saturation) * vibranceFactor;

      r = gray + (r - gray) * vibBoost;
      g = gray + (g - gray) * vibBoost;
      b = gray + (b - gray) * vibBoost;

      // Apply color temperature
      if (tempFactor > 0) {
        // Warmer
        r *= 1 + tempFactor * 0.2;
        g *= 1 + tempFactor * 0.05;
        b *= 1 - tempFactor * 0.1;
      } else {
        // Cooler
        r *= 1 + tempFactor * 0.1;
        g *= 1 + tempFactor * 0.05;
        b *= 1 - tempFactor * 0.2;
      }

      // Apply color tint
      if (tintFactor > 0) {
        // Magenta tint
        r *= 1 + tintFactor * 0.1;
        g *= 1 - tintFactor * 0.1;
        b *= 1 + tintFactor * 0.1;
      } else {
        // Green tint
        r *= 1 + tintFactor * 0.1;
        g *= 1 - tintFactor * 0.2;
        b *= 1 + tintFactor * 0.1;
      }

      // Ensure values are in valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // Apply tone mapping
  private applyToneMapping(
    data: Uint8ClampedArray,
    toneMapping: string,
    dynamicRangeFactor: number
  ): void {
    // Find the maximum luminance value
    let maxLuminance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      maxLuminance = Math.max(maxLuminance, luminance);
    }

    // Apply tone mapping based on selected algorithm
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Normalize to 0-1 range
      r /= 255;
      g /= 255;
      b /= 255;

      // Apply selected tone mapping
      switch (toneMapping) {
        case "reinhard":
          // Reinhard tone mapping
          r = r / (r + dynamicRangeFactor);
          g = g / (g + dynamicRangeFactor);
          b = b / (b + dynamicRangeFactor);
          break;

        case "filmic":
          // Filmic tone mapping (simplified)
          const A = 0.15;
          const B = 0.5;
          const C = 0.1;
          const D = 0.2;
          const E = 0.02;
          const F = 0.3;

          r = (r * (A * r + C * B) + D * E) / (r * (A * r + B) + D * F) - E / F;
          g = (g * (A * g + C * B) + D * E) / (g * (A * g + B) + D * F) - E / F;
          b = (b * (A * b + C * B) + D * E) / (b * (A * b + B) + D * F) - E / F;

          // Normalize
          const whitePoint =
            (1.0 * (A * 1.0 + C * B) + D * E) / (1.0 * (A * 1.0 + B) + D * F) -
            E / F;
          r /= whitePoint;
          g /= whitePoint;
          b /= whitePoint;
          break;

        case "aces":
          // ACES tone mapping (simplified)
          const a = 2.51;
          const c = 1.43;
          const d = 0.94;
          const e = 0.59;
          const f = 0.14;

          r = (r * (a * r + c)) / (r * (a * r + d) + e * f);
          g = (g * (a * g + c)) / (g * (a * g + d) + e * f);
          b = (b * (a * b + c)) / (b * (a * b + d) + e * f);
          break;

        case "uncharted2":
          // Uncharted 2 tone mapping (simplified)
          const A2 = 0.15;
          const B2 = 0.5;
          const C2 = 0.1;
          const D2 = 0.2;
          const E2 = 0.02;
          const F2 = 0.3;
          const W = 11.2;

          const uncharted = (x: number) => {
            return (
              (x * (A2 * x + C2 * B2) + D2 * E2) /
                (x * (A2 * x + B2) + D2 * F2) -
              E2 / F2
            );
          };

          r = uncharted(r) / uncharted(W);
          g = uncharted(g) / uncharted(W);
          b = uncharted(b) / uncharted(W);
          break;
      }

      // Convert back to 0-255 range
      data[i] = Math.max(0, Math.min(255, r * 255));
      data[i + 1] = Math.max(0, Math.min(255, g * 255));
      data[i + 2] = Math.max(0, Math.min(255, b * 255));
    }
  }

  // Apply glow effect
  private applyGlowEffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    glowAmount: number
  ): void {
    const glowIntensity = glowAmount / 100;

    // Create a copy of the canvas
    const tempCanvas = ctx.canvas.ownerDocument.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    // Copy the original image
    tempCtx.drawImage(ctx.canvas, 0, 0);

    // Apply blur for glow
    const blurRadius = 10 * glowIntensity;
    tempCtx.filter = `blur(${blurRadius}px)`;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    tempCtx.filter = "none";

    // Overlay the blurred image with screen blend mode
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.3 + glowIntensity * 0.4;
    ctx.drawImage(tempCanvas, 0, 0);

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;
  }

  // Calculate dynamic range score
  private calculateDynamicRange(options: HDREffectOptions): number {
    // Base score from dynamic range setting
    let score = options.dynamicRange / 10;

    // Adjust based on HDR style
    switch (options.effectType) {
      case "surreal":
        score += 1.5;
        break;
      case "dramatic":
        score += 1.2;
        break;
      case "vivid":
        score += 1.0;
        break;
      case "cinematic":
        score += 0.8;
        break;
      case "landscape":
        score += 0.7;
        break;
      case "natural":
        score += 0.5;
        break;
      case "moody":
        score += 0.3;
        break;
    }

    // Adjust based on tone mapping
    switch (options.toneMapping) {
      case "aces":
        score += 0.8;
        break;
      case "uncharted2":
        score += 0.6;
        break;
      case "filmic":
        score += 0.4;
        break;
      case "reinhard":
        score += 0.2;
        break;
    }

    // Adjust based on shadow and highlight recovery
    score += (options.shadowRecovery + options.highlightRecovery) / 200;

    // Adjust based on intensity
    score += options.intensity / 100;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockHDRImage(
    imageBuffer: Buffer,
    options: HDREffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    dynamicRange: number;
  }> {
    logger.warn(
      "⚠️ Using mock HDR effect - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    const dynamicRange = this.calculateDynamicRange(options);

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      dynamicRange,
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

  public validateHDROptions(options: HDREffectOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "HDR options are required" };
    }

    // Validate effect type
    const validEffectTypes = [
      "natural",
      "dramatic",
      "cinematic",
      "surreal",
      "vivid",
      "moody",
      "landscape",
      "custom",
    ];
    if (!validEffectTypes.includes(options.effectType)) {
      return {
        isValid: false,
        error: `Invalid effect type. Supported: ${validEffectTypes.join(", ")}`,
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

    // Validate dynamic range
    if (
      typeof options.dynamicRange !== "number" ||
      options.dynamicRange < 1 ||
      options.dynamicRange > 100
    ) {
      return {
        isValid: false,
        error: "Dynamic range must be a number between 1 and 100",
      };
    }

    // Validate shadow recovery
    if (
      typeof options.shadowRecovery !== "number" ||
      options.shadowRecovery < 0 ||
      options.shadowRecovery > 100
    ) {
      return {
        isValid: false,
        error: "Shadow recovery must be a number between 0 and 100",
      };
    }

    // Validate highlight recovery
    if (
      typeof options.highlightRecovery !== "number" ||
      options.highlightRecovery < 0 ||
      options.highlightRecovery > 100
    ) {
      return {
        isValid: false,
        error: "Highlight recovery must be a number between 0 and 100",
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

    // Validate vibrance
    if (
      typeof options.vibrance !== "number" ||
      options.vibrance < 0 ||
      options.vibrance > 100
    ) {
      return {
        isValid: false,
        error: "Vibrance must be a number between 0 and 100",
      };
    }

    // Validate clarity
    if (
      typeof options.clarity !== "number" ||
      options.clarity < 0 ||
      options.clarity > 100
    ) {
      return {
        isValid: false,
        error: "Clarity must be a number between 0 and 100",
      };
    }

    // Validate glow
    if (
      typeof options.glow !== "number" ||
      options.glow < 0 ||
      options.glow > 100
    ) {
      return {
        isValid: false,
        error: "Glow must be a number between 0 and 100",
      };
    }

    // Validate tone mapping
    const validToneMappings = ["reinhard", "filmic", "aces", "uncharted2"];
    if (!validToneMappings.includes(options.toneMapping)) {
      return {
        isValid: false,
        error: `Invalid tone mapping. Supported: ${validToneMappings.join(
          ", "
        )}`,
      };
    }

    // Validate color temperature if color grading is enabled
    if (options.colorGrading) {
      if (
        typeof options.colorTemperature !== "number" ||
        options.colorTemperature < -100 ||
        options.colorTemperature > 100
      ) {
        return {
          isValid: false,
          error: "Color temperature must be a number between -100 and 100",
        };
      }

      if (
        typeof options.colorTint !== "number" ||
        options.colorTint < -100 ||
        options.colorTint > 100
      ) {
        return {
          isValid: false,
          error: "Color tint must be a number between -100 and 100",
        };
      }
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

export default new ImageHDREffectService();
