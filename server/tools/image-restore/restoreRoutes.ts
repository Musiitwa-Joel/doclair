import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import restoreService from "./restoreService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for restoration
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

// Single image restoration endpoint
router.post(
  "/restore-photo",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🖼️ Received photo restoration request for: ${file.originalname}`
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
      logger.info(`🔧 Restoration options: ${JSON.stringify(restoreOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse restoration options: ${parseError}`);
      throw new AppError(
        "Invalid restoration options format",
        400,
        "INVALID_RESTORE_OPTIONS"
      );
    }

    logger.info(
      `🖼️ Starting photo restoration for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Restore the photo
      const result = await restoreService.restorePhoto(
        file.buffer,
        file.originalname,
        restoreOptions
      );

      // Determine output filename and format
      const outputFormat = restoreOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `restored_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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

      // Send the restored image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Photo restoration completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🖼️ Applied enhancements: ${result.enhancements.join(", ")}`);
    } catch (processingError) {
      logger.error(`❌ Photo restoration failed: ${processingError}`);
      throw new AppError(
        `Photo restoration failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "PHOTO_RESTORATION_ERROR"
      );
    }
  })
);

// Health check endpoint for restoration tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-restore",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Old photo restoration",
        "Black & white colorization",
        "Scratch and damage repair",
        "Detail enhancement",
        "Noise reduction",
        "Contrast improvement",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
