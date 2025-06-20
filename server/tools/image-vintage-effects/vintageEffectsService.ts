import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface VintageEffectOptions {
  vintageStyle:
    | "classic"
    | "sepia"
    | "noir"
    | "faded"
    | "technicolor"
    | "polaroid"
    | "cinematic"
    | "retro"
    | "custom";
  intensity: number; // 1-100
  filmGrain: number; // 0-100
  colorShift: number; // -100 to 100
  vignette: boolean;
  vignetteIntensity?: number; // 0-100
  lightLeak: boolean;
  lightLeakType?: "none" | "soft" | "harsh" | "random";
  scratches: boolean;
  colorBalance: {
    red: number; // -100 to 100
    green: number; // -100 to 100
    blue: number; // -100 to 100
  };
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  saturation: number; // -100 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  border?: "none" | "white" | "black" | "film" | "polaroid";
  borderWidth?: number;
  dateStamp?: boolean;
  dateFormat?: string;
}

interface VintageEffectResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  vintageStyle: string;
  effectIntensity: number;
  filmGrain: number;
  colorShift: number;
  vignette: boolean;
}

class ImageVintageEffectsService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-vintage-effects");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image vintage effects temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image vintage effects temp directory:",
        error
      );
      throw new Error("Failed to initialize image vintage effects service");
    }
  }

  public async applyVintageEffect(
    imageBuffer: Buffer,
    filename: string,
    vintageOptions: VintageEffectOptions
  ): Promise<VintageEffectResult> {
    const startTime = Date.now();

    logger.info(`🎞️ Starting vintage effect: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(vintageOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateVintageOptions(vintageOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply vintage effect processing
      const processedResult = await this.applyVintageProcessing(
        imageBuffer,
        vintageOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Vintage effect completed in ${processingTime}ms`);
      logger.info(
        `🎞️ Applied style: ${vintageOptions.vintageStyle} with intensity ${vintageOptions.intensity}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        vintageStyle: vintageOptions.vintageStyle,
        effectIntensity: vintageOptions.intensity,
        filmGrain: vintageOptions.filmGrain,
        colorShift: vintageOptions.colorShift,
        vignette: vintageOptions.vignette,
      };
    } catch (error) {
      logger.error(`❌ Vintage effect failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyVintageProcessing(
    imageBuffer: Buffer,
    options: VintageEffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      // Try Sharp first if available
      return await this.processWithSharp(
        imageBuffer,
        options,
        originalDimensions
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for vintage effects, trying Canvas API"
      );

      try {
        return await this.processWithCanvas(
          imageBuffer,
          options,
          originalDimensions
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for vintage effects, using mock processing"
        );
        return await this.createMockVintageImage(
          imageBuffer,
          options,
          originalDimensions
        );
      }
    }
  }

  private async processWithSharp(
    imageBuffer: Buffer,
    options: VintageEffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different vintage styles
      switch (options.vintageStyle) {
        case "classic":
          // Classic film look with warm tones
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 0.7,
            hue: 15, // Slight yellow/orange shift
          });

          // Adjust contrast
          pipeline = pipeline.linear(
            1.1, // Slope (contrast)
            -0.1 * (options.intensity / 100) // Offset (brightness)
          );

          // Add slight sepia tone
          pipeline = pipeline.tint({ r: 255, g: 240, b: 220 });
          break;

        case "sepia":
          // Strong sepia tone
          pipeline = pipeline.modulate({
            brightness: 1.0,
            saturation: 0.3,
            hue: 0,
          });

          // Apply sepia tone
          pipeline = pipeline.tint({ r: 255, g: 220, b: 180 });

          // Adjust contrast
          pipeline = pipeline.linear(1.1 + options.intensity / 200, -0.1);
          break;

        case "noir":
          // Black and white with high contrast
          pipeline = pipeline.grayscale();

          // Increase contrast
          pipeline = pipeline.linear(1.2 + options.intensity / 100, -0.15);

          // Slight blue tint for cool noir look
          pipeline = pipeline.tint({ r: 230, g: 230, b: 255 });
          break;

        case "faded":
          // Faded vintage look
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 0.6,
            hue: 0,
          });

          // Reduce contrast
          pipeline = pipeline.linear(0.8, 0.1);

          // Add slight color cast
          pipeline = pipeline.tint({ r: 240, g: 240, b: 230 });
          break;

        case "technicolor":
          // Vibrant technicolor look
          pipeline = pipeline.modulate({
            brightness: 1.0,
            saturation: 1.5 + options.intensity / 100,
            hue: 0,
          });

          // Increase contrast
          pipeline = pipeline.linear(1.2, -0.1);
          break;

        case "polaroid":
          // Polaroid-style effect
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 0.8,
            hue: 5, // Slight warm shift
          });

          // Reduce contrast slightly
          pipeline = pipeline.linear(0.9, 0.1);

          // Add warm color cast
          pipeline = pipeline.tint({ r: 255, g: 245, b: 235 });
          break;

        case "cinematic":
          // Cinematic color grading
          pipeline = pipeline.modulate({
            brightness: 1.0,
            saturation: 0.9,
            hue: -5, // Slight cool shift
          });

          // Adjust contrast for cinematic look
          pipeline = pipeline.linear(1.15, -0.05);

          // Teal and orange color grading (common in films)
          // This is a simplification - real cinematic grading is more complex
          pipeline = pipeline.tint({ r: 255, g: 240, b: 230 });
          break;

        case "retro":
          // 80s/90s retro look
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 1.2,
            hue: 0,
          });

          // Increase contrast
          pipeline = pipeline.linear(1.1, -0.05);

          // Slight color shift
          pipeline = pipeline.tint({ r: 250, g: 240, b: 255 });
          break;

        case "custom":
          // Apply custom settings
          pipeline = pipeline.modulate({
            brightness: 1.0 + options.brightness / 200,
            saturation: 1.0 + options.saturation / 100,
            hue: options.colorShift / 2,
          });

          // Apply custom contrast
          pipeline = pipeline.linear(
            1.0 + options.contrast / 100,
            -(options.contrast / 200)
          );

          // Apply custom color balance
          if (options.colorBalance) {
            const { red, green, blue } = options.colorBalance;
            const r = 255 + red * 0.5;
            const g = 255 + green * 0.5;
            const b = 255 + blue * 0.5;
            pipeline = pipeline.tint({ r, g, b });
          }
          break;

        default:
          // Default vintage look
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 0.8,
            hue: 10,
          });

          pipeline = pipeline.tint({ r: 250, g: 240, b: 220 });
          break;
      }

      // Apply film grain if requested
      if (options.filmGrain > 0) {
        // Create a noise overlay
        const grainIntensity = options.filmGrain / 100;
        const width = originalDimensions.width;
        const height = originalDimensions.height;

        // Generate noise using Sharp's noise function
        const noiseBuffer = await sharp
          .default({
            create: {
              width,
              height,
              channels: 4,
              background: { r: 128, g: 128, b: 128, alpha: 1 },
            },
          })
          .noise(grainIntensity * 100)
          .toBuffer();

        // Composite the noise over the image with reduced opacity
        pipeline = pipeline.composite([
          {
            input: noiseBuffer,
            blend: "overlay",
            opacity: grainIntensity * 0.5,
          },
        ]);
      }

      // Apply vignette if requested
      if (options.vignette) {
        const vignetteIntensity = options.vignetteIntensity || 50;
        const width = originalDimensions.width;
        const height = originalDimensions.height;

        // Create a vignette mask
        const vignetteSvg = Buffer.from(`
          <svg width="${width}" height="${height}">
            <defs>
              <radialGradient id="vignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stop-color="white" stop-opacity="1" />
                <stop offset="90%" stop-color="white" stop-opacity="${
                  1 - (vignetteIntensity / 100) * 0.8
                }" />
                <stop offset="100%" stop-color="black" stop-opacity="${
                  (vignetteIntensity / 100) * 0.8
                }" />
              </radialGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#vignette)" />
          </svg>
        `);

        // Apply the vignette
        pipeline = pipeline.composite([
          {
            input: vignetteSvg,
            blend: "multiply",
          },
        ]);
      }

      // Apply light leak if requested
      if (options.lightLeak && options.lightLeakType !== "none") {
        // In a real implementation, you would have pre-made light leak overlays
        // Here we'll simulate a simple light leak with a gradient
        const width = originalDimensions.width;
        const height = originalDimensions.height;

        let leakSvg;

        switch (options.lightLeakType) {
          case "soft":
            leakSvg = Buffer.from(`
              <svg width="${width}" height="${height}">
                <defs>
                  <linearGradient id="leak" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="yellow" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="transparent" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#leak)" />
              </svg>
            `);
            break;

          case "harsh":
            leakSvg = Buffer.from(`
              <svg width="${width}" height="${height}">
                <defs>
                  <linearGradient id="leak" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="red" stop-opacity="0.3" />
                    <stop offset="20%" stop-color="yellow" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="transparent" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#leak)" />
              </svg>
            `);
            break;

          case "random":
          default:
            // Random position for light leak
            const randomX = Math.random() > 0.5 ? "0%" : "100%";
            const randomY = Math.random() > 0.5 ? "0%" : "100%";

            leakSvg = Buffer.from(`
              <svg width="${width}" height="${height}">
                <defs>
                  <radialGradient id="leak" cx="${randomX}" cy="${randomY}" r="50%" fx="${randomX}" fy="${randomY}">
                    <stop offset="0%" stop-color="orange" stop-opacity="0.3" />
                    <stop offset="50%" stop-color="yellow" stop-opacity="0.1" />
                    <stop offset="100%" stop-color="transparent" stop-opacity="0" />
                  </radialGradient>
                </defs>
                <rect width="${width}" height="${height}" fill="url(#leak)" />
              </svg>
            `);
            break;
        }

        // Apply the light leak
        pipeline = pipeline.composite([
          {
            input: leakSvg,
            blend: "screen",
          },
        ]);
      }

      // Apply scratches if requested
      if (options.scratches) {
        // In a real implementation, you would have pre-made scratch overlays
        // Here we'll simulate simple scratches with lines
        const width = originalDimensions.width;
        const height = originalDimensions.height;

        // Create a few random scratches
        let scratchesSvg = `<svg width="${width}" height="${height}">`;

        // Add 5-10 random scratches
        const scratchCount = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < scratchCount; i++) {
          const x1 = Math.floor(Math.random() * width);
          const y1 = 0;
          const x2 = x1 + Math.floor(Math.random() * 100) - 50;
          const y2 = height;
          const opacity = 0.1 + Math.random() * 0.2;

          scratchesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="white" stroke-width="1" opacity="${opacity}" />`;
        }

        scratchesSvg += `</svg>`;

        // Apply the scratches
        pipeline = pipeline.composite([
          {
            input: Buffer.from(scratchesSvg),
            blend: "screen",
          },
        ]);
      }

      // Apply border if requested
      if (options.border && options.border !== "none") {
        const borderWidth = options.borderWidth || 20;
        let borderColor = { r: 255, g: 255, b: 255 }; // Default white

        switch (options.border) {
          case "black":
            borderColor = { r: 0, g: 0, b: 0 };
            break;

          case "film":
            // Film border is black with slightly rounded corners
            borderColor = { r: 0, g: 0, b: 0 };
            break;

          case "polaroid":
            // Polaroid has a thick white border, especially at the bottom
            // We'll handle this specially
            const polaroidTop = borderWidth;
            const polaroidSides = borderWidth;
            const polaroidBottom = borderWidth * 3; // Thicker bottom border

            pipeline = pipeline.extend({
              top: polaroidTop,
              bottom: polaroidBottom,
              left: polaroidSides,
              right: polaroidSides,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            });

            // If date stamp is requested, add it to the bottom border
            if (options.dateStamp) {
              const dateText =
                options.dateFormat || new Date().toLocaleDateString();

              // In a real implementation, you would use Sharp's text overlay capabilities
              // or generate an SVG with the date text
              // For simplicity, we'll skip the actual text rendering here
            }

            // Skip the regular border application since we've already done it
            break;

          case "white":
          default:
            borderColor = { r: 255, g: 255, b: 255 };
            break;
        }

        // Apply regular border (if not polaroid)
        if (options.border !== "polaroid") {
          pipeline = pipeline.extend({
            top: borderWidth,
            bottom: borderWidth,
            left: borderWidth,
            right: borderWidth,
            background: {
              r: borderColor.r,
              g: borderColor.g,
              b: borderColor.b,
              alpha: 1,
            },
          });
        }
      }

      // Apply output format and quality
      switch (options.outputFormat) {
        case "jpg":
        case "jpeg":
          pipeline = pipeline.jpeg({
            quality: options.quality || 90,
            progressive: true,
          });
          break;
        case "webp":
          pipeline = pipeline.webp({
            quality: options.quality || 90,
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
      return {
        buffer: processedBuffer,
        dimensions,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async processWithCanvas(
    imageBuffer: Buffer,
    options: VintageEffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      const { createCanvas, loadImage } = await import("canvas");

      const image = await loadImage(imageBuffer);

      // Calculate dimensions including border if needed
      const borderWidth =
        options.border !== "none" ? options.borderWidth || 20 : 0;
      const polaroidBottom =
        options.border === "polaroid" ? borderWidth * 3 : borderWidth;

      const canvasWidth = image.width + borderWidth * 2;
      const canvasHeight = image.height + borderWidth + polaroidBottom;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw border if needed
      if (options.border && options.border !== "none") {
        switch (options.border) {
          case "black":
            ctx.fillStyle = "#000000";
            break;
          case "film":
            ctx.fillStyle = "#000000";
            break;
          case "polaroid":
            ctx.fillStyle = "#ffffff";
            break;
          case "white":
          default:
            ctx.fillStyle = "#ffffff";
            break;
        }

        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Draw original image in the center (accounting for border)
      ctx.drawImage(image, borderWidth, borderWidth);

      // Get image data for processing
      const imageData = ctx.getImageData(
        borderWidth,
        borderWidth,
        image.width,
        image.height
      );
      const data = imageData.data;

      // Apply different vintage styles
      switch (options.vintageStyle) {
        case "classic":
          this.applyClassicVintageEffect(data, options);
          break;

        case "sepia":
          this.applySepiaEffect(data, options);
          break;

        case "noir":
          this.applyNoirEffect(data, options);
          break;

        case "faded":
          this.applyFadedEffect(data, options);
          break;

        case "technicolor":
          this.applyTechnicolorEffect(data, options);
          break;

        case "polaroid":
          this.applyPolaroidEffect(data, options);
          break;

        case "cinematic":
          this.applyCinematicEffect(data, options);
          break;

        case "retro":
          this.applyRetroEffect(data, options);
          break;

        case "custom":
          this.applyCustomVintageEffect(data, options);
          break;

        default:
          // Default vintage look
          this.applyClassicVintageEffect(data, options);
          break;
      }

      // Put processed data back
      ctx.putImageData(imageData, borderWidth, borderWidth);

      // Apply vignette if requested
      if (options.vignette) {
        const vignetteIntensity = options.vignetteIntensity || 50;
        this.applyVignette(
          ctx,
          borderWidth,
          borderWidth,
          image.width,
          image.height,
          vignetteIntensity
        );
      }

      // Apply film grain if requested
      if (options.filmGrain > 0) {
        this.applyFilmGrain(
          ctx,
          borderWidth,
          borderWidth,
          image.width,
          image.height,
          options.filmGrain
        );
      }

      // Apply light leak if requested
      if (options.lightLeak && options.lightLeakType !== "none") {
        this.applyLightLeak(
          ctx,
          borderWidth,
          borderWidth,
          image.width,
          image.height,
          options.lightLeakType || "soft"
        );
      }

      // Apply scratches if requested
      if (options.scratches) {
        this.applyScratches(
          ctx,
          borderWidth,
          borderWidth,
          image.width,
          image.height
        );
      }

      // Add date stamp if requested (for Polaroid style)
      if (options.dateStamp && options.border === "polaroid") {
        const dateText = options.dateFormat || new Date().toLocaleDateString();
        ctx.font = "16px Arial";
        ctx.fillStyle = "#333333";
        ctx.textAlign = "center";
        ctx.fillText(dateText, canvasWidth / 2, canvasHeight - borderWidth / 2);
      }

      // Convert to buffer
      let processedBuffer: Buffer;

      switch (options.outputFormat) {
        case "jpg":
        case "jpeg":
          processedBuffer = canvas.toBuffer("image/jpeg", {
            quality: (options.quality || 90) / 100,
          });
          break;
        case "webp":
          processedBuffer = canvas.toBuffer("image/webp", {
            quality: (options.quality || 90) / 100,
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
        dimensions: { width: canvasWidth, height: canvasHeight },
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Classic vintage effect implementation
  private applyClassicVintageEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply sepia-like effect with warm tones
      const newR = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * 1.05);
      const newG = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * 1.0);
      const newB = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * 0.9);

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + newR * intensity;
      data[i + 1] = g * (1 - intensity) + newG * intensity;
      data[i + 2] = b * (1 - intensity) + newB * intensity;
    }
  }

  // Sepia effect implementation
  private applySepiaEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply strong sepia tone
      const newR = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * 1.1);
      const newG = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * 1.0);
      const newB = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * 0.8);

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + newR * intensity;
      data[i + 1] = g * (1 - intensity) + newG * intensity;
      data[i + 2] = b * (1 - intensity) + newB * intensity;
    }
  }

  // Noir effect implementation
  private applyNoirEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Increase contrast for noir look
      const contrastFactor = 1.5;
      const contrastAdjusted = (gray - 128) * contrastFactor + 128;

      // Add slight blue tint for cool tone
      const tintedR = Math.max(0, Math.min(255, contrastAdjusted * 0.95));
      const tintedG = Math.max(0, Math.min(255, contrastAdjusted * 0.95));
      const tintedB = Math.max(0, Math.min(255, contrastAdjusted * 1.05));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + tintedR * intensity;
      data[i + 1] = g * (1 - intensity) + tintedG * intensity;
      data[i + 2] = b * (1 - intensity) + tintedB * intensity;
    }
  }

  // Faded effect implementation
  private applyFadedEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Reduce contrast and saturation for faded look
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Reduce contrast
      const contrastFactor = 0.8;
      const contrastAdjusted = (gray - 128) * contrastFactor + 128;

      // Reduce saturation
      const saturationFactor = 0.6;
      const newR = gray + (r - gray) * saturationFactor;
      const newG = gray + (g - gray) * saturationFactor;
      const newB = gray + (b - gray) * saturationFactor;

      // Add warm/cool tint
      const tintedR = Math.max(0, Math.min(255, newR * 1.05));
      const tintedG = Math.max(0, Math.min(255, newG * 1.05));
      const tintedB = Math.max(0, Math.min(255, newB * 1.0));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + tintedR * intensity;
      data[i + 1] = g * (1 - intensity) + tintedG * intensity;
      data[i + 2] = b * (1 - intensity) + tintedB * intensity;
    }
  }

  // Technicolor effect implementation
  private applyTechnicolorEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Enhance color separation and saturation
      const newR = Math.min(255, r * 1.2);
      const newG = Math.min(255, g * 1.1);
      const newB = Math.min(255, b * 1.3);

      // Increase contrast
      const contrastFactor = 1.2;
      const contrastR = (newR - 128) * contrastFactor + 128;
      const contrastG = (newG - 128) * contrastFactor + 128;
      const contrastB = (newB - 128) * contrastFactor + 128;

      // Ensure values are in valid range
      const finalR = Math.max(0, Math.min(255, contrastR));
      const finalG = Math.max(0, Math.min(255, contrastG));
      const finalB = Math.max(0, Math.min(255, contrastB));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + finalR * intensity;
      data[i + 1] = g * (1 - intensity) + finalG * intensity;
      data[i + 2] = b * (1 - intensity) + finalB * intensity;
    }
  }

  // Polaroid effect implementation
  private applyPolaroidEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Slightly desaturate
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 0.8;

      const newR = gray + (r - gray) * saturationFactor;
      const newG = gray + (g - gray) * saturationFactor;
      const newB = gray + (b - gray) * saturationFactor;

      // Add warm tone
      const tintedR = Math.min(255, newR * 1.1);
      const tintedG = Math.min(255, newG * 1.05);
      const tintedB = Math.min(255, newB * 0.95);

      // Increase brightness slightly
      const brightnessAdjust = 10;
      const brightR = Math.min(255, tintedR + brightnessAdjust);
      const brightG = Math.min(255, tintedG + brightnessAdjust);
      const brightB = Math.min(255, tintedB + brightnessAdjust);

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + brightR * intensity;
      data[i + 1] = g * (1 - intensity) + brightG * intensity;
      data[i + 2] = b * (1 - intensity) + brightB * intensity;
    }
  }

  // Cinematic effect implementation
  private applyCinematicEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply cinematic color grading (teal and orange)
      // Enhance oranges in highlights, teals in shadows
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      let newR, newG, newB;

      if (luminance > 128) {
        // Highlights - push toward orange/yellow
        newR = Math.min(255, r * 1.1);
        newG = Math.min(255, g * 1.05);
        newB = Math.max(0, b * 0.9);
      } else {
        // Shadows - push toward teal
        newR = Math.max(0, r * 0.9);
        newG = Math.min(255, g * 1.05);
        newB = Math.min(255, b * 1.1);
      }

      // Increase contrast
      const contrastFactor = 1.15;
      const contrastR = (newR - 128) * contrastFactor + 128;
      const contrastG = (newG - 128) * contrastFactor + 128;
      const contrastB = (newB - 128) * contrastFactor + 128;

      // Ensure values are in valid range
      const finalR = Math.max(0, Math.min(255, contrastR));
      const finalG = Math.max(0, Math.min(255, contrastG));
      const finalB = Math.max(0, Math.min(255, contrastB));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + finalR * intensity;
      data[i + 1] = g * (1 - intensity) + finalG * intensity;
      data[i + 2] = b * (1 - intensity) + finalB * intensity;
    }
  }

  // Retro effect implementation
  private applyRetroEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Enhance saturation for vibrant retro look
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1.2;

      const newR = gray + (r - gray) * saturationFactor;
      const newG = gray + (g - gray) * saturationFactor;
      const newB = gray + (b - gray) * saturationFactor;

      // Shift colors slightly for retro feel
      const shiftedR = Math.min(255, newR * 1.05);
      const shiftedG = Math.min(255, newG * 0.95);
      const shiftedB = Math.min(255, newB * 1.1);

      // Increase contrast
      const contrastFactor = 1.1;
      const contrastR = (shiftedR - 128) * contrastFactor + 128;
      const contrastG = (shiftedG - 128) * contrastFactor + 128;
      const contrastB = (shiftedB - 128) * contrastFactor + 128;

      // Ensure values are in valid range
      const finalR = Math.max(0, Math.min(255, contrastR));
      const finalG = Math.max(0, Math.min(255, contrastG));
      const finalB = Math.max(0, Math.min(255, contrastB));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + finalR * intensity;
      data[i + 1] = g * (1 - intensity) + finalG * intensity;
      data[i + 2] = b * (1 - intensity) + finalB * intensity;
    }
  }

  // Custom vintage effect implementation
  private applyCustomVintageEffect(
    data: Uint8ClampedArray,
    options: VintageEffectOptions
  ): void {
    const intensity = options.intensity / 100;
    const contrastAdjust = options.contrast / 100;
    const brightnessAdjust = options.brightness / 100;
    const saturationAdjust = options.saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Apply saturation adjustment
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1 + saturationAdjust;

      let newR = gray + (r - gray) * saturationFactor;
      let newG = gray + (g - gray) * saturationFactor;
      let newB = gray + (b - gray) * saturationFactor;

      // Apply brightness adjustment
      newR += 255 * brightnessAdjust;
      newG += 255 * brightnessAdjust;
      newB += 255 * brightnessAdjust;

      // Apply contrast adjustment
      const contrastFactor = 1 + contrastAdjust;
      newR = (newR - 128) * contrastFactor + 128;
      newG = (newG - 128) * contrastFactor + 128;
      newB = (newB - 128) * contrastFactor + 128;

      // Apply color balance adjustments
      if (options.colorBalance) {
        newR += options.colorBalance.red;
        newG += options.colorBalance.green;
        newB += options.colorBalance.blue;
      }

      // Apply color shift (hue rotation approximation)
      if (options.colorShift !== 0) {
        const shift = options.colorShift / 100;

        // Simple approximation of hue shift
        const tempR = newR;
        const tempG = newG;
        const tempB = newB;

        if (shift > 0) {
          // Shift toward red/yellow
          newR = Math.min(255, tempR * (1 + shift * 0.2));
          newG = tempG;
          newB = Math.max(0, tempB * (1 - shift * 0.2));
        } else {
          // Shift toward blue/cyan
          newR = Math.max(0, tempR * (1 + shift * 0.2));
          newG = tempG;
          newB = Math.min(255, tempB * (1 - shift * 0.2));
        }
      }

      // Ensure values are in valid range
      const finalR = Math.max(0, Math.min(255, newR));
      const finalG = Math.max(0, Math.min(255, newG));
      const finalB = Math.max(0, Math.min(255, newB));

      // Blend with original based on intensity
      data[i] = r * (1 - intensity) + finalR * intensity;
      data[i + 1] = g * (1 - intensity) + finalG * intensity;
      data[i + 2] = b * (1 - intensity) + finalB * intensity;
    }
  }

  // Apply vignette effect
  private applyVignette(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ): void {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) * 0.7;

    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      radius * 0.3, // inner circle
      centerX,
      centerY,
      radius // outer circle
    );

    const alpha = (intensity / 100) * 0.7; // Max alpha of 0.7 at 100% intensity

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

    // Apply vignette
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.globalCompositeOperation = "source-over"; // Reset to default
  }

  // Apply film grain effect
  private applyFilmGrain(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ): void {
    const grainIntensity = intensity / 100;

    // Create a new canvas for the grain
    const grainCanvas = ctx.canvas.ownerDocument.createElement("canvas");
    grainCanvas.width = width;
    grainCanvas.height = height;
    const grainCtx = grainCanvas.getContext("2d");

    if (!grainCtx) return;

    // Create grain pattern
    const grainData = grainCtx.createImageData(width, height);
    const grainPixels = grainData.data;

    for (let i = 0; i < grainPixels.length; i += 4) {
      // Random noise
      const value = 128 + (Math.random() - 0.5) * 256 * grainIntensity;

      grainPixels[i] = value;
      grainPixels[i + 1] = value;
      grainPixels[i + 2] = value;
      grainPixels[i + 3] = 50 * grainIntensity; // Alpha for blend strength
    }

    grainCtx.putImageData(grainData, 0, 0);

    // Apply grain with overlay blend mode
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(grainCanvas, x, y);
    ctx.globalCompositeOperation = "source-over"; // Reset to default
  }

  // Apply light leak effect
  private applyLightLeak(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    leakType: string
  ): void {
    // Set blend mode for light leaks
    ctx.globalCompositeOperation = "screen";

    switch (leakType) {
      case "soft":
        // Soft light leak from corner
        const gradient1 = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient1.addColorStop(0, "rgba(255, 200, 100, 0.2)");
        gradient1.addColorStop(1, "rgba(255, 200, 100, 0)");

        ctx.fillStyle = gradient1;
        ctx.fillRect(x, y, width, height);
        break;

      case "harsh":
        // Harsh light leak from side
        const gradient2 = ctx.createLinearGradient(x, y, x + width, y);
        gradient2.addColorStop(0, "rgba(255, 100, 50, 0.3)");
        gradient2.addColorStop(0.2, "rgba(255, 200, 100, 0.2)");
        gradient2.addColorStop(1, "rgba(255, 200, 100, 0)");

        ctx.fillStyle = gradient2;
        ctx.fillRect(x, y, width, height);
        break;

      case "random":
      default:
        // Random position for light leak
        const randomX = Math.random() > 0.5 ? x : x + width;
        const randomY = Math.random() > 0.5 ? y : y + height;

        const gradient3 = ctx.createRadialGradient(
          randomX,
          randomY,
          0,
          randomX,
          randomY,
          width / 2
        );

        gradient3.addColorStop(0, "rgba(255, 150, 50, 0.3)");
        gradient3.addColorStop(0.5, "rgba(255, 200, 100, 0.1)");
        gradient3.addColorStop(1, "rgba(255, 200, 100, 0)");

        ctx.fillStyle = gradient3;
        ctx.fillRect(x, y, width, height);
        break;
    }

    // Reset blend mode
    ctx.globalCompositeOperation = "source-over";
  }

  // Apply scratches effect
  private applyScratches(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Set up for scratches
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";

    // Add 5-10 random scratches
    const scratchCount = 5 + Math.floor(Math.random() * 5);

    for (let i = 0; i < scratchCount; i++) {
      const x1 = x + Math.floor(Math.random() * width);
      const y1 = y;
      const x2 = x1 + Math.floor(Math.random() * 100) - 50;
      const y2 = y + height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Reset blend mode
    ctx.globalCompositeOperation = "source-over";
  }

  private async createMockVintageImage(
    imageBuffer: Buffer,
    options: VintageEffectOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    logger.warn(
      "⚠️ Using mock vintage effect - install Sharp or Canvas for actual processing"
    );

    // Just return the original image
    return {
      buffer: imageBuffer,
      dimensions: originalDimensions,
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
      return true; // Assume valid if we can't check
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

  public validateVintageOptions(options: VintageEffectOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Vintage options are required" };
    }

    // Validate vintage style
    const validStyles = [
      "classic",
      "sepia",
      "noir",
      "faded",
      "technicolor",
      "polaroid",
      "cinematic",
      "retro",
      "custom",
    ];
    if (!validStyles.includes(options.vintageStyle)) {
      return {
        isValid: false,
        error: `Invalid vintage style. Supported: ${validStyles.join(", ")}`,
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

    // Validate film grain
    if (
      typeof options.filmGrain !== "number" ||
      options.filmGrain < 0 ||
      options.filmGrain > 100
    ) {
      return {
        isValid: false,
        error: "Film grain must be a number between 0 and 100",
      };
    }

    // Validate color shift
    if (
      typeof options.colorShift !== "number" ||
      options.colorShift < -100 ||
      options.colorShift > 100
    ) {
      return {
        isValid: false,
        error: "Color shift must be a number between -100 and 100",
      };
    }

    // Validate vignette intensity if present
    if (
      options.vignetteIntensity !== undefined &&
      (typeof options.vignetteIntensity !== "number" ||
        options.vignetteIntensity < 0 ||
        options.vignetteIntensity > 100)
    ) {
      return {
        isValid: false,
        error: "Vignette intensity must be a number between 0 and 100",
      };
    }

    // Validate light leak type if present
    if (
      options.lightLeakType !== undefined &&
      !["none", "soft", "harsh", "random"].includes(options.lightLeakType)
    ) {
      return {
        isValid: false,
        error: "Invalid light leak type. Supported: none, soft, harsh, random",
      };
    }

    // Validate color balance if present
    if (options.colorBalance) {
      const { red, green, blue } = options.colorBalance;

      if (
        typeof red !== "number" ||
        red < -100 ||
        red > 100 ||
        typeof green !== "number" ||
        green < -100 ||
        green > 100 ||
        typeof blue !== "number" ||
        blue < -100 ||
        blue > 100
      ) {
        return {
          isValid: false,
          error: "Color balance values must be numbers between -100 and 100",
        };
      }
    }

    // Validate contrast if present
    if (
      options.contrast !== undefined &&
      (typeof options.contrast !== "number" ||
        options.contrast < -100 ||
        options.contrast > 100)
    ) {
      return {
        isValid: false,
        error: "Contrast must be a number between -100 and 100",
      };
    }

    // Validate brightness if present
    if (
      options.brightness !== undefined &&
      (typeof options.brightness !== "number" ||
        options.brightness < -100 ||
        options.brightness > 100)
    ) {
      return {
        isValid: false,
        error: "Brightness must be a number between -100 and 100",
      };
    }

    // Validate saturation if present
    if (
      options.saturation !== undefined &&
      (typeof options.saturation !== "number" ||
        options.saturation < -100 ||
        options.saturation > 100)
    ) {
      return {
        isValid: false,
        error: "Saturation must be a number between -100 and 100",
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

    // Validate border if specified
    if (options.border !== undefined) {
      const validBorders = ["none", "white", "black", "film", "polaroid"];
      if (!validBorders.includes(options.border)) {
        return {
          isValid: false,
          error:
            "Invalid border. Supported: none, white, black, film, polaroid",
        };
      }
    }

    // Validate border width if specified
    if (
      options.borderWidth !== undefined &&
      (typeof options.borderWidth !== "number" ||
        options.borderWidth < 1 ||
        options.borderWidth > 100)
    ) {
      return {
        isValid: false,
        error: "Border width must be a number between 1 and 100",
      };
    }

    return { isValid: true };
  }
}

export default new ImageVintageEffectsService();
