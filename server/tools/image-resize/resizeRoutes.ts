import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import resizeService from "./resizeService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for resizing
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

// Single image resize endpoint
router.post(
  "/resize-image",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🖼️ Received resize request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse resize options
    let resizeOptions;
    try {
      resizeOptions = JSON.parse(req.body.resizeOptions || "{}");
      logger.info(`📏 Resize options: ${JSON.stringify(resizeOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse resize options: ${parseError}`);
      throw new AppError(
        "Invalid resize options format",
        400,
        "INVALID_RESIZE_OPTIONS"
      );
    }

    // NOTE: Validation now happens inside resizeService.resizeImage()
    // after extracting actual image dimensions

    logger.info(
      `🖼️ Starting resize for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Resize the image (validation happens inside this method)
      const result = await resizeService.resizeImage(
        file.buffer,
        file.originalname,
        resizeOptions
      );

      // Determine output filename and format
      const outputFormat = resizeOptions.outputFormat || "png";
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
        "X-Resized-Dimensions",
        `${result.resizedDimensions.width}x${result.resizedDimensions.height}`
      );
      res.setHeader("X-Compression-Ratio", result.compressionRatio.toString());
      res.setHeader("X-AI-Upscaled", result.aiUpscaled.toString());

      // Send the resized image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Image resize completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `📊 Dimensions: ${result.originalDimensions.width}x${result.originalDimensions.height} → ${result.resizedDimensions.width}x${result.resizedDimensions.height}`
      );
      logger.info(
        `🗜️ Compression: ${result.compressionRatio.toFixed(2)}x, AI Upscaled: ${
          result.aiUpscaled
        }`
      );
    } catch (resizeError) {
      logger.error(`❌ Resize processing failed: ${resizeError}`);
      throw new AppError(
        `Resize processing failed: ${
          resizeError instanceof Error ? resizeError.message : "Unknown error"
        }`,
        500,
        "RESIZE_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for image resize tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-resize",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Image resizing",
        "AI upscaling",
        "Multiple output formats",
        "Aspect ratio preservation",
        "Quality control",
        "Batch processing ready",
      ],
    });
  })
);

export default router;
