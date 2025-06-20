import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import colorRestoreService from "./colorRestoreService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for color restoration
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/tiff",
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".tiff",
      ".tif",
    ];
    const fileExtension = file.originalname.toLowerCase().slice(-5);

    if (
      allowedMimes.includes(file.mimetype) ||
      allowedExtensions.some((ext) => fileExtension.includes(ext))
    ) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Only image files (JPG, PNG, WebP, GIF, TIFF) are allowed",
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

// Single image color restoration endpoint
router.post(
  "/restore-colors",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🎨 Received color restoration request for: ${file.originalname}`
    );
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse restoration options
    let restoreOptions;
    try {
      restoreOptions = JSON.parse(req.body.restoreOptions || "{}");
      logger.info(
        `🎨 Color restoration options: ${JSON.stringify(restoreOptions)}`
      );
    } catch (parseError) {
      logger.error(
        `❌ Failed to parse color restoration options: ${parseError}`
      );
      throw new AppError(
        "Invalid color restoration options format",
        400,
        "INVALID_RESTORE_OPTIONS"
      );
    }

    logger.info(
      `🎨 Starting color restoration for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Restore colors
      const result = await colorRestoreService.restoreColors(
        file.buffer,
        file.originalname,
        restoreOptions
      );

      // Determine output filename and format
      const outputFormat = restoreOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `colorized_${file.originalname.replace(
          /\.[^/.]+$/,
          `.${outputFormat}`
        )}`
      );

      // Set response headers
      const mimeTypes: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };

      res.setHeader("Content-Type", mimeTypes[outputFormat] || "image/jpeg");
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
      res.setHeader("X-Enhancements", result.enhancements.join(", "));
      res.setHeader("X-Restoration-Score", result.restorationScore.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Color restoration completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🎨 Applied techniques: ${result.enhancements.join(", ")}`);
    } catch (processingError) {
      logger.error(`❌ Color restoration failed: ${processingError}`);
      throw new AppError(
        `Color restoration failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "COLOR_RESTORATION_ERROR"
      );
    }
  })
);

// Health check endpoint for color restoration tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-color-restore",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Faded color restoration",
        "Color balance correction",
        "Vibrancy enhancement",
        "Yellowing removal",
        "Color cast correction",
        "Vintage photo restoration",
        "Multiple restoration modes",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
