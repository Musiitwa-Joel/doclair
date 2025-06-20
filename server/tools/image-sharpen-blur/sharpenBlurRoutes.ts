import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import sharpenBlurService from "./sharpenBlurService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for sharpen/blur
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

// Single image sharpen/blur endpoint
router.post(
  "/sharpen-blur",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🔍 Received sharpen/blur request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse sharpen/blur options
    let sharpenBlurOptions;
    try {
      sharpenBlurOptions = JSON.parse(req.body.sharpenBlurOptions || "{}");
      logger.info(
        `🔍 Sharpen/blur options: ${JSON.stringify(sharpenBlurOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse sharpen/blur options: ${parseError}`);
      throw new AppError(
        "Invalid sharpen/blur options format",
        400,
        "INVALID_SHARPEN_BLUR_OPTIONS"
      );
    }

    logger.info(
      `🔍 Starting sharpen/blur processing for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Process the image
      const result = await sharpenBlurService.processSharpenBlur(
        file.buffer,
        file.originalname,
        sharpenBlurOptions
      );

      // Determine output filename and format
      const outputFormat = sharpenBlurOptions.outputFormat || "png";
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
        `✅ Sharpen/blur processing completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🔍 Applied effects: ${result.adjustments.join(", ")}`);
    } catch (processingError) {
      logger.error(`❌ Sharpen/blur processing failed: ${processingError}`);
      throw new AppError(
        `Sharpen/blur processing failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "SHARPEN_BLUR_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for sharpen/blur tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-sharpen-blur",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Precision sharpening (0-100)",
        "Unsharp mask technique",
        "Gaussian blur",
        "Motion blur with angle control",
        "Radial blur effects",
        "Surface blur smoothing",
        "Edge enhancement",
        "Noise reduction",
        "Smart sharpening",
        "Detail preservation",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
