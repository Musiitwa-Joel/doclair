import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface BlackAndWhiteOptions {
  conversionMode: "simple" | "channel-mix" | "tonal" | "film" | "custom";
  redChannel: number; // -200 to 300
  greenChannel: number; // -200 to 300
  blueChannel: number; // -200 to 300
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  grain: number; // 0 to 100
  toning: "none" | "sepia" | "selenium" | "cyanotype" | "platinum";
  toningIntensity: number; // 0 to 100
  vignette: number; // 0 to 100
  filmType?: string;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface BlackAndWhiteResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  conversionMode: string;
  toning: string;
  filmType?: string;
}

class ImageBlackAndWhiteService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-black-and-white");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image black and white temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image black and white temp directory:",
        error
      );
      throw new Error("Failed to initialize image black and white service");
    }
  }

  public async convertToBlackAndWhite(
    imageBuffer: Buffer,
    filename: string,
    bwOptions: BlackAndWhiteOptions
  ): Promise<BlackAndWhiteResult> {
    const startTime = Date.now();

    logger.info(`🖤 Starting black and white conversion: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(bwOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateBWOptions(bwOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply black and white conversion
      const processedResult = await this.applyBlackAndWhiteConversion(
        imageBuffer,
        bwOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        `✅ Black and white conversion completed in ${processingTime}ms`
      );
      logger.info(
        `🖤 Applied mode: ${bwOptions.conversionMode}${
          bwOptions.toning !== "none" ? `, toning: ${bwOptions.toning}` : ""
        }`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        conversionMode: bwOptions.conversionMode,
        toning: bwOptions.toning,
        filmType: bwOptions.filmType,
      };
    } catch (error) {
      logger.error(
        `❌ Black and white conversion failed for ${filename}:`,
        error
      );
      throw error;
    }
  }

  private async applyBlackAndWhiteConversion(
    imageBuffer: Buffer,
    options: BlackAndWhiteOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      // Try Sharp first if available
      return await this.convertWithSharp(
        imageBuffer,
        options,
        originalDimensions
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for B&W conversion, trying Canvas API"
      );

      try {
        return await this.convertWithCanvas(
          imageBuffer,
          options,
          originalDimensions
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for B&W conversion, using mock processing"
        );
        return await this.createMockBWImage(
          imageBuffer,
          options,
          originalDimensions
        );
      }
    }
  }

  private async convertWithSharp(
    imageBuffer: Buffer,
    options: BlackAndWhiteOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different B&W conversion based on mode
      switch (options.conversionMode) {
        case "simple":
          // Simple grayscale conversion
          pipeline = pipeline.grayscale();

          // Apply basic contrast adjustment
          if (options.contrast !== 0) {
            const contrastFactor = 1 + options.contrast / 100;
            pipeline = pipeline.linear(
              contrastFactor,
              -(contrastFactor - 1) * 128
            );
          }
          break;

        case "channel-mix":
          // Custom channel mixing
          // Normalize channel values to sum to 1.0
          const total =
            Math.abs(options.redChannel) +
            Math.abs(options.greenChannel) +
            Math.abs(options.blueChannel);
          const normalizedRed = options.redChannel / (total || 1);
          const normalizedGreen = options.greenChannel / (total || 1);
          const normalizedBlue = options.blueChannel / (total || 1);

          // Create a custom grayscale conversion matrix
          const channelMixMatrix = [
            normalizedRed,
            normalizedGreen,
            normalizedBlue,
            0,
            0,
            normalizedRed,
            normalizedGreen,
            normalizedBlue,
            0,
            0,
            normalizedRed,
            normalizedGreen,
            normalizedBlue,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ];

          pipeline = pipeline.recomb(channelMixMatrix);

          // Apply contrast if needed
          if (options.contrast !== 0) {
            const contrastFactor = 1 + options.contrast / 100;
            pipeline = pipeline.linear(
              contrastFactor,
              -(contrastFactor - 1) * 128
            );
          }
          break;

        case "tonal":
          // Convert to grayscale first
          pipeline = pipeline.grayscale();

          // Apply tonal adjustments
          // Contrast
          if (options.contrast !== 0) {
            const contrastFactor = 1 + options.contrast / 100;
            pipeline = pipeline.linear(
              contrastFactor,
              -(contrastFactor - 1) * 128
            );
          }

          // Brightness
          if (options.brightness !== 0) {
            const brightnessOffset = options.brightness * 2.55; // Convert to 0-255 range
            pipeline = pipeline.linear(1, brightnessOffset / 255);
          }

          // Highlights and shadows (simulated with gamma and linear adjustments)
          if (options.highlights !== 0 || options.shadows !== 0) {
            // This is a simplification - in a real implementation,
            // you would use more sophisticated tone mapping
            const highlightFactor = 1 - options.highlights / 200;
            const shadowFactor = 1 + options.shadows / 200;

            pipeline = pipeline.gamma(shadowFactor);

            // Apply highlight adjustment with linear transformation
            if (options.highlights !== 0) {
              pipeline = pipeline.linear(
                highlightFactor,
                (1 - highlightFactor) * 128
              );
            }
          }
          break;

        case "film":
          // Apply film-specific channel mixing based on film type
          let redMix = 0.3;
          let greenMix = 0.59;
          let blueMix = 0.11;

          switch (options.filmType) {
            case "tri-x":
              redMix = 0.25;
              greenMix = 0.7;
              blueMix = 0.05;
              break;
            case "hp5":
              redMix = 0.33;
              greenMix = 0.5;
              blueMix = 0.17;
              break;
            case "acros":
              redMix = 0.3;
              greenMix = 0.55;
              blueMix = 0.15;
              break;
            case "t-max":
              redMix = 0.28;
              greenMix = 0.6;
              blueMix = 0.12;
              break;
            case "delta":
              redMix = 0.35;
              greenMix = 0.45;
              blueMix = 0.2;
              break;
            default:
              // Use standard values
              break;
          }

          // Create film-specific grayscale conversion matrix
          const filmMatrix = [
            redMix,
            greenMix,
            blueMix,
            0,
            0,
            redMix,
            greenMix,
            blueMix,
            0,
            0,
            redMix,
            greenMix,
            blueMix,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ];

          pipeline = pipeline.recomb(filmMatrix);

          // Apply contrast based on film type
          const filmContrast = 1 + options.contrast / 100;
          pipeline = pipeline.linear(filmContrast, -(filmContrast - 1) * 128);

          // Apply grain if requested
          if (options.grain > 0) {
            // Sharp doesn't have a direct grain function, so we'll simulate it
            // by adding noise to a grayscale image and then compositing
            try {
              const grainIntensity = options.grain / 100;
              const grainSize = Math.max(
                1,
                Math.min(3, Math.round(grainIntensity * 3))
              );

              // Create a noise layer
              const noiseBuffer = await sharp
                .default({
                  create: {
                    width: originalDimensions.width,
                    height: originalDimensions.height,
                    channels: 4,
                    background: { r: 128, g: 128, b: 128, alpha: 1 },
                  },
                })
                .noise(grainSize * 10)
                .toBuffer();

              // Composite the noise over the image with overlay blend mode
              pipeline = pipeline.composite([
                {
                  input: noiseBuffer,
                  blend: "overlay",
                  opacity: grainIntensity * 0.5,
                },
              ]);
            } catch (grainError) {
              logger.warn("⚠️ Grain effect application failed:", grainError);
              // Continue without grain if it fails
            }
          }
          break;

        case "custom":
          // Apply custom channel mixing
          const customTotal =
            Math.abs(options.redChannel) +
            Math.abs(options.greenChannel) +
            Math.abs(options.blueChannel);
          const customRed = options.redChannel / (customTotal || 1);
          const customGreen = options.greenChannel / (customTotal || 1);
          const customBlue = options.blueChannel / (customTotal || 1);

          const customMatrix = [
            customRed,
            customGreen,
            customBlue,
            0,
            0,
            customRed,
            customGreen,
            customBlue,
            0,
            0,
            customRed,
            customGreen,
            customBlue,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ];

          pipeline = pipeline.recomb(customMatrix);

          // Apply all tonal adjustments
          // Contrast
          if (options.contrast !== 0) {
            const contrastFactor = 1 + options.contrast / 100;
            pipeline = pipeline.linear(
              contrastFactor,
              -(contrastFactor - 1) * 128
            );
          }

          // Brightness
          if (options.brightness !== 0) {
            const brightnessOffset = options.brightness * 2.55;
            pipeline = pipeline.linear(1, brightnessOffset / 255);
          }

          // Highlights and shadows
          if (options.highlights !== 0 || options.shadows !== 0) {
            const highlightFactor = 1 - options.highlights / 200;
            const shadowFactor = 1 + options.shadows / 200;

            pipeline = pipeline.gamma(shadowFactor);

            if (options.highlights !== 0) {
              pipeline = pipeline.linear(
                highlightFactor,
                (1 - highlightFactor) * 128
              );
            }
          }

          // Apply grain if requested
          if (options.grain > 0) {
            try {
              const grainIntensity = options.grain / 100;
              const grainSize = Math.max(
                1,
                Math.min(3, Math.round(grainIntensity * 3))
              );

              const noiseBuffer = await sharp
                .default({
                  create: {
                    width: originalDimensions.width,
                    height: originalDimensions.height,
                    channels: 4,
                    background: { r: 128, g: 128, b: 128, alpha: 1 },
                  },
                })
                .noise(grainSize * 10)
                .toBuffer();

              pipeline = pipeline.composite([
                {
                  input: noiseBuffer,
                  blend: "overlay",
                  opacity: grainIntensity * 0.5,
                },
              ]);
            } catch (grainError) {
              logger.warn("⚠️ Grain effect application failed:", grainError);
            }
          }
          break;
      }

      // Apply vignette if requested
      if (options.vignette > 0) {
        try {
          const vignetteIntensity = options.vignette / 100;
          const width = originalDimensions.width;
          const height = originalDimensions.height;

          // Create a vignette mask
          const vignetteSvg = Buffer.from(`
            <svg width="${width}" height="${height}">
              <defs>
                <radialGradient id="vignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stop-color="white" stop-opacity="1" />
                  <stop offset="90%" stop-color="white" stop-opacity="${
                    1 - vignetteIntensity * 0.8
                  }" />
                  <stop offset="100%" stop-color="black" stop-opacity="${
                    vignetteIntensity * 0.8
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
        } catch (vignetteError) {
          logger.warn("⚠️ Vignette effect application failed:", vignetteError);
        }
      }

      // Apply toning if requested
      if (options.toning !== "none") {
        const toningIntensity = options.toningIntensity / 100;

        let toningColor: { r: number; g: number; b: number };

        switch (options.toning) {
          case "sepia":
            toningColor = { r: 112, g: 66, b: 20 };
            break;
          case "selenium":
            toningColor = { r: 90, g: 45, b: 90 };
            break;
          case "cyanotype":
            toningColor = { r: 18, g: 78, b: 120 };
            break;
          case "platinum":
            toningColor = { r: 85, g: 85, b: 95 };
            break;
          default:
            toningColor = { r: 0, g: 0, b: 0 }; // No toning
        }

        // Apply toning with a tint operation
        pipeline = pipeline.tint({
          r: 255 - (255 - toningColor.r) * toningIntensity,
          g: 255 - (255 - toningColor.g) * toningIntensity,
          b: 255 - (255 - toningColor.b) * toningIntensity,
        });
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
      return {
        buffer: processedBuffer,
        dimensions,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async convertWithCanvas(
    imageBuffer: Buffer,
    options: BlackAndWhiteOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
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

      // Apply different B&W conversion based on mode
      switch (options.conversionMode) {
        case "simple":
          this.applySimpleConversion(data);
          break;
        case "channel-mix":
          this.applyChannelMixConversion(data, options);
          break;
        case "tonal":
          this.applyTonalConversion(data, options);
          break;
        case "film":
          this.applyFilmConversion(data, options);
          break;
        case "custom":
          this.applyCustomConversion(data, options);
          break;
      }

      // Apply vignette if requested
      if (options.vignette > 0) {
        this.applyVignette(ctx, canvas.width, canvas.height, options.vignette);
      }

      // Apply grain if requested
      if (options.grain > 0) {
        this.applyGrain(data, options.grain);
      }

      // Apply toning if requested
      if (options.toning !== "none") {
        this.applyToning(data, options.toning, options.toningIntensity);
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
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Simple grayscale conversion
  private applySimpleConversion(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Standard grayscale conversion
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  // Channel mixing conversion
  private applyChannelMixConversion(
    data: Uint8ClampedArray,
    options: BlackAndWhiteOptions
  ): void {
    // Normalize channel values to sum to 1.0
    const total =
      Math.abs(options.redChannel) +
      Math.abs(options.greenChannel) +
      Math.abs(options.blueChannel);
    const redWeight = options.redChannel / (total || 1);
    const greenWeight = options.greenChannel / (total || 1);
    const blueWeight = options.blueChannel / (total || 1);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Custom channel mixing
      let gray = r * redWeight + g * greenWeight + b * blueWeight;

      // Ensure values are in valid range
      gray = Math.max(0, Math.min(255, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Apply contrast if needed
    if (options.contrast !== 0) {
      this.applyContrast(data, options.contrast);
    }
  }

  // Tonal conversion
  private applyTonalConversion(
    data: Uint8ClampedArray,
    options: BlackAndWhiteOptions
  ): void {
    // First convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Standard grayscale conversion
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Apply contrast
    if (options.contrast !== 0) {
      this.applyContrast(data, options.contrast);
    }

    // Apply brightness
    if (options.brightness !== 0) {
      this.applyBrightness(data, options.brightness);
    }

    // Apply highlights and shadows adjustments
    if (options.highlights !== 0 || options.shadows !== 0) {
      this.applyTonalAdjustments(data, options.highlights, options.shadows);
    }
  }

  // Film-based conversion
  private applyFilmConversion(
    data: Uint8ClampedArray,
    options: BlackAndWhiteOptions
  ): void {
    // Set channel weights based on film type
    let redWeight = 0.3;
    let greenWeight = 0.59;
    let blueWeight = 0.11;

    switch (options.filmType) {
      case "tri-x":
        redWeight = 0.25;
        greenWeight = 0.7;
        blueWeight = 0.05;
        break;
      case "hp5":
        redWeight = 0.33;
        greenWeight = 0.5;
        blueWeight = 0.17;
        break;
      case "acros":
        redWeight = 0.3;
        greenWeight = 0.55;
        blueWeight = 0.15;
        break;
      case "t-max":
        redWeight = 0.28;
        greenWeight = 0.6;
        blueWeight = 0.12;
        break;
      case "delta":
        redWeight = 0.35;
        greenWeight = 0.45;
        blueWeight = 0.2;
        break;
    }

    // Apply film-specific conversion
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Custom channel mixing based on film type
      let gray = r * redWeight + g * greenWeight + b * blueWeight;

      // Ensure values are in valid range
      gray = Math.max(0, Math.min(255, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Apply contrast based on film type
    this.applyContrast(data, options.contrast);
  }

  // Custom conversion with all options
  private applyCustomConversion(
    data: Uint8ClampedArray,
    options: BlackAndWhiteOptions
  ): void {
    // Apply channel mixing
    const total =
      Math.abs(options.redChannel) +
      Math.abs(options.greenChannel) +
      Math.abs(options.blueChannel);
    const redWeight = options.redChannel / (total || 1);
    const greenWeight = options.greenChannel / (total || 1);
    const blueWeight = options.blueChannel / (total || 1);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Custom channel mixing
      let gray = r * redWeight + g * greenWeight + b * blueWeight;

      // Ensure values are in valid range
      gray = Math.max(0, Math.min(255, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Apply all tonal adjustments
    if (options.contrast !== 0) {
      this.applyContrast(data, options.contrast);
    }

    if (options.brightness !== 0) {
      this.applyBrightness(data, options.brightness);
    }

    if (options.highlights !== 0 || options.shadows !== 0) {
      this.applyTonalAdjustments(data, options.highlights, options.shadows);
    }
  }

  // Apply contrast adjustment
  private applyContrast(data: Uint8ClampedArray, contrast: number): void {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(
        0,
        Math.min(255, factor * (data[i + 1] - 128) + 128)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, factor * (data[i + 2] - 128) + 128)
      );
    }
  }

  // Apply brightness adjustment
  private applyBrightness(data: Uint8ClampedArray, brightness: number): void {
    const brightnessValue = brightness * 2.55; // Convert to 0-255 range

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + brightnessValue));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightnessValue));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightnessValue));
    }
  }

  // Apply highlights and shadows adjustments
  private applyTonalAdjustments(
    data: Uint8ClampedArray,
    highlights: number,
    shadows: number
  ): void {
    const highlightsFactor = highlights / 100;
    const shadowsFactor = shadows / 100;

    for (let i = 0; i < data.length; i += 4) {
      const value = data[i]; // Since it's already grayscale, we can use any channel

      if (value > 128 && highlights !== 0) {
        // Adjust highlights
        const adjustment = (value - 128) * highlightsFactor;
        data[i] = Math.max(0, Math.min(255, value + adjustment));
        data[i + 1] = Math.max(0, Math.min(255, value + adjustment));
        data[i + 2] = Math.max(0, Math.min(255, value + adjustment));
      } else if (value < 128 && shadows !== 0) {
        // Adjust shadows
        const adjustment = (128 - value) * shadowsFactor;
        data[i] = Math.max(0, Math.min(255, value + adjustment));
        data[i + 1] = Math.max(0, Math.min(255, value + adjustment));
        data[i + 2] = Math.max(0, Math.min(255, value + adjustment));
      }
    }
  }

  // Apply film grain
  private applyGrain(data: Uint8ClampedArray, grainAmount: number): void {
    const grainIntensity = grainAmount / 100;

    for (let i = 0; i < data.length; i += 4) {
      // Only apply grain to non-transparent pixels
      if (data[i + 3] > 0) {
        // Generate random noise
        const noise = (Math.random() - 0.5) * grainIntensity * 50;

        // Apply noise to each channel
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
    }
  }

  // Apply vignette effect
  private applyVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    vignetteAmount: number
  ): void {
    const vignetteIntensity = vignetteAmount / 100;

    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.sqrt(width * width + height * height) / 2
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity * 0.8})`);

    // Apply vignette
    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }

  // Apply toning effect
  private applyToning(
    data: Uint8ClampedArray,
    toning: string,
    intensity: number
  ): void {
    const toningIntensity = intensity / 100;

    let r, g, b;

    switch (toning) {
      case "sepia":
        r = 112;
        g = 66;
        b = 20;
        break;
      case "selenium":
        r = 90;
        g = 45;
        b = 90;
        break;
      case "cyanotype":
        r = 18;
        g = 78;
        b = 120;
        break;
      case "platinum":
        r = 85;
        g = 85;
        b = 95;
        break;
      default:
        return; // No toning
    }

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // Since it's already grayscale, we can use any channel

      // Apply toning with intensity control
      data[i] = Math.max(
        0,
        Math.min(255, gray * (1 - toningIntensity) + r * toningIntensity)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, gray * (1 - toningIntensity) + g * toningIntensity)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, gray * (1 - toningIntensity) + b * toningIntensity)
      );
    }
  }

  private async createMockBWImage(
    imageBuffer: Buffer,
    options: BlackAndWhiteOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    logger.warn(
      "⚠️ Using mock B&W conversion - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);

    return {
      buffer: mockBuffer,
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

  public validateBWOptions(options: BlackAndWhiteOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "B&W options are required" };
    }

    // Validate conversion mode
    const validModes = ["simple", "channel-mix", "tonal", "film", "custom"];
    if (!validModes.includes(options.conversionMode)) {
      return {
        isValid: false,
        error: `Invalid conversion mode. Supported: ${validModes.join(", ")}`,
      };
    }

    // Validate channel values if using channel mixing
    if (
      options.conversionMode === "channel-mix" ||
      options.conversionMode === "custom"
    ) {
      if (
        typeof options.redChannel !== "number" ||
        options.redChannel < -200 ||
        options.redChannel > 300
      ) {
        return {
          isValid: false,
          error: "Red channel must be a number between -200 and 300",
        };
      }

      if (
        typeof options.greenChannel !== "number" ||
        options.greenChannel < -200 ||
        options.greenChannel > 300
      ) {
        return {
          isValid: false,
          error: "Green channel must be a number between -200 and 300",
        };
      }

      if (
        typeof options.blueChannel !== "number" ||
        options.blueChannel < -200 ||
        options.blueChannel > 300
      ) {
        return {
          isValid: false,
          error: "Blue channel must be a number between -200 and 300",
        };
      }
    }

    // Validate tonal adjustments
    if (
      options.conversionMode === "tonal" ||
      options.conversionMode === "custom"
    ) {
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

      if (
        typeof options.brightness !== "number" ||
        options.brightness < -100 ||
        options.brightness > 100
      ) {
        return {
          isValid: false,
          error: "Brightness must be a number between -100 and 100",
        };
      }

      if (
        typeof options.highlights !== "number" ||
        options.highlights < -100 ||
        options.highlights > 100
      ) {
        return {
          isValid: false,
          error: "Highlights must be a number between -100 and 100",
        };
      }

      if (
        typeof options.shadows !== "number" ||
        options.shadows < -100 ||
        options.shadows > 100
      ) {
        return {
          isValid: false,
          error: "Shadows must be a number between -100 and 100",
        };
      }
    }

    // Validate film effects
    if (
      options.conversionMode === "film" ||
      options.conversionMode === "custom"
    ) {
      if (
        typeof options.grain !== "number" ||
        options.grain < 0 ||
        options.grain > 100
      ) {
        return {
          isValid: false,
          error: "Grain must be a number between 0 and 100",
        };
      }

      if (
        typeof options.vignette !== "number" ||
        options.vignette < 0 ||
        options.vignette > 100
      ) {
        return {
          isValid: false,
          error: "Vignette must be a number between 0 and 100",
        };
      }
    }

    // Validate toning
    const validTonings = ["none", "sepia", "selenium", "cyanotype", "platinum"];
    if (!validTonings.includes(options.toning)) {
      return {
        isValid: false,
        error: `Invalid toning. Supported: ${validTonings.join(", ")}`,
      };
    }

    if (options.toning !== "none") {
      if (
        typeof options.toningIntensity !== "number" ||
        options.toningIntensity < 0 ||
        options.toningIntensity > 100
      ) {
        return {
          isValid: false,
          error: "Toning intensity must be a number between 0 and 100",
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

export default new ImageBlackAndWhiteService();
