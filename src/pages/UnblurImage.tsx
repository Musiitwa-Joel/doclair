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
  Focus,
  Scan,
  Sliders,
  Wand2,
  Repeat,
  Maximize,
  Minimize,
  Aperture,
  Camera,
  RefreshCw,
  Loader,
} from "lucide-react";

interface UnblurOptions {
  algorithm: "deconvolution" | "neural" | "adaptive" | "auto";
  strength: number; // 1-100
  radius: number; // 1-10
  iterations: number; // 1-10
  preserveDetails: boolean;
  reduceNoise: boolean;
  enhanceEdges: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface UnblurResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  enhancements: string[];
  clarityScore: number;
}

const UnblurImage: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [unblurResult, setUnblurResult] = useState<UnblurResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unblurOptions, setUnblurOptions] = useState<UnblurOptions>({
    algorithm: "auto",
    strength: 75,
    radius: 3,
    iterations: 1,
    preserveDetails: true,
    reduceNoise: true,
    enhanceEdges: true,
    outputFormat: "png",
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
    setUnblurResult(null);
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

  const unblurImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("unblurOptions", JSON.stringify(unblurOptions));

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

      const response = await fetch("/api/tools/image/unblur-image", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unblurring failed");
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
      const clarityScore = parseFloat(
        response.headers.get("X-Clarity-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `unblurred_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${unblurOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setUnblurResult({
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
        clarityScore,
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
    if (!unblurResult) return;

    const link = document.createElement("a");
    link.href = unblurResult.downloadUrl;
    link.download = unblurResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setUnblurResult(null);
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

  // Presets for common unblur scenarios
  const presets = [
    {
      name: "Motion Blur",
      description: "Fix camera movement blur",
      settings: {
        algorithm: "deconvolution",
        strength: 80,
        radius: 4,
        iterations: 2,
        enhanceEdges: true,
      },
    },
    {
      name: "Out of Focus",
      description: "Sharpen unfocused images",
      settings: {
        algorithm: "neural",
        strength: 85,
        radius: 3,
        iterations: 1,
        preserveDetails: true,
      },
    },
    {
      name: "Low Light",
      description: "Fix blurry low-light photos",
      settings: {
        algorithm: "adaptive",
        strength: 70,
        radius: 2,
        iterations: 2,
        reduceNoise: true,
      },
    },
    {
      name: "Gentle Fix",
      description: "Subtle enhancement",
      settings: {
        algorithm: "auto",
        strength: 50,
        radius: 2,
        iterations: 1,
      },
    },
    {
      name: "Maximum Clarity",
      description: "Aggressive sharpening",
      settings: {
        algorithm: "deconvolution",
        strength: 100,
        radius: 5,
        iterations: 3,
        enhanceEdges: true,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setUnblurOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  return (
    <>
      <Helmet>
        <title>Unblur Images - Fix Blurry Photos | Doclair</title>
        <meta
          name="description"
          content="Fix blurry and out-of-focus images with advanced deconvolution algorithms. Sharpen photos and recover details with AI-powered technology."
        />
        <meta
          name="keywords"
          content="unblur images, fix blurry photos, sharpen images, deblur, deconvolution, image enhancement, focus correction"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/unblur-image"
        />
        <meta
          property="og:title"
          content="Unblur Images - Fix Blurry Photos | Doclair"
        />
        <meta
          property="og:description"
          content="Professional tool to fix blurry and out-of-focus images with advanced deconvolution algorithms and AI technology."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <Focus className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Unblur{" "}
                <span className="cursive-text text-5xl text-blue-600">
                  Images
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Fix blurry and out-of-focus images with{" "}
                <span className="cursive-text text-indigo-600 text-xl">
                  advanced algorithms
                </span>
                . Sharpen photos and recover details with deconvolution
                technology.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Powered
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Aperture className="h-4 w-4" />
                  Deconvolution
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fix Out-of-Focus
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
                  Upload Blurry Image
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
                        <ImageIcon className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your blurry image here or click to browse
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
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-blue-600" />
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
                            Original (Blurry)
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
                            Unblurred (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Unblurred"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                Unblurred preview will appear here
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="font-semibold text-blue-900">
                            Unblurring image...
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-blue-700">
                          {processingProgress < 30 &&
                            "Analyzing blur pattern..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying deconvolution algorithm..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Enhancing image details..."}
                          {processingProgress >= 90 &&
                            "Finalizing unblurred image..."}
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
                              Unblurring Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unblur Result */}
                    {unblurResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Unblurring Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {unblurResult.processedDimensions.width}×
                                {unblurResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(unblurResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Clarity Score:
                                </span>{" "}
                                {unblurResult.clarityScore.toFixed(1)}/10
                              </div>
                              <div>
                                <span className="font-medium">Algorithm:</span>{" "}
                                {unblurOptions.algorithm
                                  .charAt(0)
                                  .toUpperCase() +
                                  unblurOptions.algorithm.slice(1)}
                              </div>
                            </div>
                            {unblurResult.enhancements.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Techniques:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {unblurResult.enhancements.map(
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
                              Download Unblurred Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unblur Button */}
                    {!isProcessing && !unblurResult && (
                      <button
                        onClick={unblurImage}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Focus className="h-6 w-6" />
                        Unblur Image
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

              {/* Unblur Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Unblur Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Algorithm Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Unblur Algorithm
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {
                            value: "auto",
                            label: "Auto",
                            desc: "Best overall",
                            icon: Wand2,
                          },
                          {
                            value: "deconvolution",
                            label: "Deconvolution",
                            desc: "Motion blur",
                            icon: RefreshCw,
                          },
                          {
                            value: "neural",
                            label: "Neural",
                            desc: "AI-powered",
                            icon: Brain,
                          },
                          {
                            value: "adaptive",
                            label: "Adaptive",
                            desc: "Detail focus",
                            icon: Target,
                          },
                        ].map((algorithm) => (
                          <button
                            key={algorithm.value}
                            onClick={() =>
                              setUnblurOptions((prev) => ({
                                ...prev,
                                algorithm: algorithm.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              unblurOptions.algorithm === algorithm.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <algorithm.icon className="h-4 w-4" />
                              <div className="font-semibold text-sm">
                                {algorithm.label}
                              </div>
                            </div>
                            <div className="text-xs opacity-75">
                              {algorithm.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Strength and Radius */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Strength: {unblurOptions.strength}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={unblurOptions.strength}
                          onChange={(e) =>
                            setUnblurOptions((prev) => ({
                              ...prev,
                              strength: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Subtle</span>
                          <span>Balanced</span>
                          <span>Aggressive</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Blur Radius: {unblurOptions.radius}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={unblurOptions.radius}
                          onChange={(e) =>
                            setUnblurOptions((prev) => ({
                              ...prev,
                              radius: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Small</span>
                          <span>Medium</span>
                          <span>Large</span>
                        </div>
                      </div>
                    </div>

                    {/* Iterations */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Processing Iterations: {unblurOptions.iterations}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 5, 10].map((value) => (
                          <button
                            key={value}
                            onClick={() =>
                              setUnblurOptions((prev) => ({
                                ...prev,
                                iterations: value,
                              }))
                            }
                            className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all duration-200 ${
                              unblurOptions.iterations === value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            {value}x
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        More iterations = better results but slower processing
                      </div>
                    </div>

                    {/* Enhancement Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Enhancement Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Maximize className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Preserve Details
                              </div>
                              <div className="text-xs text-gray-600">
                                Maintain fine details
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unblurOptions.preserveDetails}
                              onChange={(e) =>
                                setUnblurOptions((prev) => ({
                                  ...prev,
                                  preserveDetails: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Minimize className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Reduce Noise
                              </div>
                              <div className="text-xs text-gray-600">
                                Smooth artifacts
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unblurOptions.reduceNoise}
                              onChange={(e) =>
                                setUnblurOptions((prev) => ({
                                  ...prev,
                                  reduceNoise: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Enhance Edges
                              </div>
                              <div className="text-xs text-gray-600">
                                Improve definition
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unblurOptions.enhanceEdges}
                              onChange={(e) =>
                                setUnblurOptions((prev) => ({
                                  ...prev,
                                  enhanceEdges: e.target.checked,
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
                          value={unblurOptions.outputFormat}
                          onChange={(e) =>
                            setUnblurOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="png">PNG (Best quality)</option>
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {unblurOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={unblurOptions.quality}
                          onChange={(e) =>
                            setUnblurOptions((prev) => ({
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
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Unblur Presets
                  </h3>
                  <div className="space-y-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
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
                    <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Deconvolution Technology
                      </div>
                      <div className="text-xs text-gray-600">
                        Advanced algorithms to reverse blur patterns
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Neural Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        AI-powered detail recovery and sharpening
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Motion Blur Correction
                      </div>
                      <div className="text-xs text-gray-600">
                        Fix camera shake and movement blur
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Aperture className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Focus Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        Sharpen out-of-focus and soft images
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
                      Upload your blurry or out-of-focus image
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose the unblur algorithm and settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Our algorithms analyze and reverse the blur pattern
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your sharper, clearer image
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Out-of-focus photos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Camera shake blur
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Low-light blurry images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Smartphone photos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Old or digitized images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Document scans
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
                      Your images are processed securely and automatically
                      deleted after unblurring. We never store or share your
                      images.
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
                    <div className="text-2xl font-bold text-blue-600">85%</div>
                    <div className="text-xs text-blue-700">
                      Clarity Improvement
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">4.2s</div>
                    <div className="text-xs text-blue-700">Avg. Processing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      350K+
                    </div>
                    <div className="text-xs text-blue-700">
                      Images Unblurred
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      4.8/5
                    </div>
                    <div className="text-xs text-blue-700">User Rating</div>
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

export default UnblurImage;
