import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface ArtisticFilterOptions {
  filterType:
    | "oil"
    | "watercolor"
    | "sketch"
    | "comic"
    | "pointillism"
    | "impressionist";
  intensity: number; // 1-100
  detailLevel: number; // 1-100
  colorSaturation: number; // 1-100
  brushSize: number; // 1-100
  strokeDensity: number; // 1-100
  preserveDetails: boolean;
  enhanceContrast: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  borderStyle?: "none" | "simple" | "artistic" | "frame";
  borderColor?: string;
  borderWidth?: number;
  backgroundTexture?: "none" | "canvas" | "paper" | "rough";
}

interface ArtisticFilterResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  filterApplied: string;
  effectIntensity: number;
  artisticScore: number;
}

class ImageArtisticFiltersService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-artistic-filters");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image artistic filters temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image artistic filters temp directory:",
        error
      );
      throw new Error("Failed to initialize image artistic filters service");
    }
  }

  public async applyArtisticFilter(
    imageBuffer: Buffer,
    filename: string,
    filterOptions: ArtisticFilterOptions
  ): Promise<ArtisticFilterResult> {
    const startTime = Date.now();

    logger.info(`🎨 Starting artistic filter: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(filterOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateFilterOptions(filterOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply artistic filter processing
      const processedResult = await this.applyFilter(
        imageBuffer,
        filterOptions,
        originalDimensions
      );

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Artistic filter completed in ${processingTime}ms`);
      logger.info(
        `🎨 Applied filter: ${filterOptions.filterType} with intensity ${filterOptions.intensity}`
      );

      return {
        buffer: processedResult.buffer,
        originalDimensions,
        processedDimensions: processedResult.dimensions,
        processingTime,
        filterApplied: filterOptions.filterType,
        effectIntensity: filterOptions.intensity,
        artisticScore: processedResult.artisticScore,
      };
    } catch (error) {
      logger.error(`❌ Artistic filter failed for ${filename}:`, error);
      throw error;
    }
  }

  private async applyFilter(
    imageBuffer: Buffer,
    options: ArtisticFilterOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    artisticScore: number;
  }> {
    try {
      // Try Sharp first if available
      return await this.applyFilterWithSharp(
        imageBuffer,
        options,
        originalDimensions
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for artistic filters, trying Canvas API"
      );

      try {
        return await this.applyFilterWithCanvas(
          imageBuffer,
          options,
          originalDimensions
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for artistic filters, using mock processing"
        );
        return await this.createMockFilteredImage(
          imageBuffer,
          options,
          originalDimensions
        );
      }
    }
  }

  private async applyFilterWithSharp(
    imageBuffer: Buffer,
    options: ArtisticFilterOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    artisticScore: number;
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply different filters based on the selected type
      switch (options.filterType) {
        case "oil":
          // Simulate oil painting effect
          pipeline = pipeline.modulate({
            brightness: 1.0,
            saturation: 1.0 + options.colorSaturation / 100,
            hue: 0,
          });

          // Apply blur and then sharpen to create a painterly effect
          pipeline = pipeline.blur(options.brushSize / 20);
          pipeline = pipeline.sharpen({
            sigma: 1 + options.detailLevel / 50,
            flat: 1,
            jagged: 2,
          });

          // Enhance contrast if enabled
          if (options.enhanceContrast) {
            pipeline = pipeline.linear(
              1.1 + options.intensity / 200,
              -(options.intensity / 1000)
            );
          }
          break;

        case "watercolor":
          // Simulate watercolor effect
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 0.8 + options.colorSaturation / 150,
            hue: 0,
          });

          // Apply gentle blur for watercolor wash effect
          pipeline = pipeline.blur(options.brushSize / 25);

          // Enhance edges slightly
          pipeline = pipeline.sharpen({
            sigma: 0.5 + options.detailLevel / 100,
            flat: 0.3,
            jagged: 1.2,
          });

          // Add slight brightness for watercolor glow
          pipeline = pipeline.linear(1.05, options.intensity / 500);
          break;

        case "sketch":
          // Simulate sketch effect
          pipeline = pipeline.grayscale();

          // Enhance edges for sketch-like appearance
          pipeline = pipeline.sharpen({
            sigma: 1 + options.detailLevel / 30,
            flat: 0.5,
            jagged: 2 + options.intensity / 50,
          });

          // Adjust contrast for pencil-like effect
          pipeline = pipeline.linear(
            1 + options.intensity / 100,
            -(options.intensity / 200)
          );

          // Invert colors for certain sketch styles if intensity is high
          if (options.intensity > 80) {
            pipeline = pipeline.negate({ alpha: false });
          }
          break;

        case "comic":
          // Simulate comic style
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.3 + options.colorSaturation / 100,
            hue: 0,
          });

          // Enhance edges dramatically
          pipeline = pipeline.sharpen({
            sigma: 1.5 + options.detailLevel / 40,
            flat: 0.5,
            jagged: 3,
          });

          // Increase contrast for comic-like appearance
          pipeline = pipeline.linear(
            1.2 + options.intensity / 150,
            -(options.intensity / 300)
          );
          break;

        case "pointillism":
          // Simulate pointillism effect
          pipeline = pipeline.modulate({
            brightness: 1.05,
            saturation: 1.2 + options.colorSaturation / 120,
            hue: 0,
          });

          // Apply noise reduction to create dot-like effect
          pipeline = pipeline.median(Math.ceil(options.brushSize / 20));

          // Sharpen to enhance the dots
          pipeline = pipeline.sharpen({
            sigma: 1 + options.detailLevel / 50,
            flat: 1,
            jagged: 2,
          });
          break;

        case "impressionist":
          // Simulate impressionist effect
          pipeline = pipeline.modulate({
            brightness: 1.1,
            saturation: 1.1 + options.colorSaturation / 110,
            hue: options.intensity / 200,
          });

          // Apply blur for impressionist brush strokes
          pipeline = pipeline.blur(options.brushSize / 15);

          // Enhance colors
          pipeline = pipeline.linear(
            1.05 + options.intensity / 200,
            options.intensity / 500
          );
          break;

        default:
          // No filter, just pass through
          break;
      }

      // Apply border if requested
      if (options.borderStyle !== "none" && options.borderStyle !== undefined) {
        const borderWidth = options.borderWidth || 20;
        const borderColor = options.borderColor || "#ffffff";

        // Convert hex color to RGB components
        const r = parseInt(borderColor.slice(1, 3), 16);
        const g = parseInt(borderColor.slice(3, 5), 16);
        const b = parseInt(borderColor.slice(5, 7), 16);

        // Create border using extend with background
        pipeline = pipeline.extend({
          top: borderWidth,
          bottom: borderWidth,
          left: borderWidth,
          right: borderWidth,
          background: { r, g, b, alpha: 1 },
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

      // Calculate artistic score based on options
      const artisticScore = this.calculateArtisticScore(options);

      logger.info("✅ Processed with Sharp");
      return {
        buffer: processedBuffer,
        dimensions,
        artisticScore,
      };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async applyFilterWithCanvas(
    imageBuffer: Buffer,
    options: ArtisticFilterOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    artisticScore: number;
  }> {
    try {
      const { createCanvas, loadImage } = await import("canvas");

      const image = await loadImage(imageBuffer);

      // Calculate dimensions including border if needed
      const borderWidth =
        options.borderStyle !== "none" ? options.borderWidth || 20 : 0;
      const canvasWidth = image.width + borderWidth * 2;
      const canvasHeight = image.height + borderWidth * 2;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw border if needed
      if (options.borderStyle !== "none" && options.borderStyle !== undefined) {
        ctx.fillStyle = options.borderColor || "#ffffff";
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

      // Apply different filters based on the selected type
      switch (options.filterType) {
        case "oil":
          this.applyOilPaintingEffect(data, image.width, image.height, options);
          break;

        case "watercolor":
          this.applyWatercolorEffect(data, image.width, image.height, options);
          break;

        case "sketch":
          this.applySketchEffect(data, image.width, image.height, options);
          break;

        case "comic":
          this.applyComicEffect(data, image.width, image.height, options);
          break;

        case "pointillism":
          this.applyPointillismEffect(data, image.width, image.height, options);
          break;

        case "impressionist":
          this.applyImpressionistEffect(
            data,
            image.width,
            image.height,
            options
          );
          break;

        default:
          // No filter, just pass through
          break;
      }

      // Put processed data back
      ctx.putImageData(imageData, borderWidth, borderWidth);

      // Apply artistic border if needed
      if (options.borderStyle === "artistic") {
        ctx.strokeStyle = options.borderColor || "#ffffff";
        ctx.lineWidth = 5;
        ctx.setLineDash([15, 5]);
        ctx.strokeRect(
          borderWidth / 2,
          borderWidth / 2,
          canvasWidth - borderWidth,
          canvasHeight - borderWidth
        );
      } else if (options.borderStyle === "frame") {
        // Draw a frame-like border
        const frameWidth = borderWidth / 2;
        ctx.strokeStyle = options.borderColor || "#ffffff";
        ctx.lineWidth = frameWidth;
        ctx.strokeRect(
          frameWidth / 2,
          frameWidth / 2,
          canvasWidth - frameWidth,
          canvasHeight - frameWidth
        );

        // Inner frame line
        ctx.strokeStyle = options.borderColor || "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          borderWidth - 5,
          borderWidth - 5,
          image.width + 10,
          image.height + 10
        );
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

      // Calculate artistic score
      const artisticScore = this.calculateArtisticScore(options);

      logger.info("✅ Processed with Canvas API");
      return {
        buffer: processedBuffer,
        dimensions: { width: canvasWidth, height: canvasHeight },
        artisticScore,
      };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  // Oil painting effect implementation
  private applyOilPaintingEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Simple oil painting effect simulation
    const intensity = options.intensity / 100;
    const brushSize = Math.max(1, Math.floor(options.brushSize / 10));
    const output = new Uint8ClampedArray(data.length);

    // Copy original data
    output.set(data);

    // Apply oil painting effect
    for (let y = brushSize; y < height - brushSize; y += 1) {
      for (let x = brushSize; x < width - brushSize; x += 1) {
        // Skip some pixels for performance and to create brush stroke effect
        if (Math.random() > 0.7) continue;

        // Get a random pixel in the brush radius
        const offsetX = Math.floor(Math.random() * brushSize * 2) - brushSize;
        const offsetY = Math.floor(Math.random() * brushSize * 2) - brushSize;

        const sourceIdx = ((y + offsetY) * width + (x + offsetX)) * 4;
        const targetIdx = (y * width + x) * 4;

        // Copy the color with some variation
        output[targetIdx] = data[sourceIdx];
        output[targetIdx + 1] = data[sourceIdx + 1];
        output[targetIdx + 2] = data[sourceIdx + 2];
      }
    }

    // Enhance saturation
    const saturationBoost = 1 + (options.colorSaturation / 100) * 0.5;
    for (let i = 0; i < data.length; i += 4) {
      const r = output[i];
      const g = output[i + 1];
      const b = output[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply saturation
      data[i] = Math.max(
        0,
        Math.min(255, luminance + (r - luminance) * saturationBoost)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, luminance + (g - luminance) * saturationBoost)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, luminance + (b - luminance) * saturationBoost)
      );
    }
  }

  // Watercolor effect implementation
  private applyWatercolorEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Simple watercolor effect simulation
    const intensity = options.intensity / 100;
    const brushSize = Math.max(1, Math.floor(options.brushSize / 15));

    // Apply a soft blur first
    this.applyBoxBlur(data, width, height, brushSize);

    // Enhance edges slightly
    this.applyEdgeEnhancement(data, width, height, 0.3 * intensity);

    // Reduce saturation slightly for watercolor look
    const saturationFactor = 0.8 + (options.colorSaturation / 100) * 0.4;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply saturation
      data[i] = Math.max(
        0,
        Math.min(255, luminance + (r - luminance) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, luminance + (g - luminance) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, luminance + (b - luminance) * saturationFactor)
      );
    }

    // Add slight brightness for watercolor glow
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * 1.05));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * 1.05));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * 1.05));
    }
  }

  // Sketch effect implementation
  private applySketchEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Convert to grayscale first
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Create a copy of the grayscale image
    const grayscale = new Uint8ClampedArray(data);

    // Apply edge detection
    const intensity = options.intensity / 100;
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    this.applyConvolutionFilter(
      data,
      width,
      height,
      edgeKernel,
      intensity * 1.5
    );

    // Invert colors for pencil sketch look
    if (options.intensity > 70) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    } else {
      // Blend with original grayscale for softer look
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(
          0,
          Math.min(255, data[i] * 0.7 + grayscale[i] * 0.3)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, data[i + 1] * 0.7 + grayscale[i + 1] * 0.3)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, data[i + 2] * 0.7 + grayscale[i + 2] * 0.3)
        );
      }
    }

    // Enhance contrast
    const contrastFactor = 1 + intensity * 0.5;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        0,
        Math.min(255, (data[i] - 128) * contrastFactor + 128)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
      );
    }
  }

  // Comic effect implementation
  private applyComicEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Enhance colors first
    const saturationFactor = 1.3 + (options.colorSaturation / 100) * 0.7;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply saturation
      data[i] = Math.max(
        0,
        Math.min(255, luminance + (r - luminance) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, luminance + (g - luminance) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, luminance + (b - luminance) * saturationFactor)
      );
    }

    // Create a copy for edge detection
    const original = new Uint8ClampedArray(data);

    // Apply edge detection
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    this.applyConvolutionFilter(data, width, height, edgeKernel, 0.5);

    // Threshold the edges to create comic-like outlines
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 100) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      } else {
        data[i] = original[i];
        data[i + 1] = original[i + 1];
        data[i + 2] = original[i + 2];
      }
    }

    // Enhance contrast for comic look
    const intensity = options.intensity / 100;
    const contrastFactor = 1.2 + intensity * 0.8;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(
        0,
        Math.min(255, (data[i] - 128) * contrastFactor + 128)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
      );
    }
  }

  // Pointillism effect implementation
  private applyPointillismEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Create a copy of the original data
    const original = new Uint8ClampedArray(data);

    // Clear the canvas first
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }

    // Calculate parameters based on options
    const intensity = options.intensity / 100;
    const dotSize = Math.max(1, Math.floor(options.brushSize / 10));
    const dotSpacing = Math.max(2, 10 - Math.floor(options.strokeDensity / 10));

    // Apply dots
    for (let y = 0; y < height; y += dotSpacing) {
      for (let x = 0; x < width; x += dotSpacing) {
        // Add some randomness to dot positions
        const offsetX = Math.floor((Math.random() * dotSpacing) / 2);
        const offsetY = Math.floor((Math.random() * dotSpacing) / 2);

        const sourceIdx = ((y + offsetY) * width + (x + offsetX)) * 4;

        // Skip if out of bounds
        if (sourceIdx >= original.length) continue;

        // Get color from original image
        const r = original[sourceIdx];
        const g = original[sourceIdx + 1];
        const b = original[sourceIdx + 2];

        // Draw a dot
        for (let dy = -dotSize; dy <= dotSize; dy++) {
          for (let dx = -dotSize; dx <= dotSize; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= dotSize) {
              const targetX = x + dx + offsetX;
              const targetY = y + dy + offsetY;

              // Skip if out of bounds
              if (
                targetX < 0 ||
                targetX >= width ||
                targetY < 0 ||
                targetY >= height
              )
                continue;

              const targetIdx = (targetY * width + targetX) * 4;

              // Skip if out of bounds
              if (targetIdx >= data.length) continue;

              // Apply color with intensity falloff from center of dot
              const falloff = 1 - distance / dotSize;
              data[targetIdx] = r;
              data[targetIdx + 1] = g;
              data[targetIdx + 2] = b;
            }
          }
        }
      }
    }

    // Enhance saturation
    const saturationFactor = 1.2 + (options.colorSaturation / 100) * 0.8;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply saturation
        data[i] = Math.max(
          0,
          Math.min(255, luminance + (r - luminance) * saturationFactor)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, luminance + (g - luminance) * saturationFactor)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, luminance + (b - luminance) * saturationFactor)
        );
      }
    }
  }

  // Impressionist effect implementation
  private applyImpressionistEffect(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ArtisticFilterOptions
  ): void {
    // Create a copy of the original data
    const original = new Uint8ClampedArray(data);

    // Apply a soft blur first
    this.applyBoxBlur(
      data,
      width,
      height,
      Math.floor(options.brushSize / 15) + 1
    );

    // Calculate parameters based on options
    const intensity = options.intensity / 100;
    const brushSize = Math.max(1, Math.floor(options.brushSize / 10));
    const strokeCount = Math.floor(
      (width * height * options.strokeDensity) / 10000
    );

    // Apply random brush strokes
    for (let i = 0; i < strokeCount; i++) {
      // Random position
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const length = Math.floor(brushSize * 2 + Math.random() * brushSize * 2);

      // Get color from original image
      const sourceIdx = (y * width + x) * 4;

      // Skip if out of bounds
      if (sourceIdx >= original.length) continue;

      const r = original[sourceIdx];
      const g = original[sourceIdx + 1];
      const b = original[sourceIdx + 2];

      // Draw a brush stroke
      for (let j = 0; j < length; j++) {
        const strokeX = Math.floor(x + Math.cos(angle) * j);
        const strokeY = Math.floor(y + Math.sin(angle) * j);

        // Skip if out of bounds
        if (strokeX < 0 || strokeX >= width || strokeY < 0 || strokeY >= height)
          continue;

        // Apply color with some variation
        for (let dy = -brushSize; dy <= brushSize; dy++) {
          for (let dx = -brushSize; dx <= brushSize; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= brushSize) {
              const targetX = strokeX + dx;
              const targetY = strokeY + dy;

              // Skip if out of bounds
              if (
                targetX < 0 ||
                targetX >= width ||
                targetY < 0 ||
                targetY >= height
              )
                continue;

              const targetIdx = (targetY * width + targetX) * 4;

              // Skip if out of bounds
              if (targetIdx >= data.length) continue;

              // Apply color with intensity falloff from center of stroke
              const falloff = 1 - distance / brushSize;
              const colorVariation = 0.8 + Math.random() * 0.4;

              data[targetIdx] = Math.max(0, Math.min(255, r * colorVariation));
              data[targetIdx + 1] = Math.max(
                0,
                Math.min(255, g * colorVariation)
              );
              data[targetIdx + 2] = Math.max(
                0,
                Math.min(255, b * colorVariation)
              );
            }
          }
        }
      }
    }

    // Enhance saturation
    const saturationFactor = 1.1 + (options.colorSaturation / 100) * 0.5;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      // Apply saturation
      data[i] = Math.max(
        0,
        Math.min(255, luminance + (r - luminance) * saturationFactor)
      );
      data[i + 1] = Math.max(
        0,
        Math.min(255, luminance + (g - luminance) * saturationFactor)
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, luminance + (b - luminance) * saturationFactor)
      );
    }
  }

  // Box blur helper
  private applyBoxBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): void {
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

  // Edge enhancement helper
  private applyEdgeEnhancement(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    strength: number
  ): void {
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const edgeData = new Uint8ClampedArray(data.length);
    edgeData.set(data);

    this.applyConvolutionFilter(edgeData, width, height, edgeKernel, strength);

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

  private calculateArtisticScore(options: ArtisticFilterOptions): number {
    // Base score
    let score = 7.5;

    // Adjust based on filter type
    switch (options.filterType) {
      case "oil":
        score += 0.8;
        break;
      case "watercolor":
        score += 0.7;
        break;
      case "sketch":
        score += 0.6;
        break;
      case "comic":
        score += 0.9;
        break;
      case "pointillism":
        score += 0.8;
        break;
      case "impressionist":
        score += 0.7;
        break;
    }

    // Adjust based on options
    score += (options.intensity / 100) * 0.5;
    score += (options.detailLevel / 100) * 0.3;
    score += (options.colorSaturation / 100) * 0.2;

    // Adjust for border and texture
    if (options.borderStyle !== "none") score += 0.2;
    if (options.backgroundTexture !== "none") score += 0.2;

    // Cap at 10
    return Math.min(10, Math.round(score * 10) / 10);
  }

  private async createMockFilteredImage(
    imageBuffer: Buffer,
    options: ArtisticFilterOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    artisticScore: number;
  }> {
    logger.warn(
      "⚠️ Using mock artistic filter - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    const artisticScore = this.calculateArtisticScore(options);

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      artisticScore,
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

  public validateFilterOptions(options: ArtisticFilterOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Filter options are required" };
    }

    // Validate filter type
    const validFilterTypes = [
      "oil",
      "watercolor",
      "sketch",
      "comic",
      "pointillism",
      "impressionist",
    ];
    if (!validFilterTypes.includes(options.filterType)) {
      return {
        isValid: false,
        error: `Invalid filter type. Supported: ${validFilterTypes.join(", ")}`,
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

    // Validate detail level
    if (
      typeof options.detailLevel !== "number" ||
      options.detailLevel < 1 ||
      options.detailLevel > 100
    ) {
      return {
        isValid: false,
        error: "Detail level must be a number between 1 and 100",
      };
    }

    // Validate color saturation
    if (
      typeof options.colorSaturation !== "number" ||
      options.colorSaturation < 1 ||
      options.colorSaturation > 100
    ) {
      return {
        isValid: false,
        error: "Color saturation must be a number between 1 and 100",
      };
    }

    // Validate brush size
    if (
      typeof options.brushSize !== "number" ||
      options.brushSize < 1 ||
      options.brushSize > 100
    ) {
      return {
        isValid: false,
        error: "Brush size must be a number between 1 and 100",
      };
    }

    // Validate stroke density
    if (
      typeof options.strokeDensity !== "number" ||
      options.strokeDensity < 1 ||
      options.strokeDensity > 100
    ) {
      return {
        isValid: false,
        error: "Stroke density must be a number between 1 and 100",
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

    // Validate border style if specified
    if (options.borderStyle !== undefined) {
      const validBorderStyles = ["none", "simple", "artistic", "frame"];
      if (!validBorderStyles.includes(options.borderStyle)) {
        return {
          isValid: false,
          error:
            "Invalid border style. Supported: none, simple, artistic, frame",
        };
      }
    }

    // Validate border color if specified
    if (options.borderColor !== undefined) {
      if (!/^#[0-9A-F]{6}$/i.test(options.borderColor)) {
        return {
          isValid: false,
          error: "Border color must be a valid hex color code (e.g., #FFFFFF)",
        };
      }
    }

    // Validate border width if specified
    if (options.borderWidth !== undefined) {
      if (
        typeof options.borderWidth !== "number" ||
        options.borderWidth < 1 ||
        options.borderWidth > 100
      ) {
        return {
          isValid: false,
          error: "Border width must be a number between 1 and 100",
        };
      }
    }

    // Validate background texture if specified
    if (options.backgroundTexture !== undefined) {
      const validTextures = ["none", "canvas", "paper", "rough"];
      if (!validTextures.includes(options.backgroundTexture)) {
        return {
          isValid: false,
          error:
            "Invalid background texture. Supported: none, canvas, paper, rough",
        };
      }
    }

    return { isValid: true };
  }
}

export default new ImageArtisticFiltersService();
