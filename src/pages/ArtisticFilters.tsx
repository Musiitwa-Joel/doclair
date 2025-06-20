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
  Brush,
  PaintBucket,
  Pencil,
  Droplet,
  Wand2,
  Sliders,
  Maximize,
  Minimize,
  RefreshCw,
  Loader,
  Scissors,
  Pipette,
  Framer,
  Paintbrush,
  Feather,
  Pen,
  Eraser,
} from "lucide-react";

interface ArtisticFilterOptions {
  filterType:
    | "oil"
    | "watercolor"
    | "sketch"
    | "comic"
    | "pointillism"
    | "impressionist";
  intensity: number; // 1-100
  detailLevel: number; // 1-100
  colorSaturation: number; // 1-100
  brushSize: number; // 1-100
  strokeDensity: number; // 1-100
  preserveDetails: boolean;
  enhanceContrast: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  borderStyle?: "none" | "simple" | "artistic" | "frame";
  borderColor?: string;
  borderWidth?: number;
  backgroundTexture?: "none" | "canvas" | "paper" | "rough";
}

interface ArtisticFilterResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  filterApplied: string;
  effectIntensity: number;
  artisticScore: number;
}

const ArtisticFilters: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [filterResult, setFilterResult] = useState<ArtisticFilterResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<ArtisticFilterOptions>({
    filterType: "oil",
    intensity: 75,
    detailLevel: 60,
    colorSaturation: 80,
    brushSize: 50,
    strokeDensity: 70,
    preserveDetails: true,
    enhanceContrast: true,
    outputFormat: "png",
    quality: 95,
    borderStyle: "none",
    borderColor: "#ffffff",
    borderWidth: 20,
    backgroundTexture: "none",
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
    setFilterResult(null);
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

  const applyArtisticFilter = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("filterOptions", JSON.stringify(filterOptions));

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

      const response = await fetch("/api/tools/image/artistic-filter", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Filter application failed");
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
      const filterApplied = response.headers.get("X-Filter-Applied") || "";
      const effectIntensity = parseInt(
        response.headers.get("X-Effect-Intensity") || "0"
      );
      const artisticScore = parseFloat(
        response.headers.get("X-Artistic-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `${filterOptions.filterType}_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${filterOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setFilterResult({
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
        filterApplied,
        effectIntensity,
        artisticScore,
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
    if (!filterResult) return;

    const link = document.createElement("a");
    link.href = filterResult.downloadUrl;
    link.download = filterResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setFilterResult(null);
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

  // Filter type icons
  const filterIcons = {
    oil: Paintbrush,
    watercolor: Droplet,
    sketch: Pencil,
    comic: Framer,
    pointillism: Pipette,
    impressionist: Brush,
  };

  // Get the current filter icon
  const FilterIcon = filterIcons[filterOptions.filterType];

  return (
    <>
      <Helmet>
        <title>
          Artistic Filters - Oil Painting, Watercolor & Sketch Effects | Doclair
        </title>
        <meta
          name="description"
          content="Transform your photos into stunning artistic masterpieces. Apply oil painting, watercolor, sketch, and other artistic effects with professional quality."
        />
        <meta
          name="keywords"
          content="artistic filters, oil painting effect, watercolor filter, sketch effect, photo to art, digital painting, artistic transformation"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/artistic-filters"
        />
        <meta
          property="og:title"
          content="Artistic Filters - Oil Painting, Watercolor & Sketch Effects"
        />
        <meta
          property="og:description"
          content="Transform your photos into stunning artistic masterpieces with professional-quality filters and effects."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl">
                <Palette className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Artistic{" "}
                <span className="cursive-text text-5xl text-purple-600">
                  Filters
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Transform your photos into stunning{" "}
                <span className="cursive-text text-indigo-600 text-xl">
                  artistic masterpieces
                </span>
                . Apply oil painting, watercolor, sketch, and other artistic
                effects with professional quality.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" />
                  Oil Painting
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Watercolor
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Sketch Effect
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
                            Artistic (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Artistic"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                Artistic preview will appear here
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
                            Applying {filterOptions.filterType} effect...
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-purple-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying artistic transformation..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Enhancing artistic details..."}
                          {processingProgress >= 90 &&
                            "Finalizing artistic effect..."}
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
                              Filter Application Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Filter Result */}
                    {filterResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Artistic Filter Applied!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {filterResult.processedDimensions.width}×
                                {filterResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(filterResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Filter Applied:
                                </span>{" "}
                                {filterResult.filterApplied
                                  .charAt(0)
                                  .toUpperCase() +
                                  filterResult.filterApplied.slice(1)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Artistic Score:
                                </span>{" "}
                                {filterResult.artisticScore.toFixed(1)}/10
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Artistic Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Apply Filter Button */}
                    {!isProcessing && !filterResult && (
                      <button
                        onClick={applyArtisticFilter}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <FilterIcon className="h-6 w-6" />
                        Apply{" "}
                        {filterOptions.filterType.charAt(0).toUpperCase() +
                          filterOptions.filterType.slice(1)}{" "}
                        Effect
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

              {/* Filter Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Filter Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Filter Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Artistic Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          {
                            value: "oil",
                            label: "Oil Painting",
                            icon: Paintbrush,
                            color: "from-blue-500 to-blue-600",
                          },
                          {
                            value: "watercolor",
                            label: "Watercolor",
                            icon: Droplet,
                            color: "from-green-500 to-green-600",
                          },
                          {
                            value: "sketch",
                            label: "Sketch",
                            icon: Pencil,
                            color: "from-gray-500 to-gray-600",
                          },
                          {
                            value: "comic",
                            label: "Comic",
                            icon: Framer,
                            color: "from-yellow-500 to-yellow-600",
                          },
                          {
                            value: "pointillism",
                            label: "Pointillism",
                            icon: Pipette,
                            color: "from-red-500 to-red-600",
                          },
                          {
                            value: "impressionist",
                            label: "Impressionist",
                            icon: Brush,
                            color: "from-purple-500 to-purple-600",
                          },
                        ].map((filter) => (
                          <button
                            key={filter.value}
                            onClick={() =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                filterType: filter.value as any,
                              }))
                            }
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                              filterOptions.filterType === filter.value
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${filter.color} text-white`}
                              >
                                <filter.icon className="h-4 w-4" />
                              </div>
                              <div className="font-semibold text-sm">
                                {filter.label}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intensity and Detail Level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Effect Intensity: {filterOptions.intensity}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={filterOptions.intensity}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Detail Level: {filterOptions.detailLevel}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={filterOptions.detailLevel}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
                              ...prev,
                              detailLevel: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Smooth</span>
                          <span>Balanced</span>
                          <span>Detailed</span>
                        </div>
                      </div>
                    </div>

                    {/* Color and Brush Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Color Saturation: {filterOptions.colorSaturation}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={filterOptions.colorSaturation}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
                              ...prev,
                              colorSaturation: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Brush Size: {filterOptions.brushSize}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={filterOptions.brushSize}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
                              ...prev,
                              brushSize: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Stroke Density: {filterOptions.strokeDensity}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={filterOptions.strokeDensity}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
                              ...prev,
                              strokeDensity: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Enhancement Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            checked={filterOptions.preserveDetails}
                            onChange={(e) =>
                              setFilterOptions((prev) => ({
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
                          <Sliders className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              Enhance Contrast
                            </div>
                            <div className="text-xs text-gray-600">
                              Improve visual impact
                            </div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterOptions.enhanceContrast}
                            onChange={(e) =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                enhanceContrast: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Border Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Border Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: "none", label: "None" },
                          { value: "simple", label: "Simple" },
                          { value: "artistic", label: "Artistic" },
                          { value: "frame", label: "Frame" },
                        ].map((border) => (
                          <button
                            key={border.value}
                            onClick={() =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                borderStyle: border.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                              filterOptions.borderStyle === border.value
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            {border.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Settings (if border is enabled) */}
                    {filterOptions.borderStyle !== "none" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Border Color
                          </label>
                          <input
                            type="color"
                            value={filterOptions.borderColor}
                            onChange={(e) =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                borderColor: e.target.value,
                              }))
                            }
                            className="w-full h-10 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Border Width: {filterOptions.borderWidth}px
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={filterOptions.borderWidth}
                            onChange={(e) =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                borderWidth: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={filterOptions.outputFormat}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="png">PNG (Best quality)</option>
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {filterOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={filterOptions.quality}
                          onChange={(e) =>
                            setFilterOptions((prev) => ({
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
              {/* Filter Examples */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Filter Examples
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "oil",
                          intensity: 80,
                          detailLevel: 70,
                          colorSaturation: 90,
                          brushSize: 40,
                          strokeDensity: 60,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg mb-2">
                        <Paintbrush className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Oil Painting
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "watercolor",
                          intensity: 70,
                          detailLevel: 50,
                          colorSaturation: 75,
                          brushSize: 60,
                          strokeDensity: 50,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-lg mb-2">
                        <Droplet className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Watercolor
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "sketch",
                          intensity: 75,
                          detailLevel: 85,
                          colorSaturation: 10,
                          brushSize: 30,
                          strokeDensity: 90,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-2 rounded-lg mb-2">
                        <Pencil className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Sketch
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "comic",
                          intensity: 85,
                          detailLevel: 90,
                          colorSaturation: 95,
                          brushSize: 20,
                          strokeDensity: 80,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-2 rounded-lg mb-2">
                        <Framer className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Comic
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "pointillism",
                          intensity: 75,
                          detailLevel: 60,
                          colorSaturation: 85,
                          brushSize: 30,
                          strokeDensity: 90,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-lg mb-2">
                        <Pipette className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Pointillism
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          filterType: "impressionist",
                          intensity: 70,
                          detailLevel: 40,
                          colorSaturation: 80,
                          brushSize: 70,
                          strokeDensity: 60,
                        }))
                      }
                      className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2 rounded-lg mb-2">
                        <Brush className="h-5 w-5 mx-auto" />
                      </div>
                      <div className="text-sm font-semibold text-center">
                        Impressionist
                      </div>
                    </button>
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
                    <Paintbrush className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Oil Painting Effect
                      </div>
                      <div className="text-xs text-gray-600">
                        Transform photos into realistic oil paintings
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Droplet className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Watercolor Effect
                      </div>
                      <div className="text-xs text-gray-600">
                        Create soft, flowing watercolor renditions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Pencil className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Sketch Effect
                      </div>
                      <div className="text-xs text-gray-600">
                        Convert images to hand-drawn pencil sketches
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sliders className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Customizable Settings
                      </div>
                      <div className="text-xs text-gray-600">
                        Fine-tune every aspect of your artistic effect
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
                      Upload your photo
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose an artistic style and customize settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Our algorithms transform your image into artwork
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your artistic masterpiece
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
                      Social media posts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Wall art and prints
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Digital portfolios
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Creative projects
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Greeting cards
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Website graphics
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
                      99.8%
                    </div>
                    <div className="text-xs text-purple-700">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      3.5s
                    </div>
                    <div className="text-xs text-purple-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      250K+
                    </div>
                    <div className="text-xs text-purple-700">
                      Images Transformed
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

export default ArtisticFilters;
