import { Router } from "express";
import multer from "multer";
import archiver from "archiver";
import { config } from "../config/environment";
import { validateFile, sanitizeFilename } from "../utils/fileUtils";
import { parseSettingsFromRequest } from "../utils/validation";
import { logger } from "../utils/logger";
import pdfToWordService from "../services/pdfToWordService";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { validateFileUpload } from "../middleware/validation";
import {
  ConversionRequest,
  BatchConversionResult,
  BatchConversionError,
  BatchConversionResponse,
} from "../types/index.js";

const router = Router();

// Configure multer for memory storage (no disk storage for privacy)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: config.maxFiles,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf"];

    const allowedExtensions = [".pdf"];
    const fileExtension = file.originalname.toLowerCase().slice(-4);

    if (
      allowedMimes.includes(file.mimetype) ||
      allowedExtensions.some((ext) => fileExtension.includes(ext))
    ) {
      cb(null, true);
    } else {
      cb(new AppError("Only PDF files are allowed", 400, "INVALID_FILE_TYPE"));
    }
  },
});

// Single file conversion endpoint
router.post(
  "/pdf-to-word",
  upload.single("file"),
  validateFileUpload,
  asyncHandler(async (req: ConversionRequest, res) => {
    const file = req.file!;

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new AppError(validation.error!, 400, "INVALID_FILE");
    }

    // Parse conversion settings
    const settings = parseSettingsFromRequest(req.body.settings);

    logger.info(
      `Converting PDF to Word: ${file.originalname}, Size: ${file.size} bytes`
    );

    // Convert the file
    const result = await pdfToWordService.convertPdfToWord(file.buffer, {
      filename: file.originalname,
      settings,
    });

    // Set response headers for file download
    const sanitizedFilename = sanitizeFilename(
      file.originalname.replace(/\.pdf$/i, ".docx")
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}"`
    );
    res.setHeader("Content-Length", result.buffer.length.toString());
    res.setHeader("X-Conversion-Time", result.conversionTime.toString());
    res.setHeader("X-Original-Size", file.size.toString());
    res.setHeader("X-Converted-Size", result.buffer.length.toString());

    // Send the Word document buffer
    res.send(result.buffer);

    logger.info(
      `PDF to Word conversion completed: ${sanitizedFilename}, Time: ${result.conversionTime}ms`
    );
  })
);

// Batch conversion endpoint with ZIP download
router.post(
  "/batch/pdf-to-word",
  upload.array("files", config.maxFiles),
  validateFileUpload,
  asyncHandler(async (req: ConversionRequest, res) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", 400, "NO_FILES");
    }

    const settings = parseSettingsFromRequest(req.body.settings);
    const results: BatchConversionResult[] = [];
    const errors: BatchConversionError[] = [];

    logger.info(`Batch PDF to Word conversion started: ${files.length} files`);

    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Validate each file
        const validation = validateFile(file);
        if (!validation.isValid) {
          errors.push({
            filename: file.originalname,
            error: validation.error!,
            index: i,
          });
          continue;
        }

        // Convert the file
        const result = await pdfToWordService.convertPdfToWord(file.buffer, {
          filename: file.originalname,
          settings,
        });

        results.push({
          originalFilename: file.originalname,
          convertedFilename: sanitizeFilename(
            file.originalname.replace(/\.pdf$/i, ".docx")
          ),
          originalSize: file.size,
          convertedSize: result.buffer.length,
          conversionTime: result.conversionTime,
          buffer: result.buffer,
          index: i,
        });
      } catch (error) {
        logger.error(`Error converting PDF file ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : "Unknown error",
          index: i,
        });
      }
    }

    // If no files were successfully converted, return error response
    if (results.length === 0) {
      const response: BatchConversionResponse = {
        success: false,
        totalFiles: files.length,
        successfulConversions: 0,
        errorCount: errors.length,
        results: [],
        errors,
      };

      return res.status(400).json(response);
    }

    // Create ZIP file for download
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const zipFilename = `converted_word_docs_${timestamp}.zip`;

    // Set headers for ZIP download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFilename}"`
    );
    res.setHeader("X-Total-Files", files.length.toString());
    res.setHeader("X-Successful-Conversions", results.length.toString());
    res.setHeader("X-Failed-Conversions", errors.length.toString());

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Compression level
    });

    // Handle archive errors
    archive.on("error", (err) => {
      logger.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create ZIP archive" });
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add converted Word files to archive
    for (const result of results) {
      archive.append(result.buffer, { name: result.convertedFilename });
      logger.info(`Added to ZIP: ${result.convertedFilename}`);
    }

    // Add conversion report if there were any errors
    if (errors.length > 0) {
      const reportContent = [
        "PDF to Word Conversion Report",
        "=============================",
        "",
        `Total files: ${files.length}`,
        `Successfully converted: ${results.length}`,
        `Failed conversions: ${errors.length}`,
        "",
        "Failed Files:",
        "-------------",
      ];

      errors.forEach((error, index) => {
        reportContent.push(`${index + 1}. ${error.filename}`);
        reportContent.push(`   Error: ${error.error}`);
        reportContent.push("");
      });

      reportContent.push("");
      reportContent.push(`Generated: ${new Date().toISOString()}`);

      archive.append(reportContent.join("\n"), {
        name: "conversion_report.txt",
      });
    }

    // Finalize the archive
    await archive.finalize();

    logger.info(
      `Batch PDF to Word conversion completed: ${results.length}/${files.length} successful, ZIP created: ${zipFilename}`
    );
  })
);

export default router;
