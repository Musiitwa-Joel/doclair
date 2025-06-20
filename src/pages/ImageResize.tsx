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
  Maximize,
  Minimize,
  Square,
  MoreHorizontal,
  Sliders,
  Wand2,
  TrendingUp,
  Scissors,
  Palette,
} from "lucide-react";

interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  resizeMode: "fit" | "fill" | "cover" | "contain" | "stretch";
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  aiUpscaling?: boolean;
  upscaleAlgorithm?: "lanczos" | "cubic" | "linear" | "nearest";
  sharpenAmount?: number;
  noiseReduction?: boolean;
}

interface ResizeResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  resizedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  compressionRatio: number;
  aiUpscaled: boolean;
}

const ImageResize: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resizeResult, setResizeResult] = useState<ResizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({
    maintainAspectRatio: true,
    resizeMode: "fit",
    outputFormat: "png",
    quality: 90,
    aiUpscaling: false,
    upscaleAlgorithm: "lanczos",
    sharpenAmount: 0,
    noiseReduction: false,
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
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      setError("File size must be less than 50MB.");
      return;
    }

    setUploadedFile(file);
    setError(null);
    setResizeResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
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

  const resizeImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("resizeOptions", JSON.stringify(resizeOptions));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await fetch("/api/tools/image/resize-image", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Resize failed");
      }

      // Get resize metadata from headers
      const processingTime = parseInt(
        response.headers.get("X-Processing-Time") || "0"
      );
      const originalDimensions = response.headers
        .get("X-Original-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const resizedDimensions = response.headers
        .get("X-Resized-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const compressionRatio = parseFloat(
        response.headers.get("X-Compression-Ratio") || "1"
      );
      const aiUpscaled = response.headers.get("X-AI-Upscaled") === "true";

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `resized_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${resizeOptions.outputFormat}`
        )}`;

      setResizeResult({
        filename,
        originalDimensions: {
          width: originalDimensions[0],
          height: originalDimensions[1],
        },
        resizedDimensions: {
          width: resizedDimensions[0],
          height: resizedDimensions[1],
        },
        processingTime,
        downloadUrl,
        compressionRatio,
        aiUpscaled,
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
    if (!resizeResult) return;

    const link = document.createElement("a");
    link.href = resizeResult.downloadUrl;
    link.download = resizeResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetResizer = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setResizeResult(null);
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

  const presetSizes = [
    { name: "Instagram Square", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "Facebook Cover", width: 1200, height: 630 },
    { name: "Twitter Header", width: 1500, height: 500 },
    { name: "YouTube Thumbnail", width: 1280, height: 720 },
    { name: "LinkedIn Banner", width: 1584, height: 396 },
    { name: "4K Ultra HD", width: 3840, height: 2160 },
    { name: "Full HD", width: 1920, height: 1080 },
    { name: "HD Ready", width: 1280, height: 720 },
  ];

  const applyPreset = (preset: { width: number; height: number }) => {
    setResizeOptions((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height,
    }));
  };

  return (
    <>
      <Helmet>
        <title>Image Resize Tool - AI Upscaling & Smart Resize | Doclair</title>
        <meta
          name="description"
          content="Resize images with AI upscaling technology. Maintain quality while changing dimensions. Support for multiple formats and smart resize modes."
        />
        <meta
          name="keywords"
          content="image resize, AI upscaling, image scaling, photo resize, smart resize, image optimization"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-resize"
        />
        <meta
          property="og:title"
          content="Image Resize Tool - AI Upscaling & Smart Resize"
        />
        <meta
          property="og:description"
          content="Resize images with advanced AI upscaling technology and smart resize modes for perfect results."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl mb-6 shadow-2xl">
                <ImageIcon className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Image{" "}
                <span className="cursive-text text-5xl text-orange-600">
                  Resize
                </span>{" "}
                Tool
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Resize images while maintaining quality with{" "}
                <span className="cursive-text text-purple-600 text-xl">
                  AI upscaling
                </span>{" "}
                technology. Smart resize modes, batch processing, and
                professional optimization.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Upscaling
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Smart Resize
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Quality Preservation
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
            {/* Main Resize Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* File Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  Upload Image
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
                      <div className="bg-orange-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-orange-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your image here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports JPG, PNG, WebP, GIF files up to 50MB
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose Image File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Info */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-orange-600" />
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
                        onClick={resetResizer}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Image Preview */}
                    {filePreview && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Preview
                        </h4>
                        <div className="flex justify-center">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-w-full max-h-64 object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
                          <span className="font-semibold text-orange-900">
                            {resizeOptions.aiUpscaling
                              ? "AI Upscaling Image..."
                              : "Resizing Image..."}
                          </span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-orange-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Processing dimensions..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            (resizeOptions.aiUpscaling
                              ? "Applying AI upscaling..."
                              : "Resizing image...")}
                          {processingProgress >= 90 && "Finalizing..."}
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
                              Resize Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resize Result */}
                    {resizeResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Resize Successful!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Original:</span>{" "}
                                {resizeResult.originalDimensions.width}×
                                {resizeResult.originalDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">Resized:</span>{" "}
                                {resizeResult.resizedDimensions.width}×
                                {resizeResult.resizedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(resizeResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Compression:
                                </span>{" "}
                                {resizeResult.compressionRatio.toFixed(2)}x
                              </div>
                              {resizeResult.aiUpscaled && (
                                <div className="col-span-2">
                                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                    <Brain className="h-3 w-3" />
                                    AI Upscaled
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Resized Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resize Button */}
                    {!isProcessing &&
                      !resizeResult &&
                      (resizeOptions.width || resizeOptions.height) && (
                        <button
                          onClick={resizeImage}
                          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                          {resizeOptions.aiUpscaling ? (
                            <>
                              <Wand2 className="h-6 w-6" />
                              AI Upscale & Resize Image
                            </>
                          ) : (
                            <>
                              <Maximize className="h-6 w-6" />
                              Resize Image
                            </>
                          )}
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

              {/* Resize Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Resize Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Dimensions */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Target Dimensions
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            value={resizeOptions.width || ""}
                            onChange={(e) =>
                              setResizeOptions((prev) => ({
                                ...prev,
                                width: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Auto"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            value={resizeOptions.height || ""}
                            onChange={(e) =>
                              setResizeOptions((prev) => ({
                                ...prev,
                                height: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Auto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Square className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-semibold text-gray-900">
                            Maintain Aspect Ratio
                          </div>
                          <div className="text-sm text-gray-600">
                            Preserve original proportions
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resizeOptions.maintainAspectRatio}
                          onChange={(e) =>
                            setResizeOptions((prev) => ({
                              ...prev,
                              maintainAspectRatio: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Resize Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Resize Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          {
                            value: "fit",
                            label: "Fit",
                            desc: "Fit within bounds",
                            icon: Minimize,
                          },
                          {
                            value: "fill",
                            label: "Fill",
                            desc: "Fill exact size",
                            icon: Square,
                          },
                          {
                            value: "cover",
                            label: "Cover",
                            desc: "Cover bounds",
                            icon: Maximize,
                          },
                          {
                            value: "contain",
                            label: "Contain",
                            desc: "Contain within",
                            icon: Target,
                          },
                          {
                            value: "stretch",
                            label: "Stretch",
                            desc: "Stretch to fit",
                            icon: MoreHorizontal,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setResizeOptions((prev) => ({
                                ...prev,
                                resizeMode: mode.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              resizeOptions.resizeMode === mode.value
                                ? "border-orange-500 bg-orange-50 text-orange-700"
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

                    {/* AI Upscaling */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-semibold text-gray-900">
                            AI Upscaling
                          </div>
                          <div className="text-sm text-gray-600">
                            Use AI for better quality when enlarging
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={resizeOptions.aiUpscaling}
                          onChange={(e) =>
                            setResizeOptions((prev) => ({
                              ...prev,
                              aiUpscaling: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {/* Advanced Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Advanced Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Output Format
                          </label>
                          <select
                            value={resizeOptions.outputFormat}
                            onChange={(e) =>
                              setResizeOptions((prev) => ({
                                ...prev,
                                outputFormat: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="png">PNG (Lossless)</option>
                            <option value="jpg">JPG (Smaller size)</option>
                            <option value="webp">WebP (Modern)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Quality ({resizeOptions.quality}%)
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={resizeOptions.quality}
                            onChange={(e) =>
                              setResizeOptions((prev) => ({
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
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preset Sizes */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                    Popular Sizes
                  </h3>
                  <div className="space-y-2">
                    {presetSizes.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                      >
                        <div className="font-semibold text-gray-900 text-sm">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {preset.width} × {preset.height}
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
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        AI Upscaling
                      </div>
                      <div className="text-xs text-gray-600">
                        Advanced algorithms for quality enlargement
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Smart Resize Modes
                      </div>
                      <div className="text-xs text-gray-600">
                        Multiple resize strategies for perfect results
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Quality Preservation
                      </div>
                      <div className="text-xs text-gray-600">
                        Maintain image quality during resize
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Multiple Formats
                      </div>
                      <div className="text-xs text-gray-600">
                        Export to PNG, JPG, WebP with quality control
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
                    <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Set target dimensions and resize mode
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI analyzes and optimizes the resize
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your perfectly resized image
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
                      Your images are processed securely and automatically
                      deleted after resize. We never store or share your images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-orange-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      99.2%
                    </div>
                    <div className="text-xs text-orange-700">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      3.2s
                    </div>
                    <div className="text-xs text-orange-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      980K+
                    </div>
                    <div className="text-xs text-orange-700">
                      Images Resized
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      4.8x
                    </div>
                    <div className="text-xs text-orange-700">Max Upscale</div>
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

export default ImageResize;
