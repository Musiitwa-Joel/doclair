import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import artisticFiltersService from "./artisticFiltersService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for artistic filter
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

// Single image artistic filter endpoint
router.post(
  "/artistic-filter",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🎨 Received artistic filter request for: ${file.originalname}`
    );
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse filter options
    let filterOptions;
    try {
      filterOptions = JSON.parse(req.body.filterOptions || "{}");
      logger.info(`🎨 Filter options: ${JSON.stringify(filterOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse filter options: ${parseError}`);
      throw new AppError(
        "Invalid filter options format",
        400,
        "INVALID_FILTER_OPTIONS"
      );
    }

    logger.info(
      `🎨 Starting artistic filter for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Apply artistic filter
      const result = await artisticFiltersService.applyArtisticFilter(
        file.buffer,
        file.originalname,
        filterOptions
      );

      // Determine output filename and format
      const outputFormat = filterOptions.outputFormat || "png";
      const sanitizedFilename = sanitizeFilename(
        `${filterOptions.filterType}_${file.originalname.replace(
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
      res.setHeader("X-Filter-Applied", result.filterApplied);
      res.setHeader("X-Effect-Intensity", result.effectIntensity.toString());
      res.setHeader("X-Artistic-Score", result.artisticScore.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Artistic filter completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `🎨 Applied filter: ${result.filterApplied} with intensity ${result.effectIntensity}`
      );
    } catch (processingError) {
      logger.error(`❌ Artistic filter failed: ${processingError}`);
      throw new AppError(
        `Artistic filter failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "ARTISTIC_FILTER_ERROR"
      );
    }
  })
);

// Health check endpoint for artistic filters tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-artistic-filters",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Oil painting effect",
        "Watercolor effect",
        "Sketch effect",
        "Comic style",
        "Pointillism",
        "Impressionist style",
        "Custom intensity control",
        "Detail preservation",
        "Multiple output formats",
        "Quality control",
        "Border and frame options",
        "Background texture options",
      ],
    });
  })
);

export default router;
