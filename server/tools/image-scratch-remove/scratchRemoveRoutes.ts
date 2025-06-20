import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import scratchRemoveService from "./scratchRemoveService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for scratch removal
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

// Single image scratch removal endpoint
router.post(
  "/remove-scratches",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(
      `🖼️ Received scratch removal request for: ${file.originalname}`
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
      logger.info(
        `🔧 Scratch removal options: ${JSON.stringify(removalOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse scratch removal options: ${parseError}`);
      throw new AppError(
        "Invalid scratch removal options format",
        400,
        "INVALID_REMOVAL_OPTIONS"
      );
    }

    logger.info(
      `🖼️ Starting scratch removal for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Remove scratches
      const result = await scratchRemoveService.removeScratches(
        file.buffer,
        file.originalname,
        removalOptions
      );

      // Determine output filename and format
      const outputFormat = removalOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `fixed_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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
      res.setHeader("X-Scratch-Count", result.scratchCount.toString());
      res.setHeader("X-Repair-Score", result.repairScore.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Scratch removal completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `🖼️ Removed ${
          result.scratchCount
        } scratches with repair score ${result.repairScore.toFixed(1)}/10`
      );
    } catch (processingError) {
      logger.error(`❌ Scratch removal failed: ${processingError}`);
      throw new AppError(
        `Scratch removal failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "SCRATCH_REMOVAL_ERROR"
      );
    }
  })
);

// Health check endpoint for scratch removal tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-scratch-remove",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Automatic scratch detection",
        "Dust and speck removal",
        "Film grain reduction",
        "Content-aware repair",
        "Edge-preserving algorithms",
        "Multiple detection modes",
        "Intensity control",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
