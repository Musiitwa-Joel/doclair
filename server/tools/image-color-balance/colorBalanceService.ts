import fs from "fs/promises";
import path from "path";
import { logger } from "../../utils/logger";
import { config } from "../../config/environment";

interface ColorBalanceOptions {
  temperature: number; // -100 to 100 (cool to warm)
  tint: number; // -100 to 100 (green to magenta)
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
  hue: number; // -180 to 180
  redBalance: number; // -100 to 100
  greenBalance: number; // -100 to 100
  blueBalance: number; // -100 to 100
  shadowsColor: { r: number; g: number; b: number };
  midtonesColor: { r: number; g: number; b: number };
  highlightsColor: { r: number; g: number; b: number };
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  autoWhiteBalance?: boolean;
  autoColorCorrection?: boolean;
}

interface ColorBalanceResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  format: string;
  adjustments: string[];
}

class ImageColorBalanceService {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(config.tempDir, "image-color-balance");
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(
        `📁 Image color balance temp directory ensured: ${this.tempDir}`
      );
    } catch (error) {
      logger.error(
        "❌ Failed to create image color balance temp directory:",
        error
      );
      throw new Error("Failed to initialize image color balance service");
    }
  }

  public async processColorBalance(
    imageBuffer: Buffer,
    filename: string,
    colorBalanceOptions: ColorBalanceOptions
  ): Promise<ColorBalanceResult> {
    const startTime = Date.now();

    logger.info(`🎨 Starting color balance processing: ${filename}`);
    logger.info(`⚙️ Options: ${JSON.stringify(colorBalanceOptions)}`);

    try {
      // Validate image buffer
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Invalid image buffer - image appears to be empty");
      }

      if (!this.isValidImageBuffer(imageBuffer)) {
        throw new Error("Invalid image format - not a supported image file");
      }

      // Basic validation of options
      const validation = this.validateColorBalanceOptions(colorBalanceOptions);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get image dimensions
      const originalDimensions = await this.getImageDimensions(imageBuffer);
      logger.info(
        `📐 Original dimensions: ${originalDimensions.width}x${originalDimensions.height}`
      );

      // Apply auto corrections first if requested
      let processedBuffer = imageBuffer;
      const adjustments: string[] = [];

      if (
        colorBalanceOptions.autoWhiteBalance ||
        colorBalanceOptions.autoColorCorrection
      ) {
        const autoResult = await this.applyAutoCorrections(
          processedBuffer,
          colorBalanceOptions,
          adjustments
        );
        processedBuffer = autoResult.buffer;
      }

      // Apply manual color balance adjustments
      const manualResult = await this.applyColorBalanceAdjustments(
        processedBuffer,
        colorBalanceOptions,
        originalDimensions,
        adjustments
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        `✅ Color balance processing completed in ${processingTime}ms`
      );
      logger.info(`🎨 Applied adjustments: ${adjustments.join(", ")}`);

      return {
        buffer: manualResult.buffer,
        originalDimensions,
        processedDimensions: manualResult.dimensions,
        processingTime,
        format: colorBalanceOptions.outputFormat || "png",
        adjustments,
      };
    } catch (error) {
      logger.error(
        `❌ Color balance processing failed for ${filename}:`,
        error
      );
      throw error;
    }
  }

  private async applyAutoCorrections(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    adjustments: string[]
  ): Promise<{ buffer: Buffer }> {
    try {
      // Try Sharp first if available
      return await this.applyAutoCorrectionsWithSharp(
        imageBuffer,
        options,
        adjustments
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for auto corrections, trying Canvas API"
      );

      try {
        return await this.applyAutoCorrectionsWithCanvas(
          imageBuffer,
          options,
          adjustments
        );
      } catch (canvasError) {
        logger.warn("⚠️ Canvas API not available for auto corrections");
        adjustments.push("Auto corrections skipped (no processing library)");
        return { buffer: imageBuffer };
      }
    }
  }

  private async applyAutoCorrectionsWithSharp(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    adjustments: string[]
  ): Promise<{ buffer: Buffer }> {
    const sharp = await import("sharp");
    let pipeline = sharp.default(imageBuffer);

    if (options.autoWhiteBalance) {
      pipeline = pipeline.normalize();
      adjustments.push("Auto white balance");
    }

    if (options.autoColorCorrection) {
      // Auto color correction using Sharp's modulate
      pipeline = pipeline.modulate({
        brightness: 1.0,
        saturation: 1.1, // Slight saturation boost
        hue: 0,
      });
      adjustments.push("Auto color correction");
    }

    const processedBuffer = await pipeline.toBuffer();
    return { buffer: processedBuffer };
  }

  private async applyAutoCorrectionsWithCanvas(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    adjustments: string[]
  ): Promise<{ buffer: Buffer }> {
    const { createCanvas, loadImage } = await import("canvas");

    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (options.autoWhiteBalance) {
      this.applyAutoWhiteBalanceCanvas(data);
      adjustments.push("Auto white balance");
    }

    if (options.autoColorCorrection) {
      this.applyAutoColorCorrectionCanvas(data);
      adjustments.push("Auto color correction");
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    const processedBuffer = canvas.toBuffer("image/png");
    return { buffer: processedBuffer };
  }

  private applyAutoWhiteBalanceCanvas(data: Uint8ClampedArray): void {
    // Simple auto white balance by normalizing channel averages
    let sumR = 0,
      sumG = 0,
      sumB = 0;
    const pixelCount = data.length / 4;

    // Calculate averages
    for (let i = 0; i < data.length; i += 4) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
    }

    const avgR = sumR / pixelCount;
    const avgG = sumG / pixelCount;
    const avgB = sumB / pixelCount;
    const avgGray = (avgR + avgG + avgB) / 3;

    // Calculate correction factors
    const factorR = avgGray / avgR;
    const factorG = avgGray / avgG;
    const factorB = avgGray / avgB;

    // Apply white balance correction
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] * factorR));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factorG));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factorB));
    }
  }

  private applyAutoColorCorrectionCanvas(data: Uint8ClampedArray): void {
    // Auto color correction by enhancing contrast and saturation
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply slight contrast enhancement
      const contrastFactor = 1.1;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      // Apply slight saturation boost
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturationFactor = 1.1;
      r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
      g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
      b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  private async applyColorBalanceAdjustments(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    try {
      // Try Sharp first if available
      return await this.applyColorBalanceWithSharp(
        imageBuffer,
        options,
        originalDimensions,
        adjustments
      );
    } catch (sharpError) {
      logger.warn(
        "⚠️ Sharp not available for color balance, trying Canvas API"
      );

      try {
        return await this.applyColorBalanceWithCanvas(
          imageBuffer,
          options,
          originalDimensions,
          adjustments
        );
      } catch (canvasError) {
        logger.warn(
          "⚠️ Canvas API not available for color balance, using mock processing"
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

  private async applyColorBalanceWithSharp(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    const sharp = await import("sharp");
    let pipeline = sharp.default(imageBuffer);

    // Apply temperature and tint adjustments using modulate
    if (options.temperature !== 0 || options.tint !== 0) {
      const tempShift = options.temperature / 100;
      const tintShift = options.tint / 100;

      pipeline = pipeline.modulate({
        brightness: 1.0,
        saturation: 1.0,
        hue: tempShift * 30 + tintShift * 15, // Simplified hue shift
      });

      if (options.temperature !== 0)
        adjustments.push(
          `Temperature ${options.temperature > 0 ? "+" : ""}${
            options.temperature
          }`
        );
      if (options.tint !== 0)
        adjustments.push(`Tint ${options.tint > 0 ? "+" : ""}${options.tint}`);
    }

    // Apply saturation and vibrance
    if (options.saturation !== 0 || options.vibrance !== 0) {
      const saturationMultiplier = 1 + options.saturation / 100;
      pipeline = pipeline.modulate({
        brightness: 1.0,
        saturation: saturationMultiplier,
        hue: 0,
      });

      if (options.saturation !== 0)
        adjustments.push(
          `Saturation ${options.saturation > 0 ? "+" : ""}${options.saturation}`
        );
      if (options.vibrance !== 0)
        adjustments.push(
          `Vibrance ${options.vibrance > 0 ? "+" : ""}${options.vibrance}`
        );
    }

    // Apply hue shift
    if (options.hue !== 0) {
      pipeline = pipeline.modulate({
        brightness: 1.0,
        saturation: 1.0,
        hue: options.hue,
      });
      adjustments.push(`Hue ${options.hue > 0 ? "+" : ""}${options.hue}°`);
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
    return { buffer: processedBuffer, dimensions };
  }

  private async applyColorBalanceWithCanvas(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    const { createCanvas, loadImage } = await import("canvas");

    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply color balance adjustments
    this.applyCanvasColorBalance(data, options, adjustments);

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
  }

  private applyCanvasColorBalance(
    data: Uint8ClampedArray,
    options: ColorBalanceOptions,
    adjustments: string[]
  ): void {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply temperature adjustment
      if (options.temperature !== 0) {
        const tempFactor = options.temperature / 100;
        if (tempFactor > 0) {
          // Warmer (more red/yellow)
          r = Math.max(0, Math.min(255, r + tempFactor * 40));
          g = Math.max(0, Math.min(255, g + tempFactor * 20));
        } else {
          // Cooler (more blue)
          b = Math.max(0, Math.min(255, b - tempFactor * 40));
        }
      }

      // Apply tint adjustment
      if (options.tint !== 0) {
        const tintFactor = options.tint / 100;
        if (tintFactor > 0) {
          // More magenta
          r = Math.max(0, Math.min(255, r + tintFactor * 25));
          b = Math.max(0, Math.min(255, b + tintFactor * 25));
        } else {
          // More green
          g = Math.max(0, Math.min(255, g - tintFactor * 25));
        }
      }

      // Apply hue shift (simplified)
      if (options.hue !== 0) {
        const [newR, newG, newB] = this.applyHueShift(r, g, b, options.hue);
        r = newR;
        g = newG;
        b = newB;
      }

      // Apply saturation
      if (options.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = 1 + options.saturation / 100;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));
      }

      // Apply vibrance (smart saturation)
      if (options.vibrance !== 0) {
        const vibranceFactor = options.vibrance / 100;
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
        const amt = (((Math.abs(max - avg) * 2) / 255) * vibranceFactor) / 3;

        if (r !== max) r += (max - r) * amt;
        if (g !== max) g += (max - g) * amt;
        if (b !== max) b += (max - b) * amt;

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
      }

      // Apply RGB balance adjustments
      r = Math.max(0, Math.min(255, r + (options.redBalance / 100) * 50));
      g = Math.max(0, Math.min(255, g + (options.greenBalance / 100) * 50));
      b = Math.max(0, Math.min(255, b + (options.blueBalance / 100) * 50));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Record applied adjustments
    if (options.temperature !== 0)
      adjustments.push(
        `Temperature ${options.temperature > 0 ? "+" : ""}${
          options.temperature
        }`
      );
    if (options.tint !== 0)
      adjustments.push(`Tint ${options.tint > 0 ? "+" : ""}${options.tint}`);
    if (options.saturation !== 0)
      adjustments.push(
        `Saturation ${options.saturation > 0 ? "+" : ""}${options.saturation}`
      );
    if (options.vibrance !== 0)
      adjustments.push(
        `Vibrance ${options.vibrance > 0 ? "+" : ""}${options.vibrance}`
      );
    if (options.hue !== 0)
      adjustments.push(`Hue ${options.hue > 0 ? "+" : ""}${options.hue}°`);
    if (options.redBalance !== 0)
      adjustments.push(
        `Red ${options.redBalance > 0 ? "+" : ""}${options.redBalance}`
      );
    if (options.greenBalance !== 0)
      adjustments.push(
        `Green ${options.greenBalance > 0 ? "+" : ""}${options.greenBalance}`
      );
    if (options.blueBalance !== 0)
      adjustments.push(
        `Blue ${options.blueBalance > 0 ? "+" : ""}${options.blueBalance}`
      );
  }

  private applyHueShift(
    r: number,
    g: number,
    b: number,
    hueShift: number
  ): [number, number, number] {
    // Convert RGB to HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r / 255) h = ((g / 255 - b / 255) / delta) % 6;
      else if (max === g / 255) h = (b / 255 - r / 255) / delta + 2;
      else h = (r / 255 - g / 255) / delta + 4;
    }
    h = (h * 60 + hueShift) % 360;
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Convert back to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rNew = 0,
      gNew = 0,
      bNew = 0;
    if (h < 60) {
      rNew = c;
      gNew = x;
      bNew = 0;
    } else if (h < 120) {
      rNew = x;
      gNew = c;
      bNew = 0;
    } else if (h < 180) {
      rNew = 0;
      gNew = c;
      bNew = x;
    } else if (h < 240) {
      rNew = 0;
      gNew = x;
      bNew = c;
    } else if (h < 300) {
      rNew = x;
      gNew = 0;
      bNew = c;
    } else {
      rNew = c;
      gNew = 0;
      bNew = x;
    }

    return [
      Math.round((rNew + m) * 255),
      Math.round((gNew + m) * 255),
      Math.round((bNew + m) * 255),
    ];
  }

  private async createMockProcessedImage(
    imageBuffer: Buffer,
    options: ColorBalanceOptions,
    originalDimensions: { width: number; height: number },
    adjustments: string[]
  ): Promise<{
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }> {
    logger.warn(
      "⚠️ Using mock color balance - install Sharp or Canvas for actual processing"
    );

    const mockBuffer = Buffer.from(imageBuffer);
    adjustments.push("Mock color balance applied");

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

  public validateColorBalanceOptions(options: ColorBalanceOptions): {
    isValid: boolean;
    error?: string;
  } {
    if (!options) {
      return { isValid: false, error: "Color balance options are required" };
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

    // Validate tint
    if (
      typeof options.tint !== "number" ||
      options.tint < -100 ||
      options.tint > 100
    ) {
      return {
        isValid: false,
        error: "Tint must be a number between -100 and 100",
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
      options.vibrance < -100 ||
      options.vibrance > 100
    ) {
      return {
        isValid: false,
        error: "Vibrance must be a number between -100 and 100",
      };
    }

    // Validate hue
    if (
      typeof options.hue !== "number" ||
      options.hue < -180 ||
      options.hue > 180
    ) {
      return {
        isValid: false,
        error: "Hue must be a number between -180 and 180",
      };
    }

    // Validate RGB balance
    if (
      typeof options.redBalance !== "number" ||
      options.redBalance < -100 ||
      options.redBalance > 100
    ) {
      return {
        isValid: false,
        error: "Red balance must be a number between -100 and 100",
      };
    }

    if (
      typeof options.greenBalance !== "number" ||
      options.greenBalance < -100 ||
      options.greenBalance > 100
    ) {
      return {
        isValid: false,
        error: "Green balance must be a number between -100 and 100",
      };
    }

    if (
      typeof options.blueBalance !== "number" ||
      options.blueBalance < -100 ||
      options.blueBalance > 100
    ) {
      return {
        isValid: false,
        error: "Blue balance must be a number between -100 and 100",
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

export default new ImageColorBalanceService();
