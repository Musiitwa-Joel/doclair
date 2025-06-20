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
  Scan,
  Brush,
  Eraser,
  Wand2,
  Sliders,
  Maximize,
  Minimize,
  Aperture,
  Camera,
  RefreshCw,
  Loader,
  Scissors,
} from "lucide-react";

interface ScratchRemovalOptions {
  detectionMode: "auto" | "aggressive" | "conservative" | "manual";
  intensity: number; // 1-100
  scratchThickness: number; // 1-10
  dustSize: number; // 1-10
  preserveDetails: boolean;
  enhanceTexture: boolean;
  reduceNoise: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface ScratchRemovalResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  enhancements: string[];
  scratchCount: number;
  repairScore: number;
}

const RemoveScratches: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [removalResult, setRemovalResult] =
    useState<ScratchRemovalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removalOptions, setRemovalOptions] = useState<ScratchRemovalOptions>({
    detectionMode: "auto",
    intensity: 75,
    scratchThickness: 3,
    dustSize: 2,
    preserveDetails: true,
    enhanceTexture: true,
    reduceNoise: true,
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
    setRemovalResult(null);
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

  const removeScratches = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("removalOptions", JSON.stringify(removalOptions));

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

      const response = await fetch("/api/tools/image/remove-scratches", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Scratch removal failed");
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
      const scratchCount = parseInt(
        response.headers.get("X-Scratch-Count") || "0"
      );
      const repairScore = parseFloat(
        response.headers.get("X-Repair-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `fixed_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${removalOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setRemovalResult({
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
        scratchCount,
        repairScore,
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
    if (!removalResult) return;

    const link = document.createElement("a");
    link.href = removalResult.downloadUrl;
    link.download = removalResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setRemovalResult(null);
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

  // Presets for common scratch removal scenarios
  const presets = [
    {
      name: "Old Photos",
      description: "Fix vintage photographs",
      settings: {
        detectionMode: "auto",
        intensity: 80,
        scratchThickness: 3,
        dustSize: 3,
        preserveDetails: true,
        enhanceTexture: true,
      },
    },
    {
      name: "Film Negatives",
      description: "Clean scanned film",
      settings: {
        detectionMode: "aggressive",
        intensity: 85,
        scratchThickness: 2,
        dustSize: 4,
        preserveDetails: true,
        reduceNoise: true,
      },
    },
    {
      name: "Document Scans",
      description: "Clean document images",
      settings: {
        detectionMode: "conservative",
        intensity: 70,
        scratchThickness: 2,
        dustSize: 1,
        preserveDetails: true,
        enhanceTexture: false,
      },
    },
    {
      name: "Gentle Clean",
      description: "Minimal correction",
      settings: {
        detectionMode: "conservative",
        intensity: 50,
        scratchThickness: 1,
        dustSize: 1,
        preserveDetails: true,
        enhanceTexture: false,
        reduceNoise: false,
      },
    },
    {
      name: "Deep Clean",
      description: "Maximum correction",
      settings: {
        detectionMode: "aggressive",
        intensity: 100,
        scratchThickness: 5,
        dustSize: 5,
        preserveDetails: false,
        enhanceTexture: true,
        reduceNoise: true,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setRemovalOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  return (
    <>
      <Helmet>
        <title>Remove Scratches & Dust - Photo Repair Tool | Doclair</title>
        <meta
          name="description"
          content="Automatically detect and remove scratches, dust, and imperfections from photos and scanned images. Perfect for restoring old photographs and film scans."
        />
        <meta
          name="keywords"
          content="remove scratches, dust removal, photo repair, scratch detection, old photo restoration, film scan cleaning, image restoration"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/remove-scratches"
        />
        <meta
          property="og:title"
          content="Remove Scratches & Dust - Photo Repair Tool | Doclair"
        />
        <meta
          property="og:description"
          content="Automatically detect and remove scratches, dust, and imperfections from photos and scanned images with advanced AI technology."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <Eraser className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Remove{" "}
                <span className="cursive-text text-5xl text-purple-600">
                  Scratches
                </span>{" "}
                & Dust
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Automatically detect and remove scratches, dust, and
                imperfections with{" "}
                <span className="cursive-text text-indigo-600 text-xl">
                  intelligent algorithms
                </span>
                . Perfect for restoring old photographs, film scans, and damaged
                images.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Auto Detection
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brush className="h-4 w-4" />
                  Content-Aware Repair
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Detail Preservation
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
                  Upload Image
                </h3>

                {!uploadedFile ? (
                  <div
                    ref={dropZoneRef}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-purple-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-purple-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your image here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports JPG, PNG, WebP, GIF, TIFF files up to 50MB
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
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-purple-600" />
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
                            Original
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
                            Processed (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Processed"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                Processed preview will appear here
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                          <span className="font-semibold text-purple-900">
                            Removing scratches and dust...
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-purple-700">
                          {processingProgress < 30 &&
                            "Detecting scratches and dust..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Analyzing damage patterns..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Repairing damaged areas..."}
                          {processingProgress >= 90 &&
                            "Finalizing image restoration..."}
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
                              Scratch Removal Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Removal Result */}
                    {removalResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Scratch Removal Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {removalResult.processedDimensions.width}×
                                {removalResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(removalResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Scratches Removed:
                                </span>{" "}
                                {removalResult.scratchCount}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Repair Score:
                                </span>{" "}
                                {removalResult.repairScore.toFixed(1)}/10
                              </div>
                            </div>
                            {removalResult.enhancements.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Techniques:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {removalResult.enhancements.map(
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
                              Download Repaired Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Process Button */}
                    {!isProcessing && !removalResult && (
                      <button
                        onClick={removeScratches}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Eraser className="h-6 w-6" />
                        Remove Scratches & Dust
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

              {/* Removal Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Removal Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Detection Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Detection Mode
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
                            value: "aggressive",
                            label: "Aggressive",
                            desc: "Maximum removal",
                            icon: Eraser,
                          },
                          {
                            value: "conservative",
                            label: "Conservative",
                            desc: "Gentle cleaning",
                            icon: Brush,
                          },
                          {
                            value: "manual",
                            label: "Manual",
                            desc: "Custom settings",
                            icon: Sliders,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setRemovalOptions((prev) => ({
                                ...prev,
                                detectionMode: mode.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              removalOptions.detectionMode === mode.value
                                ? "border-purple-500 bg-purple-50 text-purple-700"
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

                    {/* Intensity and Scratch Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Intensity: {removalOptions.intensity}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={removalOptions.intensity}
                          onChange={(e) =>
                            setRemovalOptions((prev) => ({
                              ...prev,
                              intensity: parseInt(e.target.value),
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
                          Scratch Thickness: {removalOptions.scratchThickness}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={removalOptions.scratchThickness}
                          onChange={(e) =>
                            setRemovalOptions((prev) => ({
                              ...prev,
                              scratchThickness: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Thin</span>
                          <span>Medium</span>
                          <span>Thick</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dust Size: {removalOptions.dustSize}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={removalOptions.dustSize}
                          onChange={(e) =>
                            setRemovalOptions((prev) => ({
                              ...prev,
                              dustSize: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>None</span>
                          <span>Medium</span>
                          <span>Large</span>
                        </div>
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
                              checked={removalOptions.preserveDetails}
                              onChange={(e) =>
                                setRemovalOptions((prev) => ({
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
                            <Brush className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Enhance Texture
                              </div>
                              <div className="text-xs text-gray-600">
                                Improve image texture
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={removalOptions.enhanceTexture}
                              onChange={(e) =>
                                setRemovalOptions((prev) => ({
                                  ...prev,
                                  enhanceTexture: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Minimize className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Reduce Noise
                              </div>
                              <div className="text-xs text-gray-600">
                                Smooth grain and noise
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={removalOptions.reduceNoise}
                              onChange={(e) =>
                                setRemovalOptions((prev) => ({
                                  ...prev,
                                  reduceNoise: e.target.checked,
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
                          value={removalOptions.outputFormat}
                          onChange={(e) =>
                            setRemovalOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="png">PNG (Better quality)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {removalOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={removalOptions.quality}
                          onChange={(e) =>
                            setRemovalOptions((prev) => ({
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
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Removal Presets
                  </h3>
                  <div className="space-y-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
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
                    <Scan className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Automatic Detection
                      </div>
                      <div className="text-xs text-gray-600">
                        AI-powered scratch and dust identification
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brush className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Content-Aware Repair
                      </div>
                      <div className="text-xs text-gray-600">
                        Intelligently fills damaged areas with matching content
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Scissors className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Edge Preservation
                      </div>
                      <div className="text-xs text-gray-600">
                        Maintains sharp edges while removing defects
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sliders className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Multiple Detection Modes
                      </div>
                      <div className="text-xs text-gray-600">
                        Customize for different types of damage
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
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your scratched or damaged image
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose detection mode and settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI detects scratches and dust automatically
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your clean, repaired image
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Old photographs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Scanned film negatives
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Document scans
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Archival images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Artwork reproductions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Historical documents
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
                      deleted after processing. We never store or share your
                      images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      97.5%
                    </div>
                    <div className="text-xs text-purple-700">
                      Detection Rate
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      3.8s
                    </div>
                    <div className="text-xs text-purple-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      320K+
                    </div>
                    <div className="text-xs text-purple-700">
                      Images Repaired
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      4.9/5
                    </div>
                    <div className="text-xs text-purple-700">User Rating</div>
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

export default RemoveScratches;
