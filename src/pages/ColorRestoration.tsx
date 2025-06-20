import React, { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  Image as ImageIcon,
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
  Palette,
  Sliders,
  Wand2,
  Droplet,
  Thermometer,
  Contrast,
  Brush,
  Sunrise,
  Sunset,
  RefreshCw,
  Loader,
  Scissors,
} from "lucide-react";

interface ColorRestoreOptions {
  restoreMode: "auto" | "vibrant" | "natural" | "vintage" | "custom";
  intensity: number; // 1-100
  saturation: number; // -100 to 100
  contrast: number; // -100 to 100
  temperature: number; // -100 to 100 (cool to warm)
  removeYellowing: boolean;
  correctColorCast: boolean;
  enhanceDetails: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface ColorRestoreResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  enhancements: string[];
  restorationScore: number;
}

const ColorRestoration: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [restoreResult, setRestoreResult] = useState<ColorRestoreResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<ColorRestoreOptions>({
    restoreMode: "auto",
    intensity: 75,
    saturation: 20,
    contrast: 10,
    temperature: 5,
    removeYellowing: true,
    correctColorCast: true,
    enhanceDetails: true,
    outputFormat: "jpg",
    quality: 95,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/tiff",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, WebP, GIF, TIFF).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      setError("File size must be less than 50MB.");
      return;
    }

    setUploadedFile(file);
    setError(null);
    setRestoreResult(null);
    setProcessedPreview(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFilePreview(imageUrl);
    };
    reader.readAsDataURL(file);
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

  const restoreColors = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("restoreOptions", JSON.stringify(restoreOptions));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch("/api/tools/image/restore-colors", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Color restoration failed");
      }

      // Get processing metadata from headers
      const processingTime = parseInt(
        response.headers.get("X-Processing-Time") || "0"
      );
      const originalDimensions = response.headers
        .get("X-Original-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const processedDimensions = response.headers
        .get("X-Processed-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const enhancements =
        response.headers.get("X-Enhancements")?.split(", ") || [];
      const restorationScore = parseFloat(
        response.headers.get("X-Restoration-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `colorized_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${restoreOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setRestoreResult({
        filename,
        originalDimensions: {
          width: originalDimensions[0],
          height: originalDimensions[1],
        },
        processedDimensions: {
          width: processedDimensions[0],
          height: processedDimensions[1],
        },
        processingTime,
        downloadUrl,
        enhancements,
        restorationScore,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const downloadFile = () => {
    if (!restoreResult) return;

    const link = document.createElement("a");
    link.href = restoreResult.downloadUrl;
    link.download = restoreResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setRestoreResult(null);
    setError(null);
    setProcessingProgress(0);
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

  // Presets for common color restoration scenarios
  const presets = [
    {
      name: "Faded Photo",
      description: "Restore natural colors",
      settings: {
        restoreMode: "natural",
        intensity: 80,
        saturation: 30,
        contrast: 15,
        temperature: 0,
        removeYellowing: true,
        correctColorCast: true,
      },
    },
    {
      name: "Vibrant Boost",
      description: "Enhance with vivid colors",
      settings: {
        restoreMode: "vibrant",
        intensity: 85,
        saturation: 50,
        contrast: 20,
        temperature: 10,
        removeYellowing: true,
        correctColorCast: true,
      },
    },
    {
      name: "Yellowed Photo",
      description: "Fix yellow discoloration",
      settings: {
        restoreMode: "natural",
        intensity: 70,
        saturation: 20,
        contrast: 10,
        temperature: -10,
        removeYellowing: true,
        correctColorCast: true,
      },
    },
    {
      name: "Vintage Look",
      description: "Restore with vintage feel",
      settings: {
        restoreMode: "vintage",
        intensity: 75,
        saturation: 10,
        contrast: 15,
        temperature: 15,
        removeYellowing: false,
        correctColorCast: true,
      },
    },
    {
      name: "Subtle Fix",
      description: "Minimal correction",
      settings: {
        restoreMode: "natural",
        intensity: 50,
        saturation: 10,
        contrast: 5,
        temperature: 0,
        removeYellowing: true,
        correctColorCast: true,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setRestoreOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  return (
    <>
      <Helmet>
        <title>Color Restoration - Revive Faded Photos | Doclair</title>
        <meta
          name="description"
          content="Restore faded colors in old photographs. Bring back vibrant, natural colors to discolored and aged images with advanced color restoration technology."
        />
        <meta
          name="keywords"
          content="color restoration, restore faded photos, fix discolored images, photo color correction, old photo restoration, vintage photo color"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/color-restoration"
        />
        <meta
          property="og:title"
          content="Color Restoration - Revive Faded Photos | Doclair"
        />
        <meta
          property="og:description"
          content="Restore faded colors in old photographs with advanced color restoration technology. Bring back vibrant, natural colors to discolored and aged images."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl mb-6 shadow-2xl">
                <Palette className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Color{" "}
                <span className="cursive-text text-5xl text-pink-600">
                  Restoration
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Restore faded colors in old photographs with{" "}
                <span className="cursive-text text-orange-600 text-xl">
                  advanced algorithms
                </span>
                . Bring back vibrant, natural colors to discolored and aged
                images.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Revival
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Yellowing Removal
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Color Balance
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
            {/* Main Processing Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* File Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Upload Faded Photo
                </h3>

                {!uploadedFile ? (
                  <div
                    ref={dropZoneRef}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-pink-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-pink-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-pink-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your faded photo here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports JPG, PNG, WebP, GIF, TIFF files up to 50MB
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-pink-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {uploadedFile.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatFileSize(uploadedFile.size)} •{" "}
                            {uploadedFile.type}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={resetProcessor}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Image Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Preview
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-2 text-center">
                            Original (Faded)
                          </div>
                          {filePreview && (
                            <img
                              src={filePreview}
                              alt="Original"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-2 text-center">
                            Restored (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Restored"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                Restored preview will appear here
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-pink-600 border-t-transparent"></div>
                          <span className="font-semibold text-pink-900">
                            Restoring colors...
                          </span>
                        </div>
                        <div className="w-full bg-pink-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-pink-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-pink-700">
                          {processingProgress < 30 &&
                            "Analyzing color patterns..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Restoring color balance..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Enhancing color vibrancy..."}
                          {processingProgress >= 90 &&
                            "Finalizing color restoration..."}
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
                              Color Restoration Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Restoration Result */}
                    {restoreResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Color Restoration Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {restoreResult.processedDimensions.width}×
                                {restoreResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(restoreResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Restoration Score:
                                </span>{" "}
                                {restoreResult.restorationScore.toFixed(1)}/10
                              </div>
                              <div>
                                <span className="font-medium">Mode:</span>{" "}
                                {restoreOptions.restoreMode
                                  .charAt(0)
                                  .toUpperCase() +
                                  restoreOptions.restoreMode.slice(1)}
                              </div>
                            </div>
                            {restoreResult.enhancements.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Techniques:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {restoreResult.enhancements.map(
                                    (enhancement, index) => (
                                      <span
                                        key={index}
                                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                                      >
                                        {enhancement}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Restored Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Restore Button */}
                    {!isProcessing && !restoreResult && (
                      <button
                        onClick={restoreColors}
                        className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-pink-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Palette className="h-6 w-6" />
                        Restore Colors
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Restoration Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Restoration Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Restoration Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Restoration Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          {
                            value: "auto",
                            label: "Auto",
                            desc: "Best overall",
                            icon: Wand2,
                          },
                          {
                            value: "vibrant",
                            label: "Vibrant",
                            desc: "Bold colors",
                            icon: Palette,
                          },
                          {
                            value: "natural",
                            label: "Natural",
                            desc: "Balanced look",
                            icon: Sunrise,
                          },
                          {
                            value: "vintage",
                            label: "Vintage",
                            desc: "Classic feel",
                            icon: Sunset,
                          },
                          {
                            value: "custom",
                            label: "Custom",
                            desc: "Manual settings",
                            icon: Sliders,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                restoreMode: mode.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              restoreOptions.restoreMode === mode.value
                                ? "border-pink-500 bg-pink-50 text-pink-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <mode.icon className="h-4 w-4" />
                              <div className="font-semibold text-sm">
                                {mode.label}
                              </div>
                            </div>
                            <div className="text-xs opacity-75">
                              {mode.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intensity */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Restoration Intensity: {restoreOptions.intensity}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={restoreOptions.intensity}
                        onChange={(e) =>
                          setRestoreOptions((prev) => ({
                            ...prev,
                            intensity: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Subtle</span>
                        <span>Balanced</span>
                        <span>Intense</span>
                      </div>
                    </div>

                    {/* Custom Color Settings (only for custom mode) */}
                    {restoreOptions.restoreMode === "custom" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Saturation:{" "}
                            {restoreOptions.saturation > 0 ? "+" : ""}
                            {restoreOptions.saturation}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={restoreOptions.saturation}
                            onChange={(e) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                saturation: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Less</span>
                            <span>Original</span>
                            <span>More</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contrast: {restoreOptions.contrast > 0 ? "+" : ""}
                            {restoreOptions.contrast}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={restoreOptions.contrast}
                            onChange={(e) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                contrast: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Less</span>
                            <span>Original</span>
                            <span>More</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Temperature:{" "}
                            {restoreOptions.temperature > 0 ? "+" : ""}
                            {restoreOptions.temperature}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={restoreOptions.temperature}
                            onChange={(e) =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                temperature: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Cool</span>
                            <span>Neutral</span>
                            <span>Warm</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhancement Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Enhancement Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Droplet className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Remove Yellowing
                              </div>
                              <div className="text-xs text-gray-600">
                                Fix yellow discoloration
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.removeYellowing}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  removeYellowing: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Correct Color Cast
                              </div>
                              <div className="text-xs text-gray-600">
                                Fix color imbalance
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.correctColorCast}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  correctColorCast: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Scissors className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Enhance Details
                              </div>
                              <div className="text-xs text-gray-600">
                                Improve sharpness
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.enhanceDetails}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  enhanceDetails: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={restoreOptions.outputFormat}
                          onChange={(e) =>
                            setRestoreOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="png">PNG (Better quality)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {restoreOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={restoreOptions.quality}
                          onChange={(e) =>
                            setRestoreOptions((prev) => ({
                              ...prev,
                              quality: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Presets */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    Restoration Presets
                  </h3>
                  <div className="space-y-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200"
                      >
                        <div className="font-semibold text-gray-900 text-sm">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-pink-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Color Revival
                      </div>
                      <div className="text-xs text-gray-600">
                        Restore vibrant colors in faded photographs
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Droplet className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Yellowing Removal
                      </div>
                      <div className="text-xs text-gray-600">
                        Fix yellow discoloration in aged photos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RefreshCw className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Color Balance Correction
                      </div>
                      <div className="text-xs text-gray-600">
                        Fix color casts and imbalances
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Thermometer className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Temperature Adjustment
                      </div>
                      <div className="text-xs text-gray-600">
                        Fine-tune color warmth and coolness
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
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your faded or discolored photo
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose restoration mode and settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Our algorithms analyze and restore color balance
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your vibrant, restored photo
                    </div>
                  </div>
                </div>
              </div>

              {/* Perfect For */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Perfect For
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Old family photographs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Faded photo albums
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Yellowed vintage prints
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Sun-damaged images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Discolored prints
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Historical photographs
                    </span>
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
                      Your photos are processed securely and automatically
                      deleted after restoration. We never store or share your
                      images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-pink-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      96.8%
                    </div>
                    <div className="text-xs text-pink-700">Color Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">3.5s</div>
                    <div className="text-xs text-pink-700">Avg. Processing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      280K+
                    </div>
                    <div className="text-xs text-pink-700">Photos Restored</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      4.9/5
                    </div>
                    <div className="text-xs text-pink-700">User Rating</div>
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

export default ColorRestoration;
