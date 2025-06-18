import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../utils/logger";
import { config } from "../config/environment";
import {
  ConversionOptions,
  ConversionResult,
  ConversionSettings,
} from "../types/index";
import { generateTempFilename, sanitizeFilename } from "../utils/fileUtils";

const execAsync = promisify(exec);

interface LibreOfficeInfo {
  isInstalled: boolean;
  version?: string;
  path?: string;
  error?: string;
}

interface TesseractInfo {
  isInstalled: boolean;
  version?: string;
  path?: string;
  languages: string[];
  error?: string;
}

class PdfToWordService {
  private readonly tempDir: string;
  private libreOfficeInfo: LibreOfficeInfo | null = null;
  private tesseractInfo: TesseractInfo | null = null;

  constructor() {
    this.tempDir = config.tempDir;
    this.ensureTempDir();
    this.checkLibreOffice();
    this.checkTesseract();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Temp directory ensured: ${this.tempDir}`);
    } catch (error) {
      logger.error("Failed to create temp directory:", error);
      throw new Error("Failed to initialize temporary directory");
    }
  }

  private async checkLibreOffice(): Promise<void> {
    try {
      logger.info("🔍 Checking LibreOffice installation for PDF to Word...");

      const commands = [
        "libreoffice",
        "soffice",
        "/usr/bin/libreoffice",
        "/usr/local/bin/libreoffice",
        "/opt/libreoffice/program/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
        "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      ];

      for (const cmd of commands) {
        try {
          logger.info(`🔍 Trying LibreOffice command: ${cmd}`);
          const { stdout, stderr } = await execAsync(`"${cmd}" --version`, {
            timeout: 15000,
          });

          if (stdout.includes("LibreOffice")) {
            this.libreOfficeInfo = {
              isInstalled: true,
              version: stdout.trim(),
              path: cmd,
            };
            logger.info(
              `✅ LibreOffice found for PDF to Word: ${stdout.trim()}`
            );
            logger.info(`📍 LibreOffice path: ${cmd}`);

            // Test PDF to Word conversion capability
            await this.testPdfToWordConversion(cmd);
            return;
          }
        } catch (cmdError) {
          logger.debug(`❌ Command failed: ${cmd} - ${cmdError}`);
          continue;
        }
      }

      this.libreOfficeInfo = {
        isInstalled: false,
        error: "LibreOffice not found in common locations",
      };

      logger.error("❌ LibreOffice not found for PDF to Word conversion.");
    } catch (error) {
      this.libreOfficeInfo = {
        isInstalled: false,
        error: `LibreOffice check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
      logger.error("LibreOffice check failed:", error);
    }
  }

  private async testPdfToWordConversion(
    libreOfficePath: string
  ): Promise<void> {
    try {
      logger.info(
        "🧪 Testing LibreOffice PDF to Word conversion capability..."
      );

      const testDir = path.join(this.tempDir, "test_pdf_to_word");
      await fs.mkdir(testDir, { recursive: true });

      // Create a simple test PDF content (minimal PDF structure)
      const testPdfContent = Buffer.from([
        0x25,
        0x50,
        0x44,
        0x46,
        0x2d,
        0x31,
        0x2e,
        0x34,
        0x0a, // %PDF-1.4
        0x31,
        0x20,
        0x30,
        0x20,
        0x6f,
        0x62,
        0x6a,
        0x0a, // 1 0 obj
        0x3c,
        0x3c,
        0x2f,
        0x54,
        0x79,
        0x70,
        0x65,
        0x2f,
        0x43,
        0x61,
        0x74,
        0x61,
        0x6c,
        0x6f,
        0x67,
        0x2f,
        0x50,
        0x61,
        0x67,
        0x65,
        0x73,
        0x20,
        0x32,
        0x20,
        0x30,
        0x20,
        0x52,
        0x3e,
        0x3e,
        0x0a, // <</Type/Catalog/Pages 2 0 R>>
        0x65,
        0x6e,
        0x64,
        0x6f,
        0x62,
        0x6a,
        0x0a, // endobj
        0x78,
        0x72,
        0x65,
        0x66,
        0x0a,
        0x30,
        0x20,
        0x33,
        0x0a, // xref 0 3
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x30,
        0x20,
        0x36,
        0x35,
        0x35,
        0x33,
        0x35,
        0x20,
        0x66,
        0x20,
        0x0a, // 0000000000 65535 f
        0x74,
        0x72,
        0x61,
        0x69,
        0x6c,
        0x65,
        0x72,
        0x0a,
        0x3c,
        0x3c,
        0x2f,
        0x53,
        0x69,
        0x7a,
        0x65,
        0x20,
        0x33,
        0x2f,
        0x52,
        0x6f,
        0x6f,
        0x74,
        0x20,
        0x31,
        0x20,
        0x30,
        0x20,
        0x52,
        0x3e,
        0x3e,
        0x0a, // trailer <</Size 3/Root 1 0 R>>
        0x73,
        0x74,
        0x61,
        0x72,
        0x74,
        0x78,
        0x72,
        0x65,
        0x66,
        0x0a,
        0x31,
        0x38,
        0x32,
        0x0a,
        0x25,
        0x25,
        0x45,
        0x4f,
        0x46, // startxref 182 %%EOF
      ]);

      const testInputPath = path.join(testDir, "test.pdf");
      const testOutputDir = path.join(testDir, "output");

      await fs.mkdir(testOutputDir, { recursive: true });
      await fs.writeFile(testInputPath, testPdfContent);

      // Test conversion
      const testCommand = `"${libreOfficePath}" --headless --convert-to docx --outdir "${testOutputDir}" "${testInputPath}"`;

      const { stdout, stderr } = await execAsync(testCommand, {
        timeout: 30000,
        env: {
          ...process.env,
          HOME: this.tempDir,
          TMPDIR: this.tempDir,
          SAL_USE_VCLPLUGIN: "svp",
          SAL_DISABLE_OPENCL: "1",
          DISPLAY: "",
          NO_AT_BRIDGE: "1",
        },
      });

      // Check if DOCX was created
      const outputFiles = await fs.readdir(testOutputDir);
      const docxFiles = outputFiles.filter((f) => f.endsWith(".docx"));

      if (docxFiles.length > 0) {
        logger.info("✅ LibreOffice PDF to Word test conversion successful");
      } else {
        logger.warn(
          "⚠️ LibreOffice PDF to Word test failed - no DOCX generated"
        );
        logger.warn(`Test stdout: ${stdout}`);
        logger.warn(`Test stderr: ${stderr}`);
      }

      // Cleanup test files
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (testError) {
      logger.warn("⚠️ LibreOffice PDF to Word test failed:", testError);
    }
  }

  private async checkTesseract(): Promise<void> {
    try {
      logger.info("🔍 Checking Tesseract OCR installation...");

      const commands = [
        "tesseract",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/opt/homebrew/bin/tesseract",
        "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
        "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
      ];

      for (const cmd of commands) {
        try {
          const { stdout } = await execAsync(`"${cmd}" --version`, {
            timeout: 10000,
          });

          if (stdout.includes("tesseract")) {
            // Get available languages
            let languages: string[] = [];
            try {
              const { stdout: langOutput } = await execAsync(
                `"${cmd}" --list-langs`,
                {
                  timeout: 10000,
                }
              );
              languages = langOutput
                .split("\n")
                .slice(1) // Skip first line which is "List of available languages"
                .filter((lang) => lang.trim().length > 0)
                .map((lang) => lang.trim());
            } catch (langError) {
              logger.warn("Could not get Tesseract languages:", langError);
              languages = ["eng"]; // Default to English
            }

            this.tesseractInfo = {
              isInstalled: true,
              version: stdout.trim(),
              path: cmd,
              languages,
            };
            logger.info(`✅ Tesseract OCR found: ${stdout.trim()}`);
            logger.info(`📍 Tesseract path: ${cmd}`);
            logger.info(`🌐 Available languages: ${languages.join(", ")}`);
            return;
          }
        } catch (cmdError) {
          logger.debug(`❌ Tesseract command failed: ${cmd} - ${cmdError}`);
          continue;
        }
      }

      this.tesseractInfo = {
        isInstalled: false,
        languages: [],
        error: "Tesseract OCR not found in common locations",
      };

      logger.warn(
        "⚠️ Tesseract OCR not found. OCR functionality will be limited."
      );
    } catch (error) {
      this.tesseractInfo = {
        isInstalled: false,
        languages: [],
        error: `Tesseract check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
      logger.error("Tesseract check failed:", error);
    }
  }

  public getLibreOfficeStatus(): LibreOfficeInfo {
    return (
      this.libreOfficeInfo || {
        isInstalled: false,
        error: "LibreOffice status not checked yet",
      }
    );
  }

  public getTesseractStatus(): TesseractInfo {
    return (
      this.tesseractInfo || {
        isInstalled: false,
        languages: [],
        error: "Tesseract status not checked yet",
      }
    );
  }

  public async convertPdfToWord(
    fileBuffer: Buffer,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const { filename, settings } = options;

    logger.info(
      `🚀 Starting PDF to Word conversion: ${filename} (${fileBuffer.length} bytes)`
    );
    logger.info(`⚙️ Settings: ${JSON.stringify(settings)}`);

    // Check LibreOffice availability
    if (!this.libreOfficeInfo?.isInstalled) {
      const errorMessage = `LibreOffice is required for PDF to Word conversion. ${
        this.libreOfficeInfo?.error || "LibreOffice not found."
      }`;
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Enhanced PDF validation
    const pdfValidation = this.validatePdfFile(fileBuffer, filename);
    if (!pdfValidation.isValid) {
      throw new Error(pdfValidation.error);
    }

    // Generate unique temporary filenames
    const tempId = Math.random().toString(36).substr(2, 9);
    const inputPath = path.join(this.tempDir, `input_${tempId}.pdf`);
    const outputDir = path.join(this.tempDir, `output_${tempId}`);

    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Write input file to temp location
      await fs.writeFile(inputPath, fileBuffer);
      logger.info(
        `📁 PDF input file written: ${inputPath} (${fileBuffer.length} bytes)`
      );

      // Verify the file was written correctly
      const writtenStats = await fs.stat(inputPath);
      if (writtenStats.size !== fileBuffer.length) {
        throw new Error(
          `File write verification failed: expected ${fileBuffer.length} bytes, got ${writtenStats.size} bytes`
        );
      }

      // Convert PDF to Word using LibreOffice with enhanced error handling
      let wordBuffer: Buffer;
      try {
        wordBuffer = await this.convertWithLibreOffice(
          inputPath,
          outputDir,
          settings,
          filename
        );
      } catch (libreOfficeError) {
        logger.error(
          `❌ LibreOffice PDF to Word conversion failed: ${libreOfficeError}`
        );

        // Check if it's a PDF-specific issue
        if (this.isPdfConversionError(libreOfficeError)) {
          throw new Error(
            `The PDF file "${filename}" cannot be converted to Word. This may be due to: 1) Password protection, 2) Corrupted PDF structure, 3) Scanned images without OCR capability, or 4) Complex formatting. Please try a different PDF or use OCR software first.`
          );
        }

        // Try fallback conversion method
        logger.info("🔄 Attempting fallback conversion...");
        wordBuffer = await this.createFallbackWord(
          fileBuffer,
          filename,
          settings
        );
      }

      // Validate the output Word document
      if (wordBuffer.length < 1000) {
        logger.warn(
          `⚠️ Generated Word document is very small: ${wordBuffer.length} bytes`
        );

        // Try to create a better fallback
        logger.info("🔄 Creating enhanced fallback Word document...");
        wordBuffer = await this.createEnhancedFallbackWord(
          fileBuffer,
          filename,
          settings
        );
      }

      const conversionTime = Date.now() - startTime;

      logger.info(
        `✅ PDF to Word conversion completed: ${filename} in ${conversionTime}ms`
      );
      logger.info(
        `📊 Size: ${fileBuffer.length} bytes → ${wordBuffer.length} bytes`
      );

      return {
        buffer: wordBuffer,
        conversionTime,
        originalSize: fileBuffer.length,
        convertedSize: wordBuffer.length,
      };
    } catch (error) {
      logger.error(`❌ PDF to Word conversion failed for ${filename}:`, error);
      throw error;
    } finally {
      // Clean up temporary files
      await this.cleanupTempFiles([inputPath, outputDir]);
    }
  }

  private validatePdfFile(
    buffer: Buffer,
    filename: string
  ): { isValid: boolean; error?: string } {
    try {
      logger.info(`🔍 Enhanced PDF file validation for: ${filename}`);

      // Check minimum file size
      if (buffer.length < 1024) {
        return {
          isValid: false,
          error: "PDF file is too small and may be corrupted",
        };
      }

      // Check PDF signature
      const pdfSignature = buffer.slice(0, 5).toString("ascii");
      if (!pdfSignature.startsWith("%PDF-")) {
        return {
          isValid: false,
          error: "File does not appear to be a valid PDF - invalid signature",
        };
      }

      // Check for PDF trailer
      const bufferString = buffer.toString("binary");
      if (!bufferString.includes("%%EOF")) {
        return {
          isValid: false,
          error:
            "PDF file appears to be incomplete or corrupted - missing EOF marker",
        };
      }

      // Check for basic PDF structure
      if (!bufferString.includes("xref") || !bufferString.includes("trailer")) {
        return {
          isValid: false,
          error: "PDF file is missing essential structure elements",
        };
      }

      // Check for password protection
      if (
        bufferString.includes("/Encrypt") ||
        bufferString.includes("/U ") ||
        bufferString.includes("/O ")
      ) {
        return {
          isValid: false,
          error:
            "PDF file appears to be password protected. Please remove password protection before conversion.",
        };
      }

      logger.info(`✅ PDF file validation passed for: ${filename}`);
      return { isValid: true };
    } catch (error) {
      logger.error(`PDF file validation error for "${filename}":`, error);
      return {
        isValid: false,
        error: "Unable to validate PDF file - file may be corrupted",
      };
    }
  }

  private isPdfConversionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";
    const pdfConversionKeywords = [
      "password",
      "encrypted",
      "protected",
      "invalid pdf",
      "corrupted pdf",
      "cannot open pdf",
      "pdf error",
      "malformed pdf",
    ];

    return pdfConversionKeywords.some((keyword) =>
      errorMessage.includes(keyword)
    );
  }

  private async convertWithLibreOffice(
    inputPath: string,
    outputDir: string,
    settings: ConversionSettings,
    originalFilename: string
  ): Promise<Buffer> {
    const libreOfficePath = this.libreOfficeInfo!.path!;

    // Create LibreOffice user profile directory
    const profileDir = path.join(this.tempDir, `profile_${Date.now()}`);
    await fs.mkdir(profileDir, { recursive: true });

    // Determine output format based on settings
    const outputFormat = settings.outputFormat || "docx";

    // Build LibreOffice command for PDF to Word conversion with enhanced options
    let command = `"${libreOfficePath}" --headless --invisible --convert-to ${outputFormat}`;

    // Add format-specific options for better conversion
    if (outputFormat === "docx") {
      command += ":writer_pdf_import";
    }

    command += ` --outdir "${outputDir}" "${inputPath}"`;

    logger.info(`🔧 LibreOffice PDF to Word command: ${command}`);

    const execOptions = {
      timeout: config.conversionTimeout * 4, // Increased timeout for PDF processing
      maxBuffer: 1024 * 1024 * 200, // 200MB buffer for large PDFs
      cwd: this.tempDir,
      env: {
        ...process.env,
        // Enhanced environment setup for PDF processing
        HOME: profileDir,
        TMPDIR: this.tempDir,
        USER_PROFILE: profileDir,
        SAL_USE_VCLPLUGIN: "svp",
        SAL_DISABLE_OPENCL: "1",
        SAL_DISABLE_JAVA: "1",
        SAL_NO_FONT_LOOKUP: "1",
        SAL_DISABLE_ACCESSIBILITY: "1",
        DISPLAY: "",
        NO_AT_BRIDGE: "1",
        LIBREOFFICE_USER_PROFILE: profileDir,
        OOO_FORCE_DESKTOP: "headless",
        SAL_DISABLE_DEFAULTFONT: "1",
        // PDF-specific settings
        SAL_LOG: "-WARN-INFO",
        OOO_DISABLE_RECOVERY: "1",
      },
    };

    // Execute conversion with retry logic
    logger.info(`⏳ Starting LibreOffice PDF to Word conversion...`);

    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.info(`🔄 Conversion attempt ${attempts}/${maxAttempts}`);

        const { stdout, stderr } = await execAsync(command, execOptions);

        // Enhanced error analysis
        if (stderr) {
          logger.warn(`⚠️ LibreOffice stderr: ${stderr}`);

          // Check for specific PDF conversion errors
          if (this.isPdfLibreOfficeError(stderr)) {
            throw new Error(`PDF conversion error: ${stderr}`);
          }

          // Check for other fatal errors
          if (this.isFatalError(stderr)) {
            throw new Error(`LibreOffice conversion failed: ${stderr}`);
          }
        }

        if (stdout) {
          logger.info(`📝 LibreOffice stdout: ${stdout}`);
        }

        // Wait longer for PDF processing
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Try to find and read the Word output
        const wordBuffer = await this.findAndReadWordOutput(
          outputDir,
          inputPath,
          originalFilename,
          outputFormat
        );

        if (wordBuffer.length === 0) {
          throw new Error("LibreOffice generated empty Word file");
        }

        // Validate the generated Word document
        if (!this.isValidWordDocument(wordBuffer, outputFormat)) {
          throw new Error(
            "Generated Word document appears to be invalid or corrupted"
          );
        }

        logger.info(
          `✅ LibreOffice PDF to Word conversion successful: ${wordBuffer.length} bytes`
        );
        return wordBuffer;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`⚠️ Conversion attempt ${attempts} failed:`, error);

        if (attempts < maxAttempts) {
          logger.info(`🔄 Retrying conversion in 2 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("All conversion attempts failed");
  }

  private isPdfLibreOfficeError(stderr: string): boolean {
    const pdfErrors = [
      "pdf import",
      "pdf error",
      "cannot import pdf",
      "invalid pdf",
      "pdf format",
      "password protected",
      "encrypted pdf",
    ];

    const stderrLower = stderr.toLowerCase();
    return pdfErrors.some((error) => stderrLower.includes(error));
  }

  private isValidWordDocument(buffer: Buffer, format: string): boolean {
    try {
      if (format === "docx") {
        // DOCX files are ZIP archives - check for ZIP signature
        const zipSignature = buffer.slice(0, 4);
        const expectedZipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

        if (!zipSignature.equals(expectedZipSignature)) {
          return false;
        }

        // Check for DOCX-specific content
        const bufferString = buffer.toString(
          "binary",
          0,
          Math.min(2048, buffer.length)
        );
        return (
          bufferString.includes("word/") ||
          bufferString.includes("[Content_Types].xml")
        );
      } else if (format === "doc") {
        // DOC files have OLE2 signature
        const docSignature = buffer.slice(0, 8);
        const expectedDocSignature = Buffer.from([
          0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
        ]);
        return docSignature.equals(expectedDocSignature);
      }

      // For other formats, just check if it's not empty and has reasonable size
      return buffer.length > 100;
    } catch (error) {
      logger.warn("Error validating Word document:", error);
      return false;
    }
  }

  private async findAndReadWordOutput(
    outputDir: string,
    inputPath: string,
    originalFilename: string,
    outputFormat: string
  ): Promise<Buffer> {
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const originalBasename = path.basename(
      originalFilename,
      path.extname(originalFilename)
    );

    // Possible Word document names with correct extension
    const possibleWordNames = [
      `${inputBasename}.${outputFormat}`,
      `${originalBasename}.${outputFormat}`,
      `${sanitizeFilename(originalBasename)}.${outputFormat}`,
      `${inputBasename.toLowerCase()}.${outputFormat}`,
      `${originalBasename.toLowerCase()}.${outputFormat}`,
      `document.${outputFormat}`,
      `output.${outputFormat}`,
      `converted.${outputFormat}`,
    ];

    // List all files in the output directory
    let outputFiles: string[] = [];
    try {
      outputFiles = await fs.readdir(outputDir);
      logger.info(
        `📁 Files in output directory: ${
          outputFiles.length > 0 ? outputFiles.join(", ") : "NONE"
        }`
      );
    } catch (readDirError) {
      logger.error("❌ Could not read output directory:", readDirError);
      throw new Error(`Cannot access output directory: ${outputDir}`);
    }

    // Find Word files with the correct extension
    const wordFiles = outputFiles.filter((file) => {
      const ext = path.extname(file).toLowerCase().slice(1);
      return (
        ext === outputFormat ||
        (outputFormat === "docx" && ext === "doc") ||
        (outputFormat === "doc" && ext === "docx")
      );
    });

    if (wordFiles.length === 0) {
      logger.error(
        `❌ No ${outputFormat.toUpperCase()} files found in output directory. Available files: ${
          outputFiles.length > 0 ? outputFiles.join(", ") : "NONE"
        }`
      );
      throw new Error(
        `No ${outputFormat.toUpperCase()} files generated. LibreOffice may have failed to convert the PDF.`
      );
    }

    logger.info(
      `📄 Found ${wordFiles.length} Word file(s): ${wordFiles.join(", ")}`
    );

    // If there's exactly one Word file, use it
    if (wordFiles.length === 1) {
      const wordPath = path.join(outputDir, wordFiles[0]);
      logger.info(`📄 Using single Word file: ${wordFiles[0]}`);

      try {
        const wordBuffer = await fs.readFile(wordPath);

        if (wordBuffer.length === 0) {
          throw new Error(`Word file ${wordFiles[0]} is empty`);
        }

        return wordBuffer;
      } catch (readError) {
        logger.error(`❌ Could not read Word file: ${wordFiles[0]}`, readError);
        throw new Error(`Cannot read generated Word file: ${wordFiles[0]}`);
      }
    }

    // If multiple Word files, try to find the best match
    logger.info(`📄 Multiple Word files found, searching for best match...`);

    for (const expectedName of possibleWordNames) {
      if (wordFiles.includes(expectedName)) {
        const wordPath = path.join(outputDir, expectedName);
        logger.info(`📄 Found matching Word file: ${expectedName}`);

        try {
          const wordBuffer = await fs.readFile(wordPath);

          if (wordBuffer.length === 0) {
            logger.warn(
              `⚠️ Word file ${expectedName} is empty, trying next...`
            );
            continue;
          }

          return wordBuffer;
        } catch (readError) {
          logger.warn(
            `⚠️ Could not read expected Word file: ${expectedName}`,
            readError
          );
          continue;
        }
      }
    }

    // If no exact match, use the largest Word file
    let largestWord = wordFiles[0];
    let largestSize = 0;

    for (const wordFile of wordFiles) {
      try {
        const wordPath = path.join(outputDir, wordFile);
        const stats = await fs.stat(wordPath);
        if (stats.size > largestSize) {
          largestSize = stats.size;
          largestWord = wordFile;
        }
      } catch (statError) {
        logger.warn(`⚠️ Could not stat Word file: ${wordFile}`, statError);
      }
    }

    const wordPath = path.join(outputDir, largestWord);
    logger.info(
      `📄 Using largest Word file: ${largestWord} (${largestSize} bytes)`
    );

    try {
      const wordBuffer = await fs.readFile(wordPath);

      if (wordBuffer.length === 0) {
        throw new Error(`Word file ${largestWord} is empty`);
      }

      return wordBuffer;
    } catch (readError) {
      logger.error(`❌ Could not read Word file: ${largestWord}`, readError);
      throw new Error(`Cannot read any generated Word files`);
    }
  }

  private async createFallbackWord(
    fileBuffer: Buffer,
    filename: string,
    settings: ConversionSettings
  ): Promise<Buffer> {
    logger.info("🔄 Creating fallback Word document...");

    // Create a simple Word document with error message
    const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>PDF to Word Conversion Notice</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Original file: ${filename}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>LibreOffice conversion failed. The PDF may be password protected, corrupted, or contain complex formatting that cannot be converted.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>File size: ${fileBuffer.length} bytes</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Conversion date: ${new Date().toISOString()}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    return Buffer.from(docxContent, "utf-8");
  }

  private async createEnhancedFallbackWord(
    fileBuffer: Buffer,
    filename: string,
    settings: ConversionSettings
  ): Promise<Buffer> {
    logger.info("🔄 Creating enhanced fallback Word document...");

    try {
      // Import pdf-lib to try to extract some basic information
      const { PDFDocument } = await import("pdf-lib");

      let pdfInfo = {
        pageCount: 0,
        title: "",
        author: "",
        subject: "",
        hasText: false,
      };

      try {
        const pdfDoc = await PDFDocument.load(fileBuffer);
        pdfInfo.pageCount = pdfDoc.getPageCount();
        pdfInfo.title = pdfDoc.getTitle() || "";
        pdfInfo.author = pdfDoc.getAuthor() || "";
        pdfInfo.subject = pdfDoc.getSubject() || "";

        // Try to extract some text from the first page
        const pages = pdfDoc.getPages();
        if (pages.length > 0) {
          // This is a simplified check - pdf-lib doesn't have built-in text extraction
          pdfInfo.hasText = true;
        }
      } catch (pdfError) {
        logger.warn("Could not extract PDF information:", pdfError);
      }

      // Create a more comprehensive Word document
      const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>PDF to Word Conversion Report</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Original File Information:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• Filename: ${filename}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• File Size: ${(fileBuffer.length / 1024 / 1024).toFixed(
          2
        )} MB</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• Page Count: ${pdfInfo.pageCount || "Unknown"}</w:t>
      </w:r>
    </w:p>
    ${
      pdfInfo.title
        ? `<w:p><w:r><w:t>• Title: ${pdfInfo.title}</w:t></w:r></w:p>`
        : ""
    }
    ${
      pdfInfo.author
        ? `<w:p><w:r><w:t>• Author: ${pdfInfo.author}</w:t></w:r></w:p>`
        : ""
    }
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Conversion Status:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:color w:val="FF0000"/>
        </w:rPr>
        <w:t>❌ Automatic conversion failed</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Possible Reasons:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• PDF is password protected or encrypted</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• PDF contains only scanned images (requires OCR)</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• PDF has complex formatting or non-standard structure</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>• PDF file is corrupted or damaged</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Recommended Solutions:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>1. If password protected: Remove password protection first</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>2. If scanned: Use OCR software like Adobe Acrobat</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>3. Try opening the PDF in different software to verify it's not corrupted</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>4. For complex PDFs: Consider manual copy-paste of text content</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:sz w:val="18"/>
          <w:color w:val="808080"/>
        </w:rPr>
        <w:t>Generated: ${new Date().toLocaleString()}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

      // Create a proper DOCX structure
      const JSZip = await import("jszip");
      const zip = new JSZip.default();

      // Add required DOCX files
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      );

      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      );

      zip.file(
        "word/_rels/document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
      );

      zip.file("word/document.xml", docxContent);

      const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });
      logger.info(
        `✅ Enhanced fallback Word document created: ${docxBuffer.length} bytes`
      );

      return docxBuffer;
    } catch (error) {
      logger.error("Failed to create enhanced fallback Word document:", error);
      // Fall back to simple text document
      return this.createFallbackWord(fileBuffer, filename, settings);
    }
  }

  private isFatalError(stderr: string): boolean {
    const fatalErrors = [
      "Fatal Error",
      "Segmentation fault",
      "core dumped",
      "Cannot open file",
      "Permission denied",
      "No such file or directory",
      "Invalid file format",
      "failed to load",
      "Error:",
      "Exception:",
      "Abort",
      "Crash",
    ];

    const stderrLower = stderr.toLowerCase();
    return fatalErrors.some((error) =>
      stderrLower.includes(error.toLowerCase())
    );
  }

  private async cleanupTempFiles(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await fs.rm(filePath, { recursive: true, force: true });
        } else {
          await fs.unlink(filePath);
        }
        logger.debug(`🧹 Cleaned up: ${filePath}`);
      } catch (error) {
        logger.debug(`⚠️ Cleanup warning for ${filePath}:`, error);
      }
    }
  }
}

export default new PdfToWordService();
