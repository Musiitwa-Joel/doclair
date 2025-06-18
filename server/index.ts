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
  logger.info(`🖼️ Image processing tools ready`);
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
