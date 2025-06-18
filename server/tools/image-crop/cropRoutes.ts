import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment.js";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils.js";
import { logger } from "../../utils/logger.js";
import cropService from "./cropService.js";
import { asyncHandler, AppError } from "../../middleware/errorHandler.js";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for cropping
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

// Single image crop endpoint
router.post(
  "/crop-image",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🖼️ Received crop request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse crop options
    let cropOptions;
    try {
      cropOptions = JSON.parse(req.body.cropOptions || "{}");
      logger.info(`✂️ Crop options: ${JSON.stringify(cropOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse crop options: ${parseError}`);
      throw new AppError(
        "Invalid crop options format",
        400,
        "INVALID_CROP_OPTIONS"
      );
    }

    // Validate crop options
    const validation2 = cropService.validateCropOptions(
      cropOptions,
      1920,
      1080
    ); // Mock dimensions for now
    if (!validation2.isValid) {
      logger.error(`❌ Crop options validation failed: ${validation2.error}`);
      throw new AppError(validation2.error!, 400, "INVALID_CROP_PARAMETERS");
    }

    logger.info(
      `🖼️ Starting crop for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Crop the image
      const result = await cropService.cropImage(
        file.buffer,
        file.originalname,
        cropOptions
      );

      // Determine output filename and format
      const outputFormat = cropOptions.outputFormat || "png";
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
        "X-Cropped-Dimensions",
        `${result.croppedDimensions.width}x${result.croppedDimensions.height}`
      );

      // Send the cropped image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Image crop completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
    } catch (cropError) {
      logger.error(`❌ Crop processing failed: ${cropError}`);
      throw new AppError(
        `Crop processing failed: ${
          cropError instanceof Error ? cropError.message : "Unknown error"
        }`,
        500,
        "CROP_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for image tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-crop",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Image cropping",
        "Multiple output formats",
        "Aspect ratio preservation",
        "Quality control",
      ],
    });
  })
);

export default router;
