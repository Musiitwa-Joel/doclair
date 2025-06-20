import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/environment.js";
import { logger } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import conversionRoutes from "./routes/conversion.js";
import pdfToWordRoutes from "./routes/pdfToWordConversion.js";
import healthRoutes from "./routes/health.js";
import pdfToWordHealthRoutes from "./routes/pdfToWordHealth.js";

// Import tool routes
import imageCropRoutes from "./tools/image-crop/cropRoutes.js";
import imageResizeRoutes from "./tools/image-resize/resizeRoutes.js";
import imageRotateFlipRoutes from "./tools/image-rotate-flip/rotateFlipRoutes.js";
import imageBrightnessContrastRoutes from "./tools/image-brightness-contrast/brightnessContrastRoutes.js";
import imageColorBalanceRoutes from "./tools/image-color-balance/colorBalanceRoutes.js";
import imageSharpenBlurRoutes from "./tools/image-sharpen-blur/sharpenBlurRoutes.js";
import imageAutoEnhanceRoutes from "./tools/image-auto-enhance/autoEnhanceRoutes.js";
import imagePerspectiveCorrectRoutes from "./tools/image-perspective-correct/perspectiveCorrectRoutes.js";
import imageBackgroundRemoveRoutes from "./tools/image-background-remove/backgroundRemoveRoutes.js";
import imageRestoreRoutes from "./tools/image-restore/restoreRoutes.js";
import imageUnblurRoutes from "./tools/image-unblur/unblurRoutes.js";
import imageScratchRemoveRoutes from "./tools/image-scratch-remove/scratchRemoveRoutes.js";
import imageColorRestoreRoutes from "./tools/image-color-restore/colorRestoreRoutes.js";
import imageArtisticFiltersRoutes from "./tools/image-artistic-filters/artisticFiltersRoutes.js";
import imageVintageEffectsRoutes from "./tools/image-vintage-effects/vintageEffectsRoutes.js";

const app = express();

// Security middleware
app.use(helmet(config.helmetConfig));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: {
    error: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
    });
  },
});

app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "X-Conversion-Time",
      "X-Processing-Time",
      "X-Original-Size",
      "X-Converted-Size",
      "X-Output-Format",
      "X-Original-Dimensions",
      "X-Cropped-Dimensions",
      "X-Resized-Dimensions",
      "X-Processed-Dimensions",
      "X-Corrected-Dimensions",
      "X-Compression-Ratio",
      "X-AI-Upscaled",
      "X-Operations",
      "X-Image-Count",
      "X-Adjustments",
      "X-Enhancements",
      "X-Quality-Score",
      "X-Correction-Angle",
      "X-Keystone-Correction",
      "X-Transparency-Score",
      "X-Edge-Quality-Score",
      "X-Restoration-Score",
      "X-Clarity-Score",
      "X-Scratch-Count",
      "X-Repair-Score",
      "X-Filter-Applied",
      "X-Effect-Intensity",
      "X-Artistic-Score",
      "X-Vintage-Style",
      "X-Film-Grain",
      "X-Color-Shift",
      "X-Vignette",
      "X-HDR-Style",
      "X-Tone-Mapping",
      "X-Dynamic-Range",
      "Content-Disposition",
    ],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    contentLength: req.get("Content-Length"),
  });
  next();
});

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/health/pdf-to-word", pdfToWordHealthRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/convert", pdfToWordRoutes);

