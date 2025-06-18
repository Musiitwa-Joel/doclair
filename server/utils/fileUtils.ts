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

const ALLOWED_DOCUMENT_MIMES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-word",
  "application/pdf", // Support both Word and PDF files
] as const;

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_DOCUMENT_EXTENSIONS = [".doc", ".docx", ".pdf"] as const;
const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
] as const;

export function validateFile(
  file: MulterFile,
  fileType: "document" | "image" = "document"
): FileValidationResult {
  try {
    // Log the filename for debugging
    logger.info(`Validating ${fileType} file: "${file.originalname}"`);

    // Validate with Zod schema
    FileSchema.parse(file);

    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check file type based on expected type
    let isValidType = false;

    if (fileType === "image") {
      const isImageFile =
        ALLOWED_IMAGE_MIMES.includes(file.mimetype as any) ||
        ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension as any);
      isValidType = isImageFile;

      if (!isValidType) {
        logger.warn(
          `Invalid image file type: ${file.mimetype}, extension: ${fileExtension}`
        );
        return {
          isValid: false,
          error: "Only image files (JPG, PNG, WebP, GIF) are supported",
        };
      }
    } else {
      // Document validation (Word/PDF)
      const isPdfFile =
        file.mimetype === "application/pdf" || fileExtension === ".pdf";
      const isWordFile =
        [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-word",
        ].includes(file.mimetype) || [".doc", ".docx"].includes(fileExtension);

      isValidType = isPdfFile || isWordFile;

      if (!isValidType) {
        logger.warn(
          `Invalid document file type: ${file.mimetype}, extension: ${fileExtension}`
        );
        return {
          isValid: false,
          error:
            "Only Word documents (.doc, .docx) and PDF files are supported",
        };
      }
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
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
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

export function isValidFileType(
  mimetype: string,
  filename: string,
  fileType: "document" | "image" = "document"
): boolean {
  const extension = getFileExtension(filename);

  if (fileType === "image") {
    return (
      ALLOWED_IMAGE_MIMES.includes(mimetype as any) ||
      ALLOWED_IMAGE_EXTENSIONS.includes(extension as any)
    );
  } else {
    return (
      ALLOWED_DOCUMENT_MIMES.includes(mimetype as any) ||
      ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as any)
    );
  }
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
