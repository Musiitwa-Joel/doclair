import path from "path";
import { z } from "zod";
import { FileValidationResult, MulterFile } from "../types/index.js";
import { logger } from "./logger.js";

// Zod schema for file validation
const FileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string().min(1).max(255),
  encoding: z.string(),
  mimetype: z.string(),
  size: z
    .number()
    .positive()
    .max(100 * 1024 * 1024), // 100MB
  buffer: z.instanceof(Buffer),
});

const ALLOWED_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-word",
  "application/pdf", // Added PDF support
] as const;

const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"] as const; // Added .pdf

export function validateFile(file: MulterFile): FileValidationResult {
  try {
    // Log the filename for debugging
    logger.info(`Validating file: "${file.originalname}"`);

    // Validate with Zod schema
    FileSchema.parse(file);

    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check file type - more flexible validation for different conversion types
    const isPdfFile =
      file.mimetype === "application/pdf" || fileExtension === ".pdf";
    const isWordFile =
      ALLOWED_MIME_TYPES.slice(0, 3).includes(file.mimetype as any) ||
      [".doc", ".docx"].includes(fileExtension);

    if (!isPdfFile && !isWordFile) {
      logger.warn(
        `Invalid file type: ${file.mimetype}, extension: ${fileExtension}`
      );
      return {
        isValid: false,
        error: "Only Word documents (.doc, .docx) and PDF files are supported",
      };
    }

    // Check for empty file
    if (file.size === 0) {
      logger.warn(`Empty file detected: "${file.originalname}"`);
      return {
        isValid: false,
        error: "File is empty",
      };
    }

    // More specific filename validation - FIXED FOR PRODUCTION
    const filename = file.originalname;

    // Check for null bytes (security risk)
    if (filename.includes("\0")) {
      logger.warn(`Filename contains null bytes: "${filename}"`);
      return {
        isValid: false,
        error: "Invalid filename - contains null bytes",
      };
    }

    // FIXED: Only check for actual path traversal patterns, not double dots in filenames
    // This allows files like "2FAR KITCHENWARE INC..docx" which are perfectly valid
    if (
      filename.includes("../") ||
      filename.includes("..\\") ||
      filename.includes("/..") ||
      filename.includes("\\..") ||
      filename.startsWith("/") ||
      filename.startsWith("\\") ||
      filename.includes(":/") ||
      filename.includes(":\\")
    ) {
      logger.warn(`Path traversal detected in filename: "${filename}"`);
      return {
        isValid: false,
        error: "Invalid filename - path traversal detected",
      };
    }

    // Check for control characters (but allow common ones like spaces, tabs)
    const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(filename);
    if (hasControlChars) {
      logger.warn(`Control characters detected in filename: "${filename}"`);
      return {
        isValid: false,
        error: "Invalid filename - contains control characters",
      };
    }

    // Check buffer integrity
    if (!Buffer.isBuffer(file.buffer) || file.buffer.length !== file.size) {
      logger.error(`Buffer integrity check failed for: "${filename}"`);
      return {
        isValid: false,
        error: "File data corruption detected",
      };
    }

    logger.info(`File validation passed: "${filename}"`);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      logger.error(
        `Zod validation error: ${firstError.message} at ${firstError.path.join(
          "."
        )}`
      );
      return {
        isValid: false,
        error: `Validation error: ${
          firstError.message
        } at ${firstError.path.join(".")}`,
      };
    }

    logger.error(`Unknown validation error: ${error}`);
    return {
      isValid: false,
      error: "Unknown validation error",
    };
  }
}

export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "document";
  }

  // More conservative sanitization that preserves more characters
  return (
    filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_") // Replace only truly dangerous chars
      .replace(/\s+/g, "_") // Replace spaces with underscore
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .substring(0, 200) || // Limit length
    "document"
  ); // Fallback if empty after sanitization
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pdf": "application/pdf",
    ".rtf": "application/rtf",
    ".odt": "application/vnd.oasis.opendocument.text",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isValidFileType(mimetype: string, filename: string): boolean {
  const extension = getFileExtension(filename);
  return (
    ALLOWED_MIME_TYPES.includes(mimetype as any) ||
    ALLOWED_EXTENSIONS.includes(extension as any)
  );
}

export function generateTempFilename(
  originalFilename: string,
  suffix: string = ""
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const extension = getFileExtension(originalFilename);
  const baseName = path.basename(originalFilename, extension);

  return `${sanitizeFilename(
    baseName
  )}_${timestamp}_${random}${suffix}${extension}`;
}
