import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../utils/logger.js";
import { config } from "../config/environment.js";
import {
  ConversionOptions,
  ConversionResult,
  ConversionSettings,
} from "../types/index.js";
import { generateTempFilename, sanitizeFilename } from "../utils/fileUtils.js";

const execAsync = promisify(exec);

interface LibreOfficeInfo {
  isInstalled: boolean;
  version?: string;
  path?: string;
  error?: string;
}

class ConvertService {
  private readonly tempDir: string;
  private libreOfficeInfo: LibreOfficeInfo | null = null;

  constructor() {
    this.tempDir = config.tempDir;
    this.ensureTempDir();
    this.checkLibreOffice();
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
      logger.info("🔍 Checking LibreOffice installation...");

      // Try different common LibreOffice command names and paths
      const commands = [
        "libreoffice",
        "soffice",
        "/usr/bin/libreoffice",
        "/usr/local/bin/libreoffice",
        "/opt/libreoffice/program/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        // Windows paths
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
            logger.info(`✅ LibreOffice found: ${stdout.trim()}`);
            logger.info(`📍 LibreOffice path: ${cmd}`);

            // Test basic conversion capability
            await this.testLibreOfficeConversion(cmd);
            return;
          }
        } catch (cmdError) {
          logger.debug(`❌ Command failed: ${cmd} - ${cmdError}`);
          continue;
        }
      }

      // If we get here, LibreOffice wasn't found
      this.libreOfficeInfo = {
        isInstalled: false,
        error: "LibreOffice not found in common locations",
      };

      logger.error("❌ LibreOffice not found. Install instructions:");
      logger.error(
        "📦 Ubuntu/Debian: sudo apt-get update && sudo apt-get install libreoffice"
      );
      logger.error("📦 CentOS/RHEL: sudo yum install libreoffice");
      logger.error("📦 Fedora: sudo dnf install libreoffice");
      logger.error("📦 macOS: brew install --cask libreoffice");
      logger.error(
        "📦 Windows: Download from https://www.libreoffice.org/download/"
      );
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

  private async testLibreOfficeConversion(
    libreOfficePath: string
  ): Promise<void> {
    try {
      logger.info("🧪 Testing LibreOffice conversion capability...");

      // Create a simple test document
      const testDir = path.join(this.tempDir, "test_conversion");
      await fs.mkdir(testDir, { recursive: true });

      const testDocContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Document</title></head>
        <body><h1>LibreOffice Test</h1><p>This is a test conversion.</p></body>
        </html>
      `;

      const testInputPath = path.join(testDir, "test.html");
      const testOutputDir = path.join(testDir, "output");

      await fs.mkdir(testOutputDir, { recursive: true });
      await fs.writeFile(testInputPath, testDocContent);

      // Test conversion with simple command
      const testCommand = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${testOutputDir}" "${testInputPath}"`;

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

      // Check if PDF was created
      const outputFiles = await fs.readdir(testOutputDir);
      const pdfFiles = outputFiles.filter((f) => f.endsWith(".pdf"));

      if (pdfFiles.length > 0) {
        logger.info("✅ LibreOffice conversion test successful");
      } else {
        logger.warn("⚠️ LibreOffice test conversion failed - no PDF generated");
        logger.warn(`Test stdout: ${stdout}`);
        logger.warn(`Test stderr: ${stderr}`);
      }

      // Cleanup test files
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (testError) {
      logger.warn("⚠️ LibreOffice test conversion failed:", testError);
      // Don't fail the entire check - LibreOffice might still work for real files
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

  public async convertWordToPdf(
    fileBuffer: Buffer,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const { filename, settings } = options;

    logger.info(
      `🚀 Starting conversion: ${filename} (${fileBuffer.length} bytes)`
    );
    logger.info(`⚙️ Settings: ${JSON.stringify(settings)}`);

    // Check LibreOffice availability
    if (!this.libreOfficeInfo?.isInstalled) {
      const errorMessage = `LibreOffice is required for Word to PDF conversion. ${
        this.libreOfficeInfo?.error || "LibreOffice not found."
      }`;
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Validate file buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Invalid file buffer - file appears to be empty");
    }

    // Check if file might be corrupted
    if (fileBuffer.length < 100) {
      throw new Error("File appears to be too small or corrupted");
    }

    // Validate Word document structure
    if (!this.isValidWordDocument(fileBuffer, filename)) {
      throw new Error("File does not appear to be a valid Word document");
    }

    // Generate unique temporary filenames
    const tempId = Math.random().toString(36).substr(2, 9);
    const inputExtension = path.extname(filename).toLowerCase();
    const sanitizedBasename = this.sanitizeForLibreOffice(
      path.basename(filename, inputExtension)
    );
    const inputPath = path.join(
      this.tempDir,
      `${sanitizedBasename}_${tempId}${inputExtension}`
    );
    const outputDir = path.join(this.tempDir, `output_${tempId}`);

    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Write input file to temp location
      await fs.writeFile(inputPath, fileBuffer);
      logger.info(
        `📁 Input file written: ${inputPath} (${fileBuffer.length} bytes)`
      );

      // Verify the file was written correctly
      const writtenStats = await fs.stat(inputPath);
      if (writtenStats.size !== fileBuffer.length) {
        throw new Error(
          `File write verification failed: expected ${fileBuffer.length} bytes, got ${writtenStats.size} bytes`
        );
      }

      // Try LibreOffice conversion
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await this.convertWithLibreOffice(
          inputPath,
          outputDir,
          settings,
          filename
        );
      } catch (libreOfficeError) {
        logger.error(`❌ LibreOffice conversion failed: ${libreOfficeError}`);

        // Try fallback conversion method
        logger.info("🔄 Attempting fallback conversion...");
        pdfBuffer = await this.createFallbackPdf(
          fileBuffer,
          filename,
          settings
        );
      }

      // Apply post-processing (password protection, watermarks, etc.)
      if (
        settings.passwordProtect ||
        settings.watermark ||
        settings.stripMetadata
      ) {
        logger.info("🔧 Applying post-processing...");
        pdfBuffer = await this.postProcessPdf(pdfBuffer, settings);
      }

      const conversionTime = Date.now() - startTime;

      logger.info(
        `✅ Conversion completed: ${filename} in ${conversionTime}ms`
      );
      logger.info(
        `📊 Size: ${fileBuffer.length} bytes → ${pdfBuffer.length} bytes`
      );

      return {
        buffer: pdfBuffer,
        conversionTime,
        originalSize: fileBuffer.length,
        convertedSize: pdfBuffer.length,
      };
    } catch (error) {
      logger.error(`❌ Conversion failed for ${filename}:`, error);
      throw error;
    } finally {
      // Clean up temporary files
      await this.cleanupTempFiles([inputPath, outputDir]);
    }
  }

  private isValidWordDocument(buffer: Buffer, filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();

    try {
      if (extension === ".docx") {
        // DOCX files are ZIP archives - check for ZIP signature
        const zipSignature = buffer.slice(0, 4);
        const isZip =
          zipSignature[0] === 0x50 &&
          zipSignature[1] === 0x4b &&
          (zipSignature[2] === 0x03 || zipSignature[2] === 0x05) &&
          (zipSignature[3] === 0x04 || zipSignature[3] === 0x06);

        if (!isZip) {
          logger.warn(
            `⚠️ DOCX file ${filename} does not have valid ZIP signature`
          );
          return false;
        }

        // Check for DOCX-specific content
        const bufferString = buffer.toString("binary");
        const hasWordContent =
          bufferString.includes("word/") ||
          bufferString.includes(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          );

        if (!hasWordContent) {
          logger.warn(
            `⚠️ DOCX file ${filename} does not contain Word document structure`
          );
          return false;
        }

        return true;
      } else if (extension === ".doc") {
        // DOC files are OLE compound documents - check for OLE signature
        const oleSignature = buffer.slice(0, 8);
        const isOle =
          oleSignature[0] === 0xd0 &&
          oleSignature[1] === 0xcf &&
          oleSignature[2] === 0x11 &&
          oleSignature[3] === 0xe0 &&
          oleSignature[4] === 0xa1 &&
          oleSignature[5] === 0xb1 &&
          oleSignature[6] === 0x1a &&
          oleSignature[7] === 0xe1;

        if (!isOle) {
          logger.warn(
            `⚠️ DOC file ${filename} does not have valid OLE signature`
          );
          return false;
        }

        return true;
      }

      // For other extensions, assume valid
      return true;
    } catch (error) {
      logger.warn(`⚠️ Could not validate Word document ${filename}:`, error);
      return true; // Assume valid if we can't check
    }
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

    // Build LibreOffice command - FIXED: Simplified without complex filter options
    let command = `"${libreOfficePath}" --headless --invisible --nodefault --nolockcheck --nologo --norestore`;

    // Use simple conversion without complex filter options to avoid shell escaping issues
    command += ` --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    logger.info(`🔧 LibreOffice command: ${command}`);

    const execOptions = {
      timeout: config.conversionTimeout * 3, // 90 seconds
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      cwd: this.tempDir,
      env: {
        ...process.env,
        // Enhanced environment setup
        HOME: profileDir,
        TMPDIR: this.tempDir,
        USER_PROFILE: profileDir,
        USER: process.env.USER || "doclair",
        // LibreOffice specific settings
        SAL_USE_VCLPLUGIN: "svp",
        SAL_DISABLE_OPENCL: "1",
        SAL_DISABLE_JAVA: "1",
        SAL_NO_FONT_LOOKUP: "1",
        SAL_DISABLE_ACCESSIBILITY: "1",
        // Prevent GUI and user interaction
        DISPLAY: "",
        NO_AT_BRIDGE: "1",
        // Set user profile
        LIBREOFFICE_USER_PROFILE: profileDir,
        // Additional stability settings
        OOO_FORCE_DESKTOP: "headless",
        SAL_DISABLE_DEFAULTFONT: "1",
        // Document-specific settings
        SAL_DISABLE_CRASHDUMP: "1",
        SAL_LOG: "-WARN+INFO",
      },
    };

    // Execute conversion
    logger.info(`⏳ Starting LibreOffice conversion...`);
    const { stdout, stderr } = await execAsync(command, execOptions);

    // Log output for debugging
    if (stdout) {
      logger.info(`📝 LibreOffice stdout: ${stdout}`);
    }

    if (stderr) {
      logger.warn(`⚠️ LibreOffice stderr: ${stderr}`);

      // Check for fatal errors
      if (this.isFatalError(stderr)) {
        throw new Error(`LibreOffice conversion failed: ${stderr}`);
      }
    }

    // Wait for file system to sync
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Try to find and read the PDF output
    const pdfBuffer = await this.findAndReadPdfOutput(
      outputDir,
      inputPath,
      originalFilename
    );

    if (pdfBuffer.length === 0) {
      throw new Error("LibreOffice generated empty PDF file");
    }

    // Validate the generated PDF
    if (!this.isValidPdf(pdfBuffer)) {
      throw new Error("LibreOffice generated invalid PDF file");
    }

    logger.info(
      `✅ LibreOffice conversion successful: ${pdfBuffer.length} bytes`
    );
    return pdfBuffer;
  }

  private isValidPdf(buffer: Buffer): boolean {
    try {
      // Check PDF magic number
      const pdfHeader = buffer.slice(0, 4).toString();
      if (pdfHeader !== "%PDF") {
        return false;
      }

      // Check for PDF trailer
      const bufferString = buffer.toString("binary");
      const hasTrailer =
        bufferString.includes("%%EOF") || bufferString.includes("trailer");

      return hasTrailer;
    } catch (error) {
      logger.warn("⚠️ Could not validate PDF:", error);
      return true; // Assume valid if we can't check
    }
  }

  private async findAndReadPdfOutput(
    outputDir: string,
    inputPath: string,
    originalFilename: string
  ): Promise<Buffer> {
    // Enhanced PDF file detection
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const originalBasename = path.basename(
      originalFilename,
      path.extname(originalFilename)
    );
    const sanitizedOriginal = this.sanitizeForLibreOffice(originalBasename);

    // More comprehensive list of possible PDF names
    const possiblePdfNames = [
      `${inputBasename}.pdf`,
      `${originalBasename}.pdf`,
      `${sanitizedOriginal}.pdf`,
      `${inputBasename.toLowerCase()}.pdf`,
      `${originalBasename.toLowerCase()}.pdf`,
      // Sometimes LibreOffice creates generic names
      "document.pdf",
      "output.pdf",
      "converted.pdf",
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

    // Find PDF files
    const pdfFiles = outputFiles.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      logger.error(
        `❌ No PDF files found in output directory. Available files: ${
          outputFiles.length > 0 ? outputFiles.join(", ") : "NONE"
        }`
      );
      throw new Error(
        "No PDF files generated. LibreOffice may have failed silently."
      );
    }

    logger.info(
      `📄 Found ${pdfFiles.length} PDF file(s): ${pdfFiles.join(", ")}`
    );

    // If there's exactly one PDF file, use it
    if (pdfFiles.length === 1) {
      const pdfPath = path.join(outputDir, pdfFiles[0]);
      logger.info(`📄 Using single PDF file: ${pdfFiles[0]}`);

      try {
        const pdfBuffer = await fs.readFile(pdfPath);

        if (pdfBuffer.length === 0) {
          throw new Error(`PDF file ${pdfFiles[0]} is empty`);
        }

        return pdfBuffer;
      } catch (readError) {
        logger.error(`❌ Could not read PDF file: ${pdfFiles[0]}`, readError);
        throw new Error(`Cannot read generated PDF file: ${pdfFiles[0]}`);
      }
    }

    // If multiple PDF files, try to find the best match
    logger.info(`📄 Multiple PDF files found, searching for best match...`);

    for (const expectedName of possiblePdfNames) {
      if (pdfFiles.includes(expectedName)) {
        const pdfPath = path.join(outputDir, expectedName);
        logger.info(`📄 Found matching PDF: ${expectedName}`);

        try {
          const pdfBuffer = await fs.readFile(pdfPath);

          if (pdfBuffer.length === 0) {
            logger.warn(`⚠️ PDF file ${expectedName} is empty, trying next...`);
            continue;
          }

          return pdfBuffer;
        } catch (readError) {
          logger.warn(
            `⚠️ Could not read expected PDF file: ${expectedName}`,
            readError
          );
          continue;
        }
      }
    }

    // If no exact match, use the largest PDF file (most likely to be the correct one)
    let largestPdf = pdfFiles[0];
    let largestSize = 0;

    for (const pdfFile of pdfFiles) {
      try {
        const pdfPath = path.join(outputDir, pdfFile);
        const stats = await fs.stat(pdfPath);
        if (stats.size > largestSize) {
          largestSize = stats.size;
          largestPdf = pdfFile;
        }
      } catch (statError) {
        logger.warn(`⚠️ Could not stat PDF file: ${pdfFile}`, statError);
      }
    }

    const pdfPath = path.join(outputDir, largestPdf);
    logger.info(
      `📄 Using largest PDF file: ${largestPdf} (${largestSize} bytes)`
    );

    try {
      const pdfBuffer = await fs.readFile(pdfPath);

      if (pdfBuffer.length === 0) {
        throw new Error(`PDF file ${largestPdf} is empty`);
      }

      return pdfBuffer;
    } catch (readError) {
      logger.error(`❌ Could not read PDF file: ${largestPdf}`, readError);
      throw new Error(`Cannot read any generated PDF files`);
    }
  }

  private async postProcessPdf(
    pdfBuffer: Buffer,
    settings: ConversionSettings
  ): Promise<Buffer> {
    logger.info("🔧 Starting PDF post-processing...");

    try {
      // Import pdf-lib dynamically
      const { PDFDocument, rgb, StandardFonts, degrees } = await import(
        "pdf-lib"
      );

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();

      logger.info(`📄 Processing ${pages.length} pages`);

      // Add watermark if requested
      if (settings.watermark && settings.watermarkText) {
        logger.info(`💧 Adding watermark: "${settings.watermarkText}"`);
        await this.addWatermarkToPdf(pdfDoc, pages, settings.watermarkText);
      }

      // Strip metadata if requested
      if (settings.stripMetadata) {
        logger.info("🧹 Stripping metadata...");
        this.stripPdfMetadata(pdfDoc);
      }

      // Save the modified PDF
      let finalPdfBytes: Uint8Array;

      if (settings.passwordProtect && settings.password) {
        logger.info("🔒 Adding password protection...");

        // Note: pdf-lib doesn't support password protection directly
        // We'll add a notice about this limitation
        logger.warn(
          "⚠️ Password protection not fully implemented - pdf-lib limitation"
        );

        // For now, save without password but add a notice page
        const noticePage = pdfDoc.insertPage(0);
        const { width, height } = noticePage.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        noticePage.drawText("PASSWORD PROTECTION REQUESTED", {
          x: 50,
          y: height - 100,
          size: 16,
          font,
          color: rgb(0.8, 0, 0),
        });

        noticePage.drawText(
          "Note: This PDF was requested to be password protected.",
          {
            x: 50,
            y: height - 130,
            size: 12,
            font,
            color: rgb(0.5, 0, 0),
          }
        );

        noticePage.drawText(
          "Password protection requires additional tools beyond pdf-lib.",
          {
            x: 50,
            y: height - 150,
            size: 12,
            font,
            color: rgb(0.5, 0, 0),
          }
        );

        finalPdfBytes = await pdfDoc.save();
      } else {
        finalPdfBytes = await pdfDoc.save();
      }

      logger.info(
        `✅ Post-processing completed: ${pdfBuffer.length} → ${finalPdfBytes.length} bytes`
      );
      return Buffer.from(finalPdfBytes);
    } catch (error) {
      logger.error("❌ PDF post-processing failed:", error);
      logger.warn("⚠️ Returning original PDF without post-processing");
      return pdfBuffer;
    }
  }

  private async addWatermarkToPdf(
    pdfDoc: any,
    pages: any[],
    watermarkText: string
  ): Promise<void> {
    const { rgb, StandardFonts, degrees } = await import("pdf-lib");
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Calculate font size based on page size
      const fontSize = Math.min(width, height) / 15;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

      // Add watermark diagonally across the page
      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.3,
        rotate: degrees(45),
      });

      logger.debug(`💧 Added watermark to page ${i + 1}`);
    }
  }

  private stripPdfMetadata(pdfDoc: any): void {
    try {
      // Remove common metadata fields
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("");
      pdfDoc.setCreator("");

      logger.info("🧹 PDF metadata stripped");
    } catch (error) {
      logger.warn("⚠️ Could not strip all metadata:", error);
    }
  }

  private async createFallbackPdf(
    fileBuffer: Buffer,
    filename: string,
    settings: ConversionSettings
  ): Promise<Buffer> {
    logger.info("🔄 Creating fallback PDF...");

    // Import pdf-lib dynamically
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Add title
    page.drawText(`Document: ${filename}`, {
      x: 50,
      y: height - 50,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    // Add conversion notice
    page.drawText("This document was converted using a fallback method.", {
      x: 50,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(
      "LibreOffice conversion failed. Please check the original document.",
      {
        x: 50,
        y: height - 100,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Add file info
    page.drawText(`Original file size: ${fileBuffer.length} bytes`, {
      x: 50,
      y: height - 130,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Conversion date: ${new Date().toISOString()}`, {
      x: 50,
      y: height - 150,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Add settings info
    page.drawText(
      `Settings: Quality=${settings.quality}, Size=${settings.pageSize}`,
      {
        x: 50,
        y: height - 170,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      }
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private sanitizeForLibreOffice(filename: string): string {
    return filename
      .replace(/[^\w\s\-_.]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "");
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
      "Corrupted file",
      "failed to load",
      "Error:",
      "Exception:",
      "Abort",
      "Crash",
      "source file could not be loaded",
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

export default new ConvertService();
