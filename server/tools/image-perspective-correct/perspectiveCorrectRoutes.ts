import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import perspectiveCorrectService from "./perspectiveCorrectService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for perspective correction
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

// Single image perspective correction endpoint
router.post(
  "/perspective-correct",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `📐 Received perspective correction request for: ${file.originalname}`
    );
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse correction options
    let correctionOptions;
    try {
      correctionOptions = JSON.parse(req.body.correctionOptions || "{}");
      logger.info(
        `📐 Correction options: ${JSON.stringify(correctionOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse correction options: ${parseError}`);
      throw new AppError(
        "Invalid correction options format",
        400,
        "INVALID_CORRECTION_OPTIONS"
      );
    }

    logger.info(
      `📐 Starting perspective correction for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Correct the image
      const result = await perspectiveCorrectService.correctPerspective(
        file.buffer,
        file.originalname,
        correctionOptions
      );

      // Determine output filename and format
      const outputFormat = correctionOptions.outputFormat || "png";
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
        "X-Corrected-Dimensions",
        `${result.correctedDimensions.width}x${result.correctedDimensions.height}`
      );
      res.setHeader("X-Correction-Angle", result.correctionAngle.toString());
      res.setHeader(
        "X-Keystone-Correction",
        result.keystoneCorrection.toString()
      );

      // Send the corrected image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Perspective correction completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `📊 Dimensions: ${result.originalDimensions.width}x${result.originalDimensions.height} → ${result.correctedDimensions.width}x${result.correctedDimensions.height}`
      );
      logger.info(
        `📐 Correction: Angle=${result.correctionAngle.toFixed(
          2
        )}°, Keystone=${result.keystoneCorrection.toFixed(2)}`
      );
    } catch (processingError) {
      logger.error(`❌ Perspective correction failed: ${processingError}`);
      throw new AppError(
        `Perspective correction failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "PERSPECTIVE_CORRECTION_ERROR"
      );
    }
  })
);

// Health check endpoint for perspective correction tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-perspective-correct",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Perspective distortion correction",
        "Keystone effect removal",
        "Document scan optimization",
        "Building/architecture correction",
        "Whiteboard image enhancement",
        "Manual corner control",
        "Auto corner detection",
        "Grid overlay for alignment",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
