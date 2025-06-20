import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import brightnessContrastService from "./brightnessContrastService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for brightness/contrast adjustment
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

// Single image brightness/contrast adjustment endpoint
router.post(
  "/brightness-contrast",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🌟 Received brightness/contrast request for: ${file.originalname}`
    );
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse adjustment options
    let adjustmentOptions;
    try {
      adjustmentOptions = JSON.parse(req.body.adjustmentOptions || "{}");
      logger.info(
        `🎨 Adjustment options: ${JSON.stringify(adjustmentOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse adjustment options: ${parseError}`);
      throw new AppError(
        "Invalid adjustment options format",
        400,
        "INVALID_ADJUSTMENT_OPTIONS"
      );
    }

    logger.info(
      `🌟 Starting brightness/contrast adjustment for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Adjust the image
      const result = await brightnessContrastService.adjustImage(
        file.buffer,
        file.originalname,
        adjustmentOptions
      );

      // Determine output filename and format
      const outputFormat = adjustmentOptions.outputFormat || "png";
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

      // Send the adjusted image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Brightness/contrast adjustment completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(`🎨 Applied adjustments: ${result.adjustments.join(", ")}`);
    } catch (adjustmentError) {
      logger.error(
        `❌ Brightness/contrast adjustment failed: ${adjustmentError}`
      );
      throw new AppError(
        `Brightness/contrast adjustment failed: ${
          adjustmentError instanceof Error
            ? adjustmentError.message
            : "Unknown error"
        }`,
        500,
        "BRIGHTNESS_CONTRAST_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for brightness/contrast tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-brightness-contrast",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Brightness adjustment (-100 to +100)",
        "Contrast adjustment (-100 to +100)",
        "Exposure control (-2 to +2 EV)",
        "Highlights and shadows",
        "Gamma correction (0.1 to 3.0)",
        "Saturation and vibrance",
        "Color temperature and tint",
        "Auto levels, contrast, and color",
        "Real-time histogram",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
