import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import unblurService from "./unblurService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for unblurring
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

// Single image unblur endpoint
router.post(
  "/unblur-image",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🔍 Received unblur request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse unblur options
    let unblurOptions;
    try {
      unblurOptions = JSON.parse(req.body.unblurOptions || "{}");
      logger.info(`🔍 Unblur options: ${JSON.stringify(unblurOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse unblur options: ${parseError}`);
      throw new AppError(
        "Invalid unblur options format",
        400,
        "INVALID_UNBLUR_OPTIONS"
      );
    }

    logger.info(
      `🔍 Starting unblur processing for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Unblur the image
      const result = await unblurService.unblurImage(
        file.buffer,
        file.originalname,
        unblurOptions
      );

      // Determine output filename and format
      const outputFormat = unblurOptions.outputFormat || "png";
      const sanitizedFilename = sanitizeFilename(
        `unblurred_${file.originalname.replace(
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
      res.setHeader("X-Clarity-Score", result.clarityScore.toString());

      // Send the unblurred image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Unblur processing completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🔍 Applied techniques: ${result.enhancements.join(", ")}`);
    } catch (processingError) {
      logger.error(`❌ Unblur processing failed: ${processingError}`);
      throw new AppError(
        `Unblur processing failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "UNBLUR_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for unblur tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-unblur",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Deconvolution algorithms",
        "Motion blur correction",
        "Gaussian blur removal",
        "Focus enhancement",
        "Detail recovery",
        "Edge sharpening",
        "Noise suppression",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