// Tool routes
app.use("/api/tools/image", imageCropRoutes);
app.use("/api/tools/image", imageResizeRoutes);
app.use("/api/tools/image", imageRotateFlipRoutes);
app.use("/api/tools/image", imageBrightnessContrastRoutes);
app.use("/api/tools/image", imageColorBalanceRoutes);
app.use("/api/tools/image", imageSharpenBlurRoutes);
app.use("/api/tools/image", imageAutoEnhanceRoutes);
app.use("/api/tools/image", imagePerspectiveCorrectRoutes);
app.use("/api/tools/image", imageBackgroundRemoveRoutes);
app.use("/api/tools/image", imageRestoreRoutes);
app.use("/api/tools/image", imageUnblurRoutes);
app.use("/api/tools/image", imageScratchRemoveRoutes);
app.use("/api/tools/image", imageColorRestoreRoutes);
app.use("/api/tools/image", imageArtisticFiltersRoutes);
app.use("/api/tools/image", imageVintageEffectsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Doclair Converter API",
    version: process.env.npm_package_version || "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      stats: "/api/health/stats",
      pdfToWordHealth: "/api/health/pdf-to-word",
      wordToPdf: "/api/convert/word-to-pdf",
      pdfToWord: "/api/convert/pdf-to-word",
      batchWordToPdf: "/api/convert/batch/word-to-pdf",
      batchPdfToWord: "/api/convert/batch/pdf-to-word",
      imageCrop: "/api/tools/image/crop-image",
      imageResize: "/api/tools/image/resize-image",
      imageRotateFlip: "/api/tools/image/rotate-flip-image",
      imageBrightnessContrast: "/api/tools/image/brightness-contrast",
      imageColorBalance: "/api/tools/image/color-balance",
      imageSharpenBlur: "/api/tools/image/sharpen-blur",
      imageAutoEnhance: "/api/tools/image/auto-enhance",
      imagePerspectiveCorrect: "/api/tools/image/perspective-correct",
      imageBackgroundRemove: "/api/tools/image/remove-background",
      imageRestore: "/api/tools/image/restore-photo",
      imageUnblur: "/api/tools/image/unblur-image",
      imageScratchRemove: "/api/tools/image/remove-scratches",
      imageColorRestore: "/api/tools/image/restore-colors",
      imageArtisticFilter: "/api/tools/image/artistic-filter",
      imageVintageEffect: "/api/tools/image/vintage-effect",
      imageHdrEffect: "/api/tools/image/hdr-effect",
      imageToolsHealth: "/api/tools/image/health",
    },
  });
});

// API status endpoint
app.get("/api", (req, res) => {
  res.json({
    service: "Doclair Converter API",
    status: "healthy",
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      "GET /api/health - General health check",
      "GET /api/health/pdf-to-word - PDF to Word service health",
      "POST /api/convert/word-to-pdf - Convert Word to PDF",
      "POST /api/convert/pdf-to-word - Convert PDF to Word",
      "POST /api/convert/batch/word-to-pdf - Batch Word to PDF",
      "POST /api/convert/batch/pdf-to-word - Batch PDF to Word",
      "POST /api/tools/image/crop-image - Crop image",
      "POST /api/tools/image/resize-image - Resize image with AI upscaling",
      "POST /api/tools/image/rotate-flip-image - Rotate, flip & combine images",
      "POST /api/tools/image/brightness-contrast - Adjust brightness & contrast",
      "POST /api/tools/image/color-balance - Color balance & temperature",
      "POST /api/tools/image/sharpen-blur - Sharpen & blur effects",
      "POST /api/tools/image/auto-enhance - One-click image enhancement",
      "POST /api/tools/image/perspective-correct - Fix perspective distortion",
      "POST /api/tools/image/remove-background - Remove image backgrounds",
      "POST /api/tools/image/restore-photo - Restore old photos",
      "POST /api/tools/image/unblur-image - Unblur and sharpen images",
      "POST /api/tools/image/remove-scratches - Remove scratches and dust",
      "POST /api/tools/image/restore-colors - Restore faded colors",
      "POST /api/tools/image/artistic-filter - Apply artistic filters",
      "POST /api/tools/image/vintage-effect - Apply vintage film effects",
      "POST /api/tools/image/hdr-effect - Apply HDR effects",
      "GET /api/tools/image/health - Image tools health",
    ],
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handlers
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Doclair Converter Server running on port ${config.port}`);
  logger.info(`📝 Word to PDF conversion service ready`);
  logger.info(`📄 PDF to Word conversion service ready`);
  logger.info(`✂️ Image crop tool ready`);
  logger.info(`📏 Image resize tool with AI upscaling ready`);
  logger.info(`🔄 Image rotate & flip tool with multi-image support ready`);
  logger.info(`🌟 Image brightness & contrast tool ready`);
  logger.info(`🎨 Image color balance tool ready`);
  logger.info(`🔍 Image sharpen & blur tool ready`);
  logger.info(`✨ Image auto enhance tool ready`);
  logger.info(`📐 Image perspective correction tool ready`);
  logger.info(`🖼️ Image background removal tool ready`);
  logger.info(`🏞️ Old photo restoration tool ready`);
  logger.info(`🔎 Image unblur tool ready`);
  logger.info(`🧹 Scratch & dust removal tool ready`);
  logger.info(`🎭 Color restoration tool ready`);
  logger.info(`🎨 Artistic filters tool ready`);
  logger.info(`🎞️ Vintage effects tool ready`);
  logger.info(`🌈 HDR effects tool ready`);
  logger.info(`🔒 Privacy-first processing - no files stored`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info(`📊 CORS origins: ${config.corsOrigins.join(", ")}`);
  logger.info(`🔗 API available at: http://localhost:${config.port}/api`);
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${config.port} is already in use`);
  } else {
    logger.error("Server error:", error);
  }
  process.exit(1);
});

export default app;
