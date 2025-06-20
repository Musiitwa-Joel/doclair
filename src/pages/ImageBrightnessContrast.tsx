import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Sun,
  Moon,
  Contrast,
  Palette,
  Sliders,
  Wand2,
  TrendingUp,
  BarChart3,
  Thermometer,
  Lightbulb,
  Aperture,
  Camera,
  Sunset,
  Sunrise,
} from "lucide-react";

interface BrightnessContrastOptions {
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  shadows: number;
  gamma: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  autoLevels?: boolean;
  autoContrast?: boolean;
  autoColor?: boolean;
}

interface BrightnessContrastResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  adjustments: string[];
}

const ImageBrightnessContrast: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [adjustmentResult, setAdjustmentResult] =
    useState<BrightnessContrastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentOptions, setAdjustmentOptions] =
    useState<BrightnessContrastOptions>({
      brightness: 0,
      contrast: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      gamma: 1.0,
      saturation: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0,
      outputFormat: "png",
      quality: 95,
      autoLevels: false,
      autoContrast: false,
      autoColor: false,
    });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const liveProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setAdjustmentResult(null);
    setProcessedPreview(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFilePreview(imageUrl);

      // Load image for canvas processing
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setProcessedPreview(imageUrl); // Initially show original
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  // Live preview processing using Canvas API
  const applyLiveAdjustments = useCallback(() => {
    if (!originalImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = originalImageRef.current;
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply adjustments pixel by pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      if (adjustmentOptions.brightness !== 0) {
        const brightnessFactor = adjustmentOptions.brightness * 2.55; // Convert to 0-255 range
        r = Math.max(0, Math.min(255, r + brightnessFactor));
        g = Math.max(0, Math.min(255, g + brightnessFactor));
        b = Math.max(0, Math.min(255, b + brightnessFactor));
      }

      // Apply contrast
      if (adjustmentOptions.contrast !== 0) {
        const contrastFactor =
          (259 * (adjustmentOptions.contrast + 255)) /
          (255 * (259 - adjustmentOptions.contrast));
        r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));
      }

      // Apply gamma correction
      if (adjustmentOptions.gamma !== 1.0) {
        r = Math.pow(r / 255, 1 / adjustmentOptions.gamma) * 255;
        g = Math.pow(g / 255, 1 / adjustmentOptions.gamma) * 255;
        b = Math.pow(b / 255, 1 / adjustmentOptions.gamma) * 255;
      }

      // Apply exposure (simplified)
      if (adjustmentOptions.exposure !== 0) {
        const exposureFactor = Math.pow(2, adjustmentOptions.exposure);
        r = Math.max(0, Math.min(255, r * exposureFactor));
        g = Math.max(0, Math.min(255, g * exposureFactor));
        b = Math.max(0, Math.min(255, b * exposureFactor));
      }

      // Apply saturation
      if (adjustmentOptions.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = 1 + adjustmentOptions.saturation / 100;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));
      }

      // Apply color temperature (simplified)
      if (adjustmentOptions.temperature !== 0) {
        const tempFactor = adjustmentOptions.temperature / 100;
        if (tempFactor > 0) {
          // Warmer (more red/yellow)
          r = Math.max(0, Math.min(255, r + tempFactor * 30));
          g = Math.max(0, Math.min(255, g + tempFactor * 15));
        } else {
          // Cooler (more blue)
          b = Math.max(0, Math.min(255, b - tempFactor * 30));
        }
      }

      // Apply tint
      if (adjustmentOptions.tint !== 0) {
        const tintFactor = adjustmentOptions.tint / 100;
        if (tintFactor > 0) {
          // More magenta
          r = Math.max(0, Math.min(255, r + tintFactor * 20));
          b = Math.max(0, Math.min(255, b + tintFactor * 20));
        } else {
          // More green
          g = Math.max(0, Math.min(255, g - tintFactor * 20));
        }
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to data URL for preview
    const processedDataUrl = canvas.toDataURL("image/png");
    setProcessedPreview(processedDataUrl);
  }, [adjustmentOptions]);

  // Debounced live processing
  useEffect(() => {
    if (!originalImageRef.current) return;

    setIsLiveProcessing(true);

    // Clear existing timeout
    if (liveProcessingTimeoutRef.current) {
      clearTimeout(liveProcessingTimeoutRef.current);
    }

    // Set new timeout for debounced processing
    liveProcessingTimeoutRef.current = setTimeout(() => {
      applyLiveAdjustments();
      setIsLiveProcessing(false);
    }, 100); // 100ms debounce

    return () => {
      if (liveProcessingTimeoutRef.current) {
        clearTimeout(liveProcessingTimeoutRef.current);
      }
    };
  }, [adjustmentOptions, applyLiveAdjustments]);

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

  const adjustImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("adjustmentOptions", JSON.stringify(adjustmentOptions));

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

      const response = await fetch("/api/tools/image/brightness-contrast", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Adjustment failed");
      }

      // Get adjustment metadata from headers
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
      const adjustments =
        response.headers.get("X-Adjustments")?.split(", ") || [];

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `adjusted_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${adjustmentOptions.outputFormat}`
        )}`;

      setAdjustmentResult({
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
        adjustments,
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
    if (!adjustmentResult) return;

    const link = document.createElement("a");
    link.href = adjustmentResult.downloadUrl;
    link.download = adjustmentResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAdjustments = () => {
    setAdjustmentOptions({
      brightness: 0,
      contrast: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      gamma: 1.0,
      saturation: 0,
      vibrance: 0,
      temperature: 0,
      tint: 0,
      outputFormat: "png",
      quality: 95,
      autoLevels: false,
      autoContrast: false,
      autoColor: false,
    });
    setAdjustmentResult(null);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setAdjustmentResult(null);
    setError(null);
    setProcessingProgress(0);
    resetAdjustments();
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

  const hasAdjustments = () => {
    return (
      adjustmentOptions.brightness !== 0 ||
      adjustmentOptions.contrast !== 0 ||
      adjustmentOptions.exposure !== 0 ||
      adjustmentOptions.highlights !== 0 ||
      adjustmentOptions.shadows !== 0 ||
      adjustmentOptions.gamma !== 1.0 ||
      adjustmentOptions.saturation !== 0 ||
      adjustmentOptions.vibrance !== 0 ||
      adjustmentOptions.temperature !== 0 ||
      adjustmentOptions.tint !== 0 ||
      adjustmentOptions.autoLevels ||
      adjustmentOptions.autoContrast ||
      adjustmentOptions.autoColor
    );
  };

  const presets = [
    {
      name: "Brighten",
      icon: Sun,
      adjustments: { brightness: 20, contrast: 10, saturation: 5 },
    },
    {
      name: "Darken",
      icon: Moon,
      adjustments: { brightness: -20, contrast: 15, shadows: 10 },
    },
    {
      name: "High Contrast",
      icon: Contrast,
      adjustments: { contrast: 30, highlights: -10, shadows: 10 },
    },
    {
      name: "Vibrant",
      icon: Palette,
      adjustments: { saturation: 25, vibrance: 15, contrast: 10 },
    },
    {
      name: "Warm",
      icon: Sunset,
      adjustments: { temperature: 25, tint: 5, brightness: 5 },
    },
    {
      name: "Cool",
      icon: Sunrise,
      adjustments: { temperature: -25, tint: -5, contrast: 5 },
    },
  ];

  const applyPreset = (preset: any) => {
    setAdjustmentOptions((prev) => ({
      ...prev,
      ...preset.adjustments,
    }));
  };

  return (
    <>
      <Helmet>
        <title>
          Brightness & Contrast Tool - Professional Image Enhancement | Doclair
        </title>
        <meta
          name="description"
          content="Adjust brightness, contrast, exposure, and color balance with professional controls. Real-time preview and histogram analysis."
        />
        <meta
          name="keywords"
          content="brightness contrast, image enhancement, exposure adjustment, color correction, photo editing, histogram"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-brightness-contrast"
        />
        <meta
          property="og:title"
          content="Brightness & Contrast Tool - Professional Image Enhancement"
        />
        <meta
          property="og:description"
          content="Professional brightness, contrast, and color adjustment tools with real-time preview and histogram analysis."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl mb-6 shadow-2xl">
                <Sun className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Brightness &{" "}
                <span className="cursive-text text-5xl text-yellow-600">
                  Contrast
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Adjust brightness, contrast, and exposure levels with{" "}
                <span className="cursive-text text-orange-600 text-xl">
                  real-time preview
                </span>
                . Fine-tune highlights, shadows, color temperature, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Professional Controls
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Exposure Adjustment
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Color Temperature
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Adjustment Area */}
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-yellow-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-yellow-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-yellow-600" />
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
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-yellow-600" />
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

                    {/* Live Preview */}
                    {processedPreview && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Live Preview
                          </h4>
                          {isLiveProcessing && (
                            <div className="flex items-center gap-2 text-yellow-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                              <span className="text-xs">Processing...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <img
                            src={processedPreview}
                            alt="Live Preview"
                            className="max-w-full max-h-96 object-contain rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-600 border-t-transparent"></div>
                          <span className="font-semibold text-yellow-900">
                            Processing final image...
                          </span>
                        </div>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-yellow-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying brightness adjustments..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Processing contrast and color..."}
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
                              Adjustment Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Adjustment Result */}
                    {adjustmentResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Processing Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {adjustmentResult.processedDimensions.width}×
                                {adjustmentResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(adjustmentResult.processingTime)}
                              </div>
                            </div>
                            {adjustmentResult.adjustments.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Adjustments:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {adjustmentResult.adjustments.map(
                                    (adjustment, index) => (
                                      <span
                                        key={index}
                                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                                      >
                                        {adjustment}
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
                              Download Enhanced Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Process Final Button */}
                    {!isProcessing && !adjustmentResult && hasAdjustments() && (
                      <button
                        onClick={adjustImage}
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Download className="h-6 w-6" />
                        Download Final Image
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

              {/* Adjustment Controls */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Settings className="h-6 w-6 text-purple-600" />
                      Live Adjustment Controls
                    </h3>
                    <button
                      onClick={resetAdjustments}
                      className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset All
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {presets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyPreset(preset)}
                            className="p-3 rounded-lg border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 flex items-center gap-2"
                          >
                            <preset.icon className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Adjustments */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Auto Adjustments
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={adjustmentOptions.autoLevels}
                            onChange={(e) =>
                              setAdjustmentOptions((prev) => ({
                                ...prev,
                                autoLevels: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Auto Levels
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={adjustmentOptions.autoContrast}
                            onChange={(e) =>
                              setAdjustmentOptions((prev) => ({
                                ...prev,
                                autoContrast: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Auto Contrast
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={adjustmentOptions.autoColor}
                            onChange={(e) =>
                              setAdjustmentOptions((prev) => ({
                                ...prev,
                                autoColor: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Auto Color
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Basic Adjustments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Brightness: {adjustmentOptions.brightness}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.brightness}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              brightness: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contrast: {adjustmentOptions.contrast}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.contrast}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              contrast: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Exposure: {adjustmentOptions.exposure.toFixed(1)} EV
                        </label>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={adjustmentOptions.exposure}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              exposure: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Gamma: {adjustmentOptions.gamma.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.1"
                          value={adjustmentOptions.gamma}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              gamma: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Highlights and Shadows */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Highlights: {adjustmentOptions.highlights}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.highlights}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              highlights: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Shadows: {adjustmentOptions.shadows}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.shadows}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              shadows: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Color Adjustments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Saturation: {adjustmentOptions.saturation}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.saturation}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              saturation: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Vibrance: {adjustmentOptions.vibrance}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.vibrance}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              vibrance: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Temperature: {adjustmentOptions.temperature}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.temperature}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              temperature: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tint: {adjustmentOptions.tint}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={adjustmentOptions.tint}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              tint: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={adjustmentOptions.outputFormat}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="png">PNG (Lossless)</option>
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="webp">WebP (Modern)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {adjustmentOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={adjustmentOptions.quality}
                          onChange={(e) =>
                            setAdjustmentOptions((prev) => ({
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
              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Live Preview
                      </div>
                      <div className="text-xs text-gray-600">
                        See changes instantly as you adjust controls
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sun className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Brightness Control
                      </div>
                      <div className="text-xs text-gray-600">
                        Precise brightness adjustment from -100 to +100
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Contrast className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Contrast Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        Professional contrast control with live feedback
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Exposure Adjustment
                      </div>
                      <div className="text-xs text-gray-600">
                        Professional exposure control in EV stops
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Thermometer className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Color Temperature
                      </div>
                      <div className="text-xs text-gray-600">
                        Warm/cool color balance and tint adjustment
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
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Adjust controls and see live preview
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Fine-tune with professional controls
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your enhanced image
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
                      Live preview processing happens in your browser. Your
                      images are never uploaded during preview - only when you
                      download the final result.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-yellow-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      99.5%
                    </div>
                    <div className="text-xs text-yellow-700">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      Live
                    </div>
                    <div className="text-xs text-yellow-700">Preview Speed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      650K+
                    </div>
                    <div className="text-xs text-yellow-700">
                      Images Enhanced
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">12</div>
                    <div className="text-xs text-yellow-700">
                      Adjustment Types
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </>
  );
};

export default ImageBrightnessContrast;
