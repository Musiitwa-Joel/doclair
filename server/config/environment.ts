import dotenv from "dotenv";
import { AppConfig } from "../types/index.js";

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS settings
  corsOrigins:
    process.env.NODE_ENV === "production"
      ? process.env.CORS_ORIGINS?.split(",") || [
          "https://doclair.com",
          "https://www.doclair.com",
        ]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],

  // File upload limits
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600", 10), // 100MB
  maxFiles: parseInt(process.env.MAX_FILES || "10", 10),

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),

  // Conversion settings
  conversionTimeout: parseInt(process.env.CONVERSION_TIMEOUT || "30000", 10), // 30 seconds
  tempDir: process.env.TEMP_DIR || "/tmp/doclair-temp",

  // Security
  helmetConfig: {
    crossOriginResourcePolicy: {
      policy: process.env.CORS_POLICY || "cross-origin",
    },
  },
};

// Validate required environment variables in production
if (config.nodeEnv === "production") {
  const requiredEnvVars = ["PORT"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}
