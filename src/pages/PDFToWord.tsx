import React, { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  FileText,
  Upload,
  Download,
  Settings,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  Layers,
  Clock,
  FileCheck,
  Trash2,
  RotateCcw,
  Sparkles,
  Brain,
  Target,
  Cpu,
} from "lucide-react";

interface ConversionSettings {
  outputFormat: "docx" | "doc" | "rtf" | "odt";
  ocrEnabled: boolean;
  preserveLayout: boolean;
  extractImages: boolean;
  quality: "high" | "medium" | "fast";
  language: string;
}

interface ConversionResult {
  filename: string;
  originalSize: number;
  convertedSize: number;
  conversionTime: number;
  downloadUrl: string;
}

const PDFToWord: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>({
    outputFormat: "docx",
    ocrEnabled: true,
    preserveLayout: true,
    extractImages: true,
    quality: "high",
    language: "eng",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file only.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      setError("File size must be less than 100MB.");
      return;
    }

    setUploadedFile(file);
    setError(null);
    setConversionResult(null);
  }, []);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const convertPDFToWord = async () => {
    if (!uploadedFile) return;

    setIsConverting(true);
    setConversionProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("settings", JSON.stringify(settings));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setConversionProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await fetch("/api/convert/pdf-to-word", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setConversionProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      // Get conversion metadata from headers
      const conversionTime = parseInt(
        response.headers.get("X-Conversion-Time") || "0"
      );
      const originalSize = parseInt(
        response.headers.get("X-Original-Size") || "0"
      );
      const convertedSize = parseInt(
        response.headers.get("X-Converted-Size") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `converted_${uploadedFile.name.replace(
          ".pdf",
          `.${settings.outputFormat}`
        )}`;

      setConversionResult({
        filename,
        originalSize,
        convertedSize,
        conversionTime,
        downloadUrl,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const downloadFile = () => {
    if (!conversionResult) return;

    const link = document.createElement("a");
    link.href = conversionResult.downloadUrl;
    link.download = conversionResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetConverter = () => {
    setUploadedFile(null);
    setConversionResult(null);
    setError(null);
    setConversionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <Helmet>
        <title>PDF to Word Converter - Free Online Tool | Doclair</title>
        <meta
          name="description"
          content="Convert PDF files to editable Word documents (DOCX, DOC) with OCR support. Maintain formatting, extract images, and preserve layout structure."
        />
        <meta
          name="keywords"
          content="PDF to Word, PDF to DOCX, PDF converter, OCR, editable documents, document conversion"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/pdf-to-word"
        />
        <meta
          property="og:title"
          content="PDF to Word Converter - Free Online Tool"
        />
        <meta
          property="og:description"
          content="Convert PDF files to editable Word documents with advanced OCR technology and layout preservation."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                PDF to{" "}
                <span className="cursive-text text-5xl text-blue-600">
                  Word
                </span>{" "}
                Converter
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Convert PDF files to editable Word documents with{" "}
                <span className="cursive-text text-purple-600 text-xl">
                  advanced OCR
                </span>{" "}
                technology. Preserve formatting, extract images, and maintain
                document structure.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  OCR Technology
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Layout Preservation
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  High Accuracy
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Fast Processing
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Conversion Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* File Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Upload PDF File
                </h3>

                {!uploadedFile ? (
                  <div
                    ref={dropZoneRef}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <FileText className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your PDF here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports PDF files up to 100MB
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose PDF File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {uploadedFile.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatFileSize(uploadedFile.size)} • PDF Document
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={resetConverter}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Conversion Progress */}
                    {isConverting && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="font-semibold text-blue-900">
                            Converting PDF to Word...
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${conversionProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-blue-700">
                          {conversionProgress < 30 &&
                            "Analyzing PDF structure..."}
                          {conversionProgress >= 30 &&
                            conversionProgress < 60 &&
                            "Extracting text and images..."}
                          {conversionProgress >= 60 &&
                            conversionProgress < 90 &&
                            "Applying OCR technology..."}
                          {conversionProgress >= 90 &&
                            "Finalizing Word document..."}
                        </div>
                      </div>
                    )}

                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-semibold text-red-900">
                              Conversion Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conversion Result */}
                    {conversionResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Conversion Successful!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">
                                  Original Size:
                                </span>{" "}
                                {formatFileSize(conversionResult.originalSize)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Converted Size:
                                </span>{" "}
                                {formatFileSize(conversionResult.convertedSize)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(conversionResult.conversionTime)}
                              </div>
                              <div>
                                <span className="font-medium">Format:</span>{" "}
                                {settings.outputFormat.toUpperCase()}
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Word Document
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Convert Button */}
                    {!isConverting && !conversionResult && (
                      <button
                        onClick={convertPDFToWord}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Zap className="h-6 w-6" />
                        Convert to Word Document
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Conversion Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Conversion Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Output Format */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Output Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            value: "docx",
                            label: "DOCX",
                            desc: "Modern Word format",
                          },
                          {
                            value: "doc",
                            label: "DOC",
                            desc: "Legacy Word format",
                          },
                          {
                            value: "rtf",
                            label: "RTF",
                            desc: "Rich Text Format",
                          },
                          {
                            value: "odt",
                            label: "ODT",
                            desc: "OpenDocument Text",
                          },
                        ].map((format) => (
                          <button
                            key={format.value}
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                outputFormat: format.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              settings.outputFormat === format.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold">{format.label}</div>
                            <div className="text-xs opacity-75">
                              {format.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Settings */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Conversion Quality
                      </label>
                      <select
                        value={settings.quality}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            quality: e.target.value as any,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="high">High Quality (Slower)</option>
                        <option value="medium">
                          Medium Quality (Balanced)
                        </option>
                        <option value="fast">
                          Fast Processing (Lower Quality)
                        </option>
                      </select>
                    </div>

                    {/* OCR Language */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        OCR Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            language: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="eng">English</option>
                        <option value="spa">Spanish</option>
                        <option value="fra">French</option>
                        <option value="deu">German</option>
                        <option value="ita">Italian</option>
                        <option value="por">Portuguese</option>
                        <option value="rus">Russian</option>
                        <option value="chi_sim">Chinese (Simplified)</option>
                        <option value="jpn">Japanese</option>
                        <option value="kor">Korean</option>
                      </select>
                    </div>

                    {/* Advanced Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Advanced Options
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.ocrEnabled}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                ocrEnabled: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Enable OCR for scanned PDFs
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.preserveLayout}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                preserveLayout: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Preserve original layout
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.extractImages}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                extractImages: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Extract and include images
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Advanced OCR
                      </div>
                      <div className="text-xs text-gray-600">
                        Extract text from scanned PDFs with high accuracy
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Layout Preservation
                      </div>
                      <div className="text-xs text-gray-600">
                        Maintain original formatting and structure
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Image Extraction
                      </div>
                      <div className="text-xs text-gray-600">
                        Preserve images, charts, and graphics
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Multiple Formats
                      </div>
                      <div className="text-xs text-gray-600">
                        Export to DOCX, DOC, RTF, or ODT
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your PDF file (up to 100MB)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose output format and settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI analyzes and converts your document
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your editable Word document
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 mb-2">
                      Secure & Private
                    </h4>
                    <p className="text-green-700 text-sm">
                      Your files are processed securely on our servers and
                      automatically deleted after conversion. We never store or
                      share your documents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      98.7%
                    </div>
                    <div className="text-xs text-blue-700">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">18s</div>
                    <div className="text-xs text-blue-700">Avg. Processing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      850K+
                    </div>
                    <div className="text-xs text-blue-700">Files Converted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">34%</div>
                    <div className="text-xs text-blue-700">OCR Usage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PDFToWord;
