import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import backgroundRemoveService from "./backgroundRemoveService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for background removal
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

// Single image background removal endpoint
router.post(
  "/remove-background",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🖼️ Received background removal request for: ${file.originalname}`
    );
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse removal options
    let removalOptions;
    try {
      removalOptions = JSON.parse(req.body.removalOptions || "{}");
      logger.info(`🔧 Removal options: ${JSON.stringify(removalOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse removal options: ${parseError}`);
      throw new AppError(
        "Invalid removal options format",
        400,
        "INVALID_REMOVAL_OPTIONS"
      );
    }

    logger.info(
      `🖼️ Starting background removal for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Remove background
      const result = await backgroundRemoveService.removeBackground(
        file.buffer,
        file.originalname,
        removalOptions
      );

      // Determine output filename and format
      const outputFormat = removalOptions.outputFormat || "png";
      const sanitizedFilename = sanitizeFilename(
        `nobg_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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
      res.setHeader(
        "X-Transparency-Score",
        result.transparencyScore.toString()
      );
      res.setHeader("X-Edge-Quality-Score", result.edgeQualityScore.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Background removal completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `📊 Dimensions: ${result.originalDimensions.width}x${result.originalDimensions.height}`
      );
      logger.info(
        `🔍 Quality: Transparency=${result.transparencyScore.toFixed(
          1
        )}, Edges=${result.edgeQualityScore.toFixed(1)}`
      );
    } catch (processingError) {
      logger.error(`❌ Background removal failed: ${processingError}`);
      throw new AppError(
        `Background removal failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "BACKGROUND_REMOVAL_ERROR"
      );
    }
  })
);

// Health check endpoint for background removal tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-background-remove",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "AI-powered background removal",
        "Edge refinement technology",
        "Hair and fine detail preservation",
        "Transparent background output",
        "Custom background colors",
        "Multiple output formats",
        "Quality control",
        "Live preview",
      ],
    });
  })
);

export default router;
