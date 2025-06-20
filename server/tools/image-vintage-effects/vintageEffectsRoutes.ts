import { Router } from "express";
import multer from "multer";
import { config } from "../../config/environment";
import { validateFile, sanitizeFilename } from "../../utils/fileUtils";
import { logger } from "../../utils/logger";
import vintageEffectsService from "./vintageEffectsService";
import { asyncHandler, AppError } from "../../middleware/errorHandler";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1, // Single file for vintage effects
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

// Single image vintage effect endpoint
router.post(
  "/vintage-effect",
  upload.single("image"),
  validateImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file!;

    logger.info(`🎞️ Received vintage effect request for: ${file.originalname}`);
    logger.info(`📊 File details: ${file.mimetype}, ${file.size} bytes`);

    // Validate image file specifically
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      logger.error(`❌ Image validation failed: ${validation.error}`);
      throw new AppError(validation.error!, 400, "INVALID_IMAGE_FILE");
    }

    // Parse vintage options
    let vintageOptions;
    try {
      vintageOptions = JSON.parse(req.body.vintageOptions || "{}");
      logger.info(`🎞️ Vintage options: ${JSON.stringify(vintageOptions)}`);
    } catch (parseError) {
      logger.error(`❌ Failed to parse vintage options: ${parseError}`);
      throw new AppError(
        "Invalid vintage options format",
        400,
        "INVALID_VINTAGE_OPTIONS"
      );
    }

    logger.info(
      `🎞️ Starting vintage effect for: ${file.originalname}, Size: ${file.size} bytes`
    );

    try {
      // Apply vintage effect
      const result = await vintageEffectsService.applyVintageEffect(
        file.buffer,
        file.originalname,
        vintageOptions
      );

      // Determine output filename and format
      const outputFormat = vintageOptions.outputFormat || "jpg";
      const sanitizedFilename = sanitizeFilename(
        `vintage_${file.originalname.replace(/\.[^/.]+$/, `.${outputFormat}`)}`
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
      res.setHeader("X-Vintage-Style", result.vintageStyle);
      res.setHeader("X-Effect-Intensity", result.effectIntensity.toString());
      res.setHeader("X-Film-Grain", result.filmGrain.toString());
      res.setHeader("X-Color-Shift", result.colorShift.toString());
      res.setHeader("X-Vignette", result.vignette ? "true" : "false");

      // Send the processed image buffer
      res.send(result.buffer);

      logger.info(
        `✅ Vintage effect completed: ${sanitizedFilename}, Time: ${result.processingTime}ms`
      );
      logger.info(
        `🎞️ Applied style: ${result.vintageStyle} with intensity ${result.effectIntensity}`
      );
    } catch (processingError) {
      logger.error(`❌ Vintage effect failed: ${processingError}`);
      throw new AppError(
        `Vintage effect failed: ${
          processingError instanceof Error
            ? processingError.message
            : "Unknown error"
        }`,
        500,
        "VINTAGE_EFFECT_ERROR"
      );
    }
  })
);

// Health check endpoint for vintage effects tool
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "healthy",
      service: "image-vintage-effects",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: [
        "Classic film emulation",
        "Vintage color grading",
        "Film grain simulation",
        "Light leaks and vignettes",
        "Cross-processing effects",
        "Retro color palettes",
        "Multiple era presets",
        "Multiple output formats",
        "Quality control",
        "Border and frame options",
      ],
    });
  })
);

export default router;
