import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import blackAndWhiteService from "./blackAndWhiteService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for B&W conversion
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

// Single image black and white conversion endpoint
router.post(
  "/black-and-white",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🖤 Received B&W conversion request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse B&W options
    let bwOptions;
    try {
      bwOptions = JSON.parse(req.body.bwOptions || "{}");
      logger.info(`🖤 B&W options: ${JSON.stringify(bwOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse B&W options: ${parseError}`);
      throw new AppError(
        "Invalid B&W options format",
        400,
        "INVALID_BW_OPTIONS"
      );
    }

    logger.info(
      `🖤 Starting B&W conversion for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Convert to black and white
      const result = await blackAndWhiteService.convertToBlackAndWhite(
        file.buffer,
        file.originalname,
        bwOptions
      );

      // Determine output filename and format
      const outputFormat = bwOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `bw_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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
      res.setHeader("X-Conversion-Mode", result.conversionMode);
      res.setHeader("X-Toning", result.toning);

      if (result.filmType) {
        res.setHeader("X-Film-Type", result.filmType);
      }

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ B&W conversion completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `🖤 Applied mode: ${result.conversionMode}${
          result.toning !== "none" ? `, toning: ${result.toning}` : ""
        }`
      );
    } catch (processingError) {
      logger.error(`❌ B&W conversion failed: ${processingError}`);
      throw new AppError(
        `B&W conversion failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "BW_CONVERSION_ERROR"
      );
    }
  })
);

// Health check endpoint for B&W conversion tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-black-and-white",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Professional B&W conversion",
        "RGB channel mixing",
        "Film simulation",
        "Tonal adjustments",
        "Darkroom-style toning",
        "Film grain simulation",
        "Vignette effects",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
