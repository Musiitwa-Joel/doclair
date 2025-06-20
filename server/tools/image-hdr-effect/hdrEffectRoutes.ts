import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import hdrEffectService from "./hdrEffectService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for HDR effect
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

// Single image HDR effect endpoint
router.post(
  "/hdr-effect",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🌈 Received HDR effect request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse HDR options
    let hdrOptions;
    try {
      hdrOptions = JSON.parse(req.body.hdrOptions || "{}");
      logger.info(`🌈 HDR options: ${JSON.stringify(hdrOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse HDR options: ${parseError}`);
      throw new AppError(
        "Invalid HDR options format",
        400,
        "INVALID_HDR_OPTIONS"
      );
    }

    logger.info(
      `🌈 Starting HDR effect for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Apply HDR effect
      const result = await hdrEffectService.applyHDREffect(
        file.buffer,
        file.originalname,
        hdrOptions
      );

      // Determine output filename and format
      const outputFormat = hdrOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `hdr_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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
      res.setHeader("X-HDR-Style", result.hdrStyle);
      res.setHeader("X-Tone-Mapping", result.toneMapping);
      res.setHeader("X-Dynamic-Range", result.dynamicRange.toString());

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ HDR effect completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `🌈 Applied style: ${result.hdrStyle} with tone mapping ${result.toneMapping}`
      );
    } catch (processingError) {
      logger.error(`❌ HDR effect failed: ${processingError}`);
      throw new AppError(
        `HDR effect failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "HDR_EFFECT_ERROR"
      );
    }
  })
);

// Health check endpoint for HDR effect tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-hdr-effect",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "High Dynamic Range enhancement",
        "Multiple tone mapping algorithms",
        "Shadow and highlight recovery",
        "Color grading capabilities",
        "Cinematic HDR styles",
        "Landscape optimization",
        "Multiple output formats",
        "Quality control",
      ],
    });
  })
);

export default router;
