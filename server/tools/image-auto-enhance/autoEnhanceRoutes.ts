import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment.js";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils.js";
import { logger } from "../../utils/logger.js";
import autoEnhanceService from "./autoEnhanceService.js";
import { asyncHandler, AppError } from "../../middleware/errorHandler.js";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for auto enhancement
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

// Single image auto enhancement endpoint
router.post(
  "/auto-enhance",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🎨 Received auto enhance request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse enhancement options
    let enhanceOptions;
    try {
      enhanceOptions = JSON.parse(req.body.enhanceOptions || "{}");
      logger.info(`🎨 Enhancement options: ${JSON.stringify(enhanceOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse enhancement options: ${parseError}`);
      throw new AppError(
        "Invalid enhancement options format",
        400,
        "INVALID_ENHANCE_OPTIONS"
      );
    }

    logger.info(
      `🎨 Starting auto enhancement for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Enhance the image
      const result = await autoEnhanceService.enhanceImage(
        file.buffer,
        file.originalname,
        enhanceOptions
      );

      // Determine output filename and format
      const outputFormat = enhanceOptions.outputFormat || "png";
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
      res.setHeader("X-Enhancements", result.enhancements.join(", "));
      res.setHeader("X-Quality-Score", result.qualityScore.toString());

      // Send the enhanced image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Auto enhancement completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🎨 Applied enhancements: ${result.enhancements.join(", ")}`);
    } catch (enhancementError) {
      logger.error(`❌ Auto enhancement failed: ${enhancementError}`);
      throw new AppError(
        `Auto enhancement failed: ${
          enhancementError instanceof Error
            ? enhancementError.message
            : "Unknown error"
        }`,
        500,
        "AUTO_ENHANCE_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for auto enhance tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-auto-enhance",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "One-click auto enhancement",
        "AI-powered image analysis",
        "Multiple enhancement modes",
        "Portrait optimization",
        "Landscape enhancement",
        "Low-light improvement",
        "Vintage effects",
        "Vivid color enhancement",
        "Noise reduction",
        "Detail sharpening",
        "Shadow/highlight recovery",
        "Clarity improvement",
        "Color preservation",
        "Quality scoring",
        "Multiple output formats",
      ],
    });
  })
);

export default router;
