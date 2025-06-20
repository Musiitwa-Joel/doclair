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
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Square,
  MoreHorizontal,
  Sliders,
  Wand2,
  TrendingUp,
  Scissors,
  Palette,
  Plus,
  X,
  Grid3X3,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Combine,
  Copy,
} from "lucide-react";

interface RotateFlipOptions {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  backgroundColor?: string;
  cropToFit?: boolean;
  combineMode?: "none" | "side-by-side" | "top-bottom" | "overlay";
  spacing?: number;
  alignment?: "start" | "center" | "end";
}

interface RotateFlipResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  operations: string[];
  imageCount: number;
}

const ImageRotateFlip: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [rotateFlipResult, setRotateFlipResult] =
    useState<RotateFlipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotateFlipOptions, setRotateFlipOptions] = useState<RotateFlipOptions>(
    {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      outputFormat: "png",
      quality: 95,
      backgroundColor: "#ffffff",
      cropToFit: false,
      combineMode: "none",
      spacing: 10,
      alignment: "center",
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = useCallback(
    (files: FileList) => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const newFiles: File[] = [];
      const newPreviews: string[] = [];

      Array.from(files).forEach((file) => {
        if (!validTypes.includes(file.type)) {
          setError("Please upload valid image files (JPG, PNG, WebP, GIF).");
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          setError("Each file must be less than 50MB.");
          return;
        }

        newFiles.push(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string);
          if (newPreviews.length === newFiles.length) {
            setFilePreviews((prev) => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });

      if (uploadedFiles.length + newFiles.length > 5) {
        setError("Maximum 5 images allowed.");
        return;
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setRotateFlipResult(null);

      // Update combine mode based on total files
      if (uploadedFiles.length + newFiles.length > 1) {
        setRotateFlipOptions((prev) => ({
          ...prev,
          combineMode:
            prev.combineMode === "none" ? "side-by-side" : prev.combineMode,
        }));
      }
    },
    [uploadedFiles.length]
  );

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files);
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

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));

    // Update combine mode if only one file left
    if (uploadedFiles.length - 1 <= 1) {
      setRotateFlipOptions((prev) => ({
        ...prev,
        combineMode: "none",
      }));
    }
  };

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("images", file);
      });
      formData.append("rotateFlipOptions", JSON.stringify(rotateFlipOptions));

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

      const response = await fetch("/api/tools/image/rotate-flip-image", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Processing failed");
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
      const operations =
        response.headers.get("X-Operations")?.split(", ") || [];
      const imageCount = parseInt(response.headers.get("X-Image-Count") || "1");

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `processed_${uploadedFiles.length > 1 ? "combined_" : ""}image.${
          rotateFlipOptions.outputFormat
        }`;

      setRotateFlipResult({
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
        operations,
        imageCount,
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
    if (!rotateFlipResult) return;

    const link = document.createElement("a");
    link.href = rotateFlipResult.downloadUrl;
    link.download = rotateFlipResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFiles([]);
    setFilePreviews([]);
    setRotateFlipResult(null);
    setError(null);
    setProcessingProgress(0);
    setRotateFlipOptions((prev) => ({
      ...prev,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      combineMode: "none",
    }));
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

  const quickRotations = [
    { angle: 90, label: "90°" },
    { angle: 180, label: "180°" },
    { angle: 270, label: "270°" },
    { angle: -90, label: "-90°" },
  ];

  return (
    <>
      <Helmet>
        <title>
          Image Rotate & Flip Tool - Multi-Image Processor | Doclair
        </title>
        <meta
          name="description"
          content="Rotate and flip images with precision. Combine multiple images side-by-side or overlay. Professional image transformation tool."
        />
        <meta
          name="keywords"
          content="image rotate, image flip, combine images, image transformation, photo rotation, image processing"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-rotate-flip"
        />
        <meta
          property="og:title"
          content="Image Rotate & Flip Tool - Multi-Image Processor"
        />
        <meta
          property="og:description"
          content="Rotate, flip, and combine multiple images with professional precision and quality."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <RotateCw className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Image{" "}
                <span className="cursive-text text-5xl text-purple-600">
                  Rotate
                </span>{" "}
                & Flip
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Rotate and flip images with precision. Combine{" "}
                <span className="cursive-text text-indigo-600 text-xl">
                  multiple images
                </span>{" "}
                side-by-side, top-bottom, or overlay for creative compositions.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Any Angle Rotation
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <FlipHorizontal className="h-4 w-4" />
                  Flip & Mirror
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Combine className="h-4 w-4" />
                  Multi-Image Combine
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
                  Upload Images
                  <span className="text-sm font-normal text-gray-500">
                    (Up to 5 images)
                  </span>
                </h3>

                {uploadedFiles.length === 0 ? (
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
                      Drop your images here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports JPG, PNG, WebP, GIF files up to 50MB each
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose Image Files
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File List */}
                    <div className="space-y-3">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                              <ImageIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {file.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatFileSize(file.size)} • {file.type}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add More Images Button */}
                    {uploadedFiles.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-purple-300 rounded-lg p-4 text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Add More Images ({uploadedFiles.length}/5)
                      </button>
                    )}

                    {/* Image Previews */}
                    {filePreviews.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Preview
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {filePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg shadow-sm"
                              />
                              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                          <span className="font-semibold text-purple-900">
                            Processing {uploadedFiles.length} image(s)...
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-purple-700">
                          {processingProgress < 30 && "Analyzing images..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying transformations..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            (uploadedFiles.length > 1
                              ? "Combining images..."
                              : "Processing image...")}
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
                              Processing Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Processing Result */}
                    {rotateFlipResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Processing Successful!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Original:</span>{" "}
                                {rotateFlipResult.originalDimensions.width}×
                                {rotateFlipResult.originalDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">Processed:</span>{" "}
                                {rotateFlipResult.processedDimensions.width}×
                                {rotateFlipResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(rotateFlipResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">Images:</span>{" "}
                                {rotateFlipResult.imageCount}
                              </div>
                            </div>
                            {rotateFlipResult.operations.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Operations:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rotateFlipResult.operations.map(
                                    (op, index) => (
                                      <span
                                        key={index}
                                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                                      >
                                        {op}
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
                              Download Processed Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Process Button */}
                    {!isProcessing && !rotateFlipResult && (
                      <button
                        onClick={processImages}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <RotateCw className="h-6 w-6" />
                        Process{" "}
                        {uploadedFiles.length > 1
                          ? `& Combine ${uploadedFiles.length} Images`
                          : "Image"}
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Transform Settings */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Transform Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Rotation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Rotation
                      </label>
                      <div className="space-y-4">
                        {/* Quick Rotation Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {quickRotations.map((rotation) => (
                            <button
                              key={rotation.angle}
                              onClick={() =>
                                setRotateFlipOptions((prev) => ({
                                  ...prev,
                                  rotation: rotation.angle,
                                }))
                              }
                              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                                rotateFlipOptions.rotation === rotation.angle
                                  ? "border-purple-500 bg-purple-50 text-purple-700"
                                  : "border-gray-200 hover:border-gray-300 text-gray-700"
                              }`}
                            >
                              {rotation.label}
                            </button>
                          ))}
                        </div>

                        {/* Custom Rotation Slider */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Custom Angle: {rotateFlipOptions.rotation}°
                          </label>
                          <input
                            type="range"
                            min="-360"
                            max="360"
                            value={rotateFlipOptions.rotation}
                            onChange={(e) =>
                              setRotateFlipOptions((prev) => ({
                                ...prev,
                                rotation: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Flip Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Flip Options
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() =>
                            setRotateFlipOptions((prev) => ({
                              ...prev,
                              flipHorizontal: !prev.flipHorizontal,
                            }))
                          }
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                            rotateFlipOptions.flipHorizontal
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <FlipHorizontal className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold text-sm">
                              Flip Horizontal
                            </div>
                            <div className="text-xs opacity-75">
                              Mirror left-right
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() =>
                            setRotateFlipOptions((prev) => ({
                              ...prev,
                              flipVertical: !prev.flipVertical,
                            }))
                          }
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                            rotateFlipOptions.flipVertical
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <FlipVertical className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold text-sm">
                              Flip Vertical
                            </div>
                            <div className="text-xs opacity-75">
                              Mirror top-bottom
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Combine Mode (for multiple images) */}
                    {uploadedFiles.length > 1 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Combine Mode
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {
                              value: "side-by-side",
                              label: "Side by Side",
                              icon: MoreHorizontal,
                            },
                            {
                              value: "top-bottom",
                              label: "Top-Bottom",
                              icon: Grid3X3,
                            },
                            {
                              value: "overlay",
                              label: "Overlay",
                              icon: Layers,
                            },
                            { value: "none", label: "Separate", icon: Copy },
                          ].map((mode) => (
                            <button
                              key={mode.value}
                              onClick={() =>
                                setRotateFlipOptions((prev) => ({
                                  ...prev,
                                  combineMode: mode.value as any,
                                }))
                              }
                              className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                                rotateFlipOptions.combineMode === mode.value
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
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alignment and Spacing (for combining) */}
                    {uploadedFiles.length > 1 &&
                      rotateFlipOptions.combineMode !== "none" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Alignment
                            </label>
                            <div className="flex gap-2">
                              {[
                                {
                                  value: "start",
                                  label: "Start",
                                  icon: AlignLeft,
                                },
                                {
                                  value: "center",
                                  label: "Center",
                                  icon: AlignCenter,
                                },
                                {
                                  value: "end",
                                  label: "End",
                                  icon: AlignRight,
                                },
                              ].map((align) => (
                                <button
                                  key={align.value}
                                  onClick={() =>
                                    setRotateFlipOptions((prev) => ({
                                      ...prev,
                                      alignment: align.value as any,
                                    }))
                                  }
                                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                                    rotateFlipOptions.alignment === align.value
                                      ? "border-purple-500 bg-purple-50 text-purple-700"
                                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                                  }`}
                                >
                                  <align.icon className="h-4 w-4" />
                                  <span className="text-sm font-semibold">
                                    {align.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Spacing: {rotateFlipOptions.spacing}px
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={rotateFlipOptions.spacing}
                              onChange={(e) =>
                                setRotateFlipOptions((prev) => ({
                                  ...prev,
                                  spacing: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

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
                            value={rotateFlipOptions.outputFormat}
                            onChange={(e) =>
                              setRotateFlipOptions((prev) => ({
                                ...prev,
                                outputFormat: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="png">PNG (Lossless)</option>
                            <option value="jpg">JPG (Smaller size)</option>
                            <option value="webp">WebP (Modern)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Quality ({rotateFlipOptions.quality}%)
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={rotateFlipOptions.quality}
                            onChange={(e) =>
                              setRotateFlipOptions((prev) => ({
                                ...prev,
                                quality: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Background Color
                          </label>
                          <input
                            type="color"
                            value={rotateFlipOptions.backgroundColor}
                            onChange={(e) =>
                              setRotateFlipOptions((prev) => ({
                                ...prev,
                                backgroundColor: e.target.value,
                              }))
                            }
                            className="w-full h-10 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={rotateFlipOptions.cropToFit}
                              onChange={(e) =>
                                setRotateFlipOptions((prev) => ({
                                  ...prev,
                                  cropToFit: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Crop to fit original size
                            </span>
                          </label>
                        </div>
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
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <RotateCw className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Precise Rotation
                      </div>
                      <div className="text-xs text-gray-600">
                        Rotate by any angle from -360° to 360°
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FlipHorizontal className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Flip & Mirror
                      </div>
                      <div className="text-xs text-gray-600">
                        Horizontal and vertical flipping options
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Combine className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Multi-Image Combine
                      </div>
                      <div className="text-xs text-gray-600">
                        Combine up to 5 images in various layouts
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
                        Choose background colors for rotated images
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
                      Upload one or more images (up to 5)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Set rotation angle and flip options
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose combine mode for multiple images
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your transformed image(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setRotateFlipOptions((prev) => ({
                          ...prev,
                          rotation: 0,
                          flipHorizontal: false,
                          flipVertical: false,
                        }))
                      }
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="font-semibold text-gray-900 text-sm">
                        Reset All
                      </div>
                      <div className="text-xs text-gray-600">
                        Clear all transformations
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setRotateFlipOptions((prev) => ({
                          ...prev,
                          rotation: 90,
                        }))
                      }
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="font-semibold text-gray-900 text-sm">
                        Portrait to Landscape
                      </div>
                      <div className="text-xs text-gray-600">
                        Rotate 90° clockwise
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setRotateFlipOptions((prev) => ({
                          ...prev,
                          flipHorizontal: !prev.flipHorizontal,
                        }))
                      }
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="font-semibold text-gray-900 text-sm">
                        Mirror Image
                      </div>
                      <div className="text-xs text-gray-600">
                        Flip horizontally
                      </div>
                    </button>
                  </div>
                </div>
              )}

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
                      deleted after transformation. We never store or share your
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
                      99.8%
                    </div>
                    <div className="text-xs text-purple-700">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      2.1s
                    </div>
                    <div className="text-xs text-purple-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      750K+
                    </div>
                    <div className="text-xs text-purple-700">
                      Images Processed
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-xs text-purple-700">Max Images</div>
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

export default ImageRotateFlip;
