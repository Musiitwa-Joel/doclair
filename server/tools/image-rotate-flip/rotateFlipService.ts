import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface RotateFlipOptions {
  rotation: number; // degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  backgroundColor?: string; // for rotation padding
  cropToFit?: boolean; // crop to original dimensions after rotation
  combineMode?: "none" | "side-by-side" | "top-bottom" | "overlay";
  spacing?: number; // spacing between images when combining
  alignment?: "start" | "center" | "end";
}

interface RotateFlipResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  format: string;
  operations: string[];
  imageCount: number;
}

class ImageRotateFlipService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-rotate-flip");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image rotate/flip temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image rotate/flip temp directory:",
        error
      );
      throw new Error("Failed to initialize image rotate/flip service");
    }
  }

  public async processImages(
    imageBuffers: Buffer[],
    filenames: string[],
    rotateFlipOptions: RotateFlipOptions
  ): Promise<RotateFlipResult> {
    const startTime = Date.now();

    logger.info(
      `🔄 Starting rotate/flip processing for ${imageBuffers.length} image(s)`
    );
    logger.info(`⚙️ Options: ${JSON.stringify(rotateFlipOptions)}`);

    try {
      // Validate image buffers
      for (let i = 0; i < imageBuffers.length; i++) {
        if (!imageBuffers[i] || imageBuffers[i].length === 0) {
          throw new Error(
            `Invalid image buffer for image ${i + 1} - appears to be empty`
          );
        }

        if (!this.isValidImageBuffer(imageBuffers[i])) {
          throw new Error(
            `Invalid image format for image ${
              i + 1
            } - not a supported image file`
          );
        }
      }

      // Basic validation of options
      const validation = this.validateRotateFlipOptions(rotateFlipOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get dimensions of all images
      const imageDimensions = await Promise.all(
        imageBuffers.map((buffer) => this.getImageDimensions(buffer))
      );

      logger.info(
        `📐 Image dimensions: ${imageDimensions
          .map((d) => `${d.width}x${d.height}`)
          .join(", ")}`
      );

      // Process each image individually first
      const processedImages = await Promise.all(
        imageBuffers.map(async (buffer, index) => {
          return await this.processIndividualImage(
            buffer,
            filenames[index],
            rotateFlipOptions,
            imageDimensions[index]
          );
        })
      );

      // Combine images if needed
      let finalBuffer: Buffer;
      let finalDimensions: { width: number; height: number };
      let operations: string[] = [];

      if (
        imageBuffers.length === 1 ||
        rotateFlipOptions.combineMode === "none"
      ) {
        // Single image or no combining
        finalBuffer = processedImages[0].buffer;
        finalDimensions = processedImages[0].dimensions;
        operations = processedImages[0].operations;
      } else {
        // Combine multiple images
        const combineResult = await this.combineImages(
          processedImages,
          rotateFlipOptions
        );
        finalBuffer = combineResult.buffer;
        finalDimensions = combineResult.dimensions;
        operations = [
          ...processedImages[0].operations,
          `Combined ${imageBuffers.length} images`,
        ];
      }

      const processingTime = Date.now() - startTime;

      logger.info(`✅ Rotate/flip processing completed in ${processingTime}ms`);
      logger.info(
        `📊 Final dimensions: ${finalDimensions.width}x${finalDimensions.height}`
      );

      return {
        buffer: finalBuffer,
        originalDimensions: imageDimensions[0], // Use first image as reference
        processedDimensions: finalDimensions,
        processingTime,
        format: rotateFlipOptions.outputFormat || "png",
        operations,
        imageCount: imageBuffers.length,
      };
    } catch (error) {
      logger.error(`❌ Rotate/flip processing failed:`, error);
      throw error;
    }
  }

  private async processIndividualImage(
    imageBuffer: Buffer,
    filename: string,
    options: RotateFlipOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    operations: string[];
  }> {
    const operations: string[] = [];

    try {
      // Try to use Sharp if available (best option)
      return await this.processWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        operations
      );
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available, trying Canvas API");

      try {
        // Fallback to Canvas API
        return await this.processWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          operations
        );
      } catch (canvasError) {
        logger.warn("⚠️ Canvas API not available, using mock processing");

        // Final fallback
        return await this.createMockProcessedImage(
          imageBuffer,
          options,
          originalDimensions,
          operations
        );
      }
    }
  }

  private async processWithSharp(
    imageBuffer: Buffer,
    options: RotateFlipOptions,
    originalDimensions: { width: number; height: number },
    operations: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    operations: string[];
  }> {
    try {
      const sharp = await import("sharp");
      let pipeline = sharp.default(imageBuffer);

      // Apply rotation
      if (options.rotation !== 0) {
        const backgroundColor = options.backgroundColor || "#ffffff";
        pipeline = pipeline.rotate(options.rotation, {
          background: backgroundColor,
        });
        operations.push(`Rotated ${options.rotation}°`);
      }

      // Apply flips
      if (options.flipHorizontal) {
        pipeline = pipeline.flop();
        operations.push("Flipped horizontally");
      }

      if (options.flipVertical) {
        pipeline = pipeline.flip();
        operations.push("Flipped vertically");
      }

      // Crop to fit if requested and rotated
      if (
        options.cropToFit &&
        options.rotation !== 0 &&
        options.rotation % 90 !== 0
      ) {
        // Calculate crop area to maintain original aspect ratio
        const radians = (options.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const newWidth =
          originalDimensions.width * cos + originalDimensions.height * sin;
        const newHeight =
          originalDimensions.width * sin + originalDimensions.height * cos;

        const cropWidth = Math.min(originalDimensions.width, newWidth);
        const cropHeight = Math.min(originalDimensions.height, newHeight);

        pipeline = pipeline.resize(cropWidth, cropHeight, {
          fit: "cover",
          position: "center",
        });
        operations.push("Cropped to fit");
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
      return { buffer: processedBuffer, dimensions, operations };
    } catch (error) {
      logger.error("❌ Sharp processing failed:", error);
      throw error;
    }
  }

  private async processWithCanvas(
    imageBuffer: Buffer,
    options: RotateFlipOptions,
    originalDimensions: { width: number; height: number },
    operations: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    operations: string[];
  }> {
    try {
      const { createCanvas, loadImage } = await import("canvas");

      // Load image from buffer
      const image = await loadImage(imageBuffer);

      // Calculate canvas size for rotation
      const radians = (options.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));

      let canvasWidth =
        originalDimensions.width * cos + originalDimensions.height * sin;
      let canvasHeight =
        originalDimensions.width * sin + originalDimensions.height * cos;

      if (
        options.cropToFit &&
        options.rotation !== 0 &&
        options.rotation % 90 !== 0
      ) {
        canvasWidth = originalDimensions.width;
        canvasHeight = originalDimensions.height;
      }

      // Create canvas
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Set background color
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Apply transformations
      ctx.save();

      // Move to center for rotation
      ctx.translate(canvasWidth / 2, canvasHeight / 2);

      // Apply rotation
      if (options.rotation !== 0) {
        ctx.rotate(radians);
        operations.push(`Rotated ${options.rotation}°`);
      }

      // Apply flips
      let scaleX = 1;
      let scaleY = 1;

      if (options.flipHorizontal) {
        scaleX = -1;
        operations.push("Flipped horizontally");
      }

      if (options.flipVertical) {
        scaleY = -1;
        operations.push("Flipped vertically");
      }

      ctx.scale(scaleX, scaleY);

      // Draw image centered
      ctx.drawImage(
        image,
        -originalDimensions.width / 2,
        -originalDimensions.height / 2,
        originalDimensions.width,
        originalDimensions.height
      );

      ctx.restore();

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

      const dimensions = { width: canvasWidth, height: canvasHeight };

      logger.info("✅ Processed with Canvas API");
      return { buffer: processedBuffer, dimensions, operations };
    } catch (error) {
      logger.error("❌ Canvas processing failed:", error);
      throw error;
    }
  }

  private async combineImages(
    processedImages: Array<{
      buffer: Buffer;
      dimensions: { width: number; height: number };
      operations: string[];
    }>,
    options: RotateFlipOptions
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    logger.info(
      `🔗 Combining ${processedImages.length} images in ${options.combineMode} mode`
    );

    try {
      // Try Sharp first
      return await this.combineWithSharp(processedImages, options);
    } catch (sharpError) {
      logger.warn("⚠️ Sharp not available for combining, trying Canvas API");

      try {
        return await this.combineWithCanvas(processedImages, options);
      } catch (canvasError) {
        logger.warn("⚠️ Canvas API not available for combining");
        throw new Error(
          "Cannot combine images - no image processing library available"
        );
      }
    }
  }

  private async combineWithSharp(
    processedImages: Array<{
      buffer: Buffer;
      dimensions: { width: number; height: number };
      operations: string[];
    }>,
    options: RotateFlipOptions
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    const sharp = await import("sharp");
    const spacing = options.spacing || 0;

    let canvasWidth: number;
    let canvasHeight: number;
    let compositeOptions: any[] = [];

    switch (options.combineMode) {
      case "side-by-side":
        canvasWidth =
          processedImages.reduce((sum, img) => sum + img.dimensions.width, 0) +
          spacing * (processedImages.length - 1);
        canvasHeight = Math.max(
          ...processedImages.map((img) => img.dimensions.height)
        );

        let currentX = 0;
        processedImages.forEach((img, index) => {
          const y =
            options.alignment === "center"
              ? (canvasHeight - img.dimensions.height) / 2
              : options.alignment === "end"
              ? canvasHeight - img.dimensions.height
              : 0;

          compositeOptions.push({
            input: img.buffer,
            left: currentX,
            top: Math.round(y),
          });

          currentX += img.dimensions.width + spacing;
        });
        break;

      case "top-bottom":
        canvasWidth = Math.max(
          ...processedImages.map((img) => img.dimensions.width)
        );
        canvasHeight =
          processedImages.reduce((sum, img) => sum + img.dimensions.height, 0) +
          spacing * (processedImages.length - 1);

        let currentY = 0;
        processedImages.forEach((img, index) => {
          const x =
            options.alignment === "center"
              ? (canvasWidth - img.dimensions.width) / 2
              : options.alignment === "end"
              ? canvasWidth - img.dimensions.width
              : 0;

          compositeOptions.push({
            input: img.buffer,
            left: Math.round(x),
            top: currentY,
          });

          currentY += img.dimensions.height + spacing;
        });
        break;

      case "overlay":
        canvasWidth = Math.max(
          ...processedImages.map((img) => img.dimensions.width)
        );
        canvasHeight = Math.max(
          ...processedImages.map((img) => img.dimensions.height)
        );

        processedImages.forEach((img, index) => {
          const x =
            options.alignment === "center"
              ? (canvasWidth - img.dimensions.width) / 2
              : options.alignment === "end"
              ? canvasWidth - img.dimensions.width
              : 0;
          const y =
            options.alignment === "center"
              ? (canvasHeight - img.dimensions.height) / 2
              : options.alignment === "end"
              ? canvasHeight - img.dimensions.height
              : 0;

          compositeOptions.push({
            input: img.buffer,
            left: Math.round(x),
            top: Math.round(y),
            blend: index === 0 ? "over" : "overlay",
          });
        });
        break;

      default:
        throw new Error(`Unsupported combine mode: ${options.combineMode}`);
    }

    // Create base canvas
    const backgroundColor = options.backgroundColor || "#ffffff";
    let pipeline = sharp.default({
      create: {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight),
        channels: 4,
        background: backgroundColor,
      },
    });

    // Composite all images
    pipeline = pipeline.composite(compositeOptions);

    // Apply output format
    switch (options.outputFormat) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: options.quality || 95 });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality: options.quality || 95 });
        break;
      case "png":
      default:
        pipeline = pipeline.png();
        break;
    }

    const combinedBuffer = await pipeline.toBuffer();

    return {
      buffer: combinedBuffer,
      dimensions: {
        width: Math.round(canvasWidth),
        height: Math.round(canvasHeight),
      },
    };
  }

  private async combineWithCanvas(
    processedImages: Array<{
      buffer: Buffer;
      dimensions: { width: number; height: number };
      operations: string[];
    }>,
    options: RotateFlipOptions
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    const { createCanvas, loadImage } = await import("canvas");
    const spacing = options.spacing || 0;

    let canvasWidth: number;
    let canvasHeight: number;

    switch (options.combineMode) {
      case "side-by-side":
        canvasWidth =
          processedImages.reduce((sum, img) => sum + img.dimensions.width, 0) +
          spacing * (processedImages.length - 1);
        canvasHeight = Math.max(
          ...processedImages.map((img) => img.dimensions.height)
        );
        break;

      case "top-bottom":
        canvasWidth = Math.max(
          ...processedImages.map((img) => img.dimensions.width)
        );
        canvasHeight =
          processedImages.reduce((sum, img) => sum + img.dimensions.height, 0) +
          spacing * (processedImages.length - 1);
        break;

      case "overlay":
        canvasWidth = Math.max(
          ...processedImages.map((img) => img.dimensions.width)
        );
        canvasHeight = Math.max(
          ...processedImages.map((img) => img.dimensions.height)
        );
        break;

      default:
        throw new Error(`Unsupported combine mode: ${options.combineMode}`);
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Set background
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw images
    let currentX = 0;
    let currentY = 0;

    for (const processedImage of processedImages) {
      const image = await loadImage(processedImage.buffer);

      let x = currentX;
      let y = currentY;

      switch (options.combineMode) {
        case "side-by-side":
          y =
            options.alignment === "center"
              ? (canvasHeight - processedImage.dimensions.height) / 2
              : options.alignment === "end"
              ? canvasHeight - processedImage.dimensions.height
              : 0;
          break;

        case "top-bottom":
          x =
            options.alignment === "center"
              ? (canvasWidth - processedImage.dimensions.width) / 2
              : options.alignment === "end"
              ? canvasWidth - processedImage.dimensions.width
              : 0;
          break;

        case "overlay":
          x =
            options.alignment === "center"
              ? (canvasWidth - processedImage.dimensions.width) / 2
              : options.alignment === "end"
              ? canvasWidth - processedImage.dimensions.width
              : 0;
          y =
            options.alignment === "center"
              ? (canvasHeight - processedImage.dimensions.height) / 2
              : options.alignment === "end"
              ? canvasHeight - processedImage.dimensions.height
              : 0;
          break;
      }

      ctx.drawImage(
        image,
        x,
        y,
        processedImage.dimensions.width,
        processedImage.dimensions.height
      );

      if (options.combineMode === "side-by-side") {
        currentX += processedImage.dimensions.width + spacing;
      } else if (options.combineMode === "top-bottom") {
        currentY += processedImage.dimensions.height + spacing;
      }
    }

    // Convert to buffer
    let combinedBuffer: Buffer;

    switch (options.outputFormat) {
      case "jpg":
      case "jpeg":
        combinedBuffer = canvas.toBuffer("image/jpeg", {
          quality: (options.quality || 95) / 100,
        });
        break;
      case "webp":
        combinedBuffer = canvas.toBuffer("image/webp", {
          quality: (options.quality || 95) / 100,
        });
        break;
      case "png":
      default:
        combinedBuffer = canvas.toBuffer("image/png");
        break;
    }

    return {
      buffer: combinedBuffer,
      dimensions: { width: canvasWidth, height: canvasHeight },
    };
  }

  private async createMockProcessedImage(
    imageBuffer: Buffer,
    options: RotateFlipOptions,
    originalDimensions: { width: number; height: number },
    operations: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
    operations: string[];
  }> {
    logger.warn(
      "⚠️ Using mock processing - install Sharp or Canvas for actual processing"
    );

    // Create a simple mock by returning the original buffer
    const mockBuffer = Buffer.from(imageBuffer);
    operations.push("Mock processing applied");

    return {
      buffer: mockBuffer,
      dimensions: originalDimensions,
      operations,
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

  public validateRotateFlipOptions(options: RotateFlipOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Rotate/flip options are required" };
    }

    // Validate rotation
    if (typeof options.rotation !== "number") {
      return { isValid: false, error: "Rotation must be a number" };
    }

    if (options.rotation < -360 || options.rotation > 360) {
      return {
        isValid: false,
        error: "Rotation must be between -360 and 360 degrees",
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

    // Validate combine mode
    if (options.combineMode !== undefined) {
      const validModes = ["none", "side-by-side", "top-bottom", "overlay"];
      if (!validModes.includes(options.combineMode)) {
        return {
          isValid: false,
          error:
            "Invalid combine mode. Supported: none, side-by-side, top-bottom, overlay",
        };
      }
    }

    // Validate alignment
    if (options.alignment !== undefined) {
      const validAlignments = ["start", "center", "end"];
      if (!validAlignments.includes(options.alignment)) {
        return {
          isValid: false,
          error: "Invalid alignment. Supported: start, center, end",
        };
      }
    }

    // Validate spacing
    if (options.spacing !== undefined) {
      if (typeof options.spacing !== "number" || options.spacing < 0) {
        return {
          isValid: false,
          error: "Spacing must be a non-negative number",
        };
      }
    }

    return { isValid: true };
  }
}

export default new ImageRotateFlipService();
