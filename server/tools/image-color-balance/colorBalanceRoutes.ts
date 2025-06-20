import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import colorBalanceService from "./colorBalanceService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for color balance
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const fileExtension = file.originalname.toLowerCase().slice(-5);

    if (
      allowedMimes.includes(file.mimetype) ||
      allowedExtensions.some((ext) => fileExtension.includes(ext))
    ) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Only image files (JPG, PNG, WebP, GIF) are allowed",
          400,
          "INVALID_FILE_TYPE"
        )
      );
    }
  },
});

// Custom validation middleware for image files
const validateImageUpload = (req: any, res: any, next: any) => {
  if (!req.file) {
    throw new AppError("No image file uploaded", 400, "NO_FILE");
  }

  next();
};

// Single image color balance endpoint
router.post(
  "/color-balance",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🎨 Received color balance request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse color balance options
    let colorBalanceOptions;
    try {
      colorBalanceOptions = JSON.parse(req.body.colorBalanceOptions || "{}");
      logger.info(
        `🎨 Color balance options: ${JSON.stringify(colorBalanceOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse color balance options: ${parseError}`);
      throw new AppError(
        "Invalid color balance options format",
        400,
        "INVALID_COLOR_BALANCE_OPTIONS"
      );
    }

    logger.info(
      `🎨 Starting color balance for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Process the image
      const result = await colorBalanceService.processColorBalance(
        file.buffer,
        file.originalname,
        colorBalanceOptions
      );

      // Determine output filename and format
      const outputFormat = colorBalanceOptions.outputFormat || "png";
      const sanitizedFilename = sanitizeFilename(
        file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)
      );

      // Set response headers
      const mimeTypes: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };

      res.setHeader("Content-Type", mimeTypes[outputFormat] || "image/png");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${sanitizedFilename}"`
      );
      res.setHeader("Content-Length", result.buffer.length.toString());
      res.setHeader("X-Processing-Time", result.processingTime.toString());
      res.setHeader(
        "X-Original-Dimensions",
        `${result.originalDimensions.width}x${result.originalDimensions.height}`
      );
      res.setHeader(
        "X-Processed-Dimensions",
        `${result.processedDimensions.width}x${result.processedDimensions.height}`
      );
      res.setHeader("X-Adjustments", result.adjustments.join(", "));

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Color balance completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🎨 Applied adjustments: ${result.adjustments.join(", ")}`);
    } catch (processingError) {
      logger.error(`❌ Color balance processing failed: ${processingError}`);
      throw new AppError(
        `Color balance processing failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "COLOR_BALANCE_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for color balance tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-color-balance",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Color temperature adjustment",
        "Tint control (green/magenta)",
        "Saturation and vibrance",
        "Hue shifting",
        "RGB channel balance",
        "Tone-based color grading",
        "Auto white balance",
        "Auto color correction",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
