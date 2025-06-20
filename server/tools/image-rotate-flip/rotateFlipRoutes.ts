import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import rotateFlipService from "./rotateFlipService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads (multiple files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 5, // Allow up to 5 images for combining
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
const validateImageUploads = (req: any, res: any, next: any) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError("No image files uploaded", 400, "NO_FILES");
  }

  if (req.files.length > 5) {
    throw new AppError("Maximum 5 images allowed", 400, "TOO_MANY_FILES");
  }

  next();
};

// Multiple image rotate/flip endpoint
router.post(
  "/rotate-flip-image",
  upload.array("images", 5),
  validateImageUploads,
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];

    logger.info(`🔄 Received rotate/flip request for ${files.length} image(s)`);
    files.forEach((file, index) => {
      logger.info(
        `📊 Image ${index + 1}: ${file.originalname}, ${file.mimetype}, ${
          file.size
        } bytes`
      );
    });

    // Validate all image files
    for (let i = 0; i < files.length; i++) {
      const validation = validateFile(files[i], "image");
      if (!validation.isValid) {
        logger.error(
          `❌ Image ${i + 1} validation failed: ${validation.error}`
        );
        throw new AppError(
          `Image ${i + 1} validation failed: ${validation.error}`,
          400,
          "INVALID_IMAGE_FILE"
        );
      }
    }

    // Parse rotate/flip options
    let rotateFlipOptions;
    try {
      rotateFlipOptions = JSON.parse(req.body.rotateFlipOptions || "{}");
      logger.info(
        `🔄 Rotate/flip options: ${JSON.stringify(rotateFlipOptions)}`
      );
    } catch (parseError) {
      logger.error(`❌ Failed to parse rotate/flip options: ${parseError}`);
      throw new AppError(
        "Invalid rotate/flip options format",
        400,
        "INVALID_ROTATE_FLIP_OPTIONS"
      );
    }

    // Set default combine mode based on number of files
    if (files.length > 1 && !rotateFlipOptions.combineMode) {
      rotateFlipOptions.combineMode = "side-by-side";
    } else if (files.length === 1) {
      rotateFlipOptions.combineMode = "none";
    }

    logger.info(`🔄 Starting rotate/flip for ${files.length} image(s)`);

    try {
      // Process the images
      const result = await rotateFlipService.processImages(
        files.map((file) => file.buffer),
        files.map((file) => file.originalname),
        rotateFlipOptions
      );

      // Determine output filename and format
      const outputFormat = rotateFlipOptions.outputFormat || "png";
      const baseFilename =
        files.length === 1
          ? files[0].originalname
          : `combined_${files.length}_images`;

      const sanitizedFilename = sanitizeFilename(
        baseFilename.replace(/\.[^/.]+$/, `.${outputFormat}`)
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
      res.setHeader("X-Operations", result.operations.join(", "));
      res.setHeader("X-Image-Count", result.imageCount.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Rotate/flip completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `📊 Dimensions: ${result.originalDimensions.width}x${result.originalDimensions.height} → ${result.processedDimensions.width}x${result.processedDimensions.height}`
      );
      logger.info(`⚙️ Operations: ${result.operations.join(", ")}`);
    } catch (processError) {
      logger.error(`❌ Rotate/flip processing failed: ${processError}`);
      throw new AppError(
        `Rotate/flip processing failed: ${
          processError instanceof Error ? processError.message : "Unknown error"
        }`,
        500,
        "ROTATE_FLIP_PROCESSING_ERROR"
      );
    }
  })
);

// Health check endpoint for image rotate/flip tools
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-rotate-flip",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Image rotation (any angle)",
        "Horizontal and vertical flipping",
        "Multiple image combining",
        "Side-by-side layout",
        "Top-bottom layout",
        "Overlay mode",
        "Custom spacing and alignment",
        "Multiple output formats",
        "Quality control",
        "Background color customization",
      ],
    });
  })
);

export default router;
