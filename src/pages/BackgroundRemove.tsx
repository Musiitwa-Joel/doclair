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
  Scissors,
  Palette,
  Wand2,
  Sliders,
  Maximize,
  Minimize,
  RefreshCw,
  EyeOff,
  Eraser,
  Magnet as Magic,
} from "lucide-react";

interface RemoveBackgroundOptions {
  refinementLevel: "fast" | "balanced" | "detailed";
  outputFormat: "png" | "jpg" | "jpeg" | "webp";
  quality: number;
  preserveTransparency: boolean;
  refineBorders: boolean;
  smoothEdges: boolean;
  enhanceSubjects: boolean;
  backgroundColor?: string;
}

interface RemoveBackgroundResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  transparencyScore: number;
  edgeQualityScore: number;
}

const BackgroundRemove: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [removalResult, setRemovalResult] =
    useState<RemoveBackgroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [removalOptions, setRemovalOptions] = useState<RemoveBackgroundOptions>(
    {
      refinementLevel: "balanced",
      outputFormat: "png",
      quality: 95,
      preserveTransparency: true,
      refineBorders: true,
      smoothEdges: true,
      enhanceSubjects: false,
      backgroundColor: undefined,
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  const removeBackground = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("removalOptions", JSON.stringify(removalOptions));

      // Start the animation
      setShowAnimation(true);
      setAnimationProgress(0);

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

      const response = await fetch("/api/tools/image/remove-background", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Background removal failed");
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
      const transparencyScore = parseFloat(
        response.headers.get("X-Transparency-Score") || "0"
      );
      const edgeQualityScore = parseFloat(
        response.headers.get("X-Edge-Quality-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `nobg_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${removalOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);

        // Complete the animation
        const completeAnimation = () => {
          setAnimationProgress(100);
          setTimeout(() => {
            setShowAnimation(false);
          }, 500);
        };

        setTimeout(completeAnimation, 500);
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
        transparencyScore,
        edgeQualityScore,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setShowAnimation(false);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Animation effect
  useEffect(() => {
    if (showAnimation && animationProgress < 100) {
      const animate = () => {
        setAnimationProgress((prev) => {
          const newProgress = prev + 1;
          if (newProgress >= 100) {
            return 100;
          }
          animationFrameRef.current = requestAnimationFrame(animate);
          return newProgress;
        });
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [showAnimation, animationProgress]);

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
    setShowAnimation(false);
    setAnimationProgress(0);
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
        <title>Background Removal Tool - AI-Powered & Precise | Doclair</title>
        <meta
          name="description"
          content="Remove image backgrounds with AI precision. Perfect for product photos, portraits, and design assets. Preserves fine details like hair and transparent edges."
        />
        <meta
          name="keywords"
          content="background removal, remove background, transparent background, image cutout, AI background removal, product photography"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/background-remove"
        />
        <meta
          property="og:title"
          content="Background Removal Tool - AI-Powered & Precise"
        />
        <meta
          property="og:description"
          content="Professional AI-powered background removal with edge refinement technology. Perfect for product photos, portraits, and design assets."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-2xl">
                <Eraser className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Background{" "}
                <span className="cursive-text text-5xl text-green-600">
                  Removal
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Remove image backgrounds with{" "}
                <span className="cursive-text text-emerald-600 text-xl">
                  AI precision
                </span>
                . Perfect for product photos, portraits, and design assets with
                edge refinement technology.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Powered
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Edge Precision
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Transparent Output
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-green-600" />
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
                        <div className="bg-green-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-green-600" />
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

                    {/* Image Preview with Animation */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Preview
                      </h4>
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {filePreview && (
                          <div className="relative">
                            <img
                              src={filePreview}
                              alt="Original"
                              className="w-full h-auto object-contain"
                            />

                            {showAnimation && processedPreview && (
                              <div
                                className="absolute top-0 left-0 h-full bg-cover bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${processedPreview})`,
                                  width: `${animationProgress}%`,
                                  transition: "width 0.5s ease-out",
                                  borderRight: "2px solid #10b981",
                                }}
                              >
                                <div className="absolute top-0 right-0 h-full w-1 bg-green-500"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
                          <span className="font-semibold text-green-900">
                            Removing background...
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-green-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Detecting foreground..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Refining edges..."}
                          {processingProgress >= 90 &&
                            "Finalizing transparent image..."}
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
                              Background Removal Failed
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
                              Background Removed Successfully!
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
                                  Edge Quality:
                                </span>{" "}
                                {removalResult.edgeQualityScore.toFixed(1)}/10
                              </div>
                              <div>
                                <span className="font-medium">
                                  Transparency:
                                </span>{" "}
                                {removalResult.transparencyScore.toFixed(1)}/10
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Transparent Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remove Background Button */}
                    {!isProcessing && !removalResult && (
                      <button
                        onClick={removeBackground}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Magic className="h-6 w-6" />
                        Remove Background
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
                    {/* Refinement Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Refinement Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            value: "fast",
                            label: "Fast",
                            desc: "Quick processing",
                          },
                          {
                            value: "balanced",
                            label: "Balanced",
                            desc: "Good quality",
                          },
                          {
                            value: "detailed",
                            label: "Detailed",
                            desc: "Best quality",
                          },
                        ].map((level) => (
                          <button
                            key={level.value}
                            onClick={() =>
                              setRemovalOptions((prev) => ({
                                ...prev,
                                refinementLevel: level.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              removalOptions.refinementLevel === level.value
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold text-sm">
                              {level.label}
                            </div>
                            <div className="text-xs opacity-75">
                              {level.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Edge Refinement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Scissors className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              Refine Borders
                            </div>
                            <div className="text-xs text-gray-600">
                              Improve edge detection
                            </div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={removalOptions.refineBorders}
                            onChange={(e) =>
                              setRemovalOptions((prev) => ({
                                ...prev,
                                refineBorders: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sliders className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              Smooth Edges
                            </div>
                            <div className="text-xs text-gray-600">
                              Reduce jagged edges
                            </div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={removalOptions.smoothEdges}
                            onChange={(e) =>
                              setRemovalOptions((prev) => ({
                                ...prev,
                                smoothEdges: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Background Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Background Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Layers className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Preserve Transparency
                              </div>
                              <div className="text-xs text-gray-600">
                                Keep transparent PNG output
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={removalOptions.preserveTransparency}
                              onChange={(e) =>
                                setRemovalOptions((prev) => ({
                                  ...prev,
                                  preserveTransparency: e.target.checked,
                                  backgroundColor: e.target.checked
                                    ? undefined
                                    : prev.backgroundColor || "#ffffff",
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        {!removalOptions.preserveTransparency && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Background Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={
                                  removalOptions.backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  setRemovalOptions((prev) => ({
                                    ...prev,
                                    backgroundColor: e.target.value,
                                  }))
                                }
                                className="h-10 w-10 border border-gray-300 rounded-lg"
                              />
                              <input
                                type="text"
                                value={
                                  removalOptions.backgroundColor || "#ffffff"
                                }
                                onChange={(e) =>
                                  setRemovalOptions((prev) => ({
                                    ...prev,
                                    backgroundColor: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        )}
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
                              preserveTransparency:
                                e.target.value === "png" ||
                                e.target.value === "webp"
                                  ? prev.preserveTransparency
                                  : false,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="png">
                            PNG (Best for transparency)
                          </option>
                          <option value="webp">WebP (Modern format)</option>
                          <option value="jpg">JPG (Smaller size)</option>
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
              {/* Features */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        AI-Powered Detection
                      </div>
                      <div className="text-xs text-gray-600">
                        Advanced neural networks for precise subject detection
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Scissors className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Hair & Detail Preservation
                      </div>
                      <div className="text-xs text-gray-600">
                        Accurately preserves fine details like hair and fur
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Layers className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Transparent Background
                      </div>
                      <div className="text-xs text-gray-600">
                        Create images with transparent backgrounds for any use
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Custom Backgrounds
                      </div>
                      <div className="text-xs text-gray-600">
                        Replace with solid colors or keep transparency
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
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Adjust refinement level and edge settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI analyzes and removes the background
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your image with transparent background
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
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Product photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      E-commerce listings
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Portrait photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Graphic design assets
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Social media content
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Digital collages
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
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-green-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      99.2%
                    </div>
                    <div className="text-xs text-green-700">Edge Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      4.2s
                    </div>
                    <div className="text-xs text-green-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      1.2M+
                    </div>
                    <div className="text-xs text-green-700">
                      Images Processed
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      4.9/5
                    </div>
                    <div className="text-xs text-green-700">User Rating</div>
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

export default BackgroundRemove;
