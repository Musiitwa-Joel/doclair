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
  Sliders,
  Contrast,
  Droplet,
  Palette,
  Aperture,
  Camera,
  RefreshCw,
  Loader,
  Wand2,
  Maximize,
  Minimize,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

interface BlackAndWhiteOptions {
  conversionMode: "simple" | "channel-mix" | "tonal" | "film" | "custom";
  redChannel: number; // -200 to 300
  greenChannel: number; // -200 to 300
  blueChannel: number; // -200 to 300
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number; // -100 to 100
  grain: number; // 0 to 100
  toning: "none" | "sepia" | "selenium" | "cyanotype" | "platinum";
  toningIntensity: number; // 0 to 100
  vignette: number; // 0 to 100
  filmType?: string;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface BlackAndWhiteResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  conversionMode: string;
  toning: string;
  filmType?: string;
}

const BlackAndWhite: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [conversionResult, setConversionResult] =
    useState<BlackAndWhiteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bwOptions, setBwOptions] = useState<BlackAndWhiteOptions>({
    conversionMode: "simple",
    redChannel: 30,
    greenChannel: 59,
    blueChannel: 11,
    contrast: 20,
    brightness: 0,
    highlights: 0,
    shadows: 0,
    grain: 0,
    toning: "none",
    toningIntensity: 50,
    vignette: 0,
    filmType: "standard",
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
    setConversionResult(null);
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

  const convertToBlackAndWhite = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("bwOptions", JSON.stringify(bwOptions));

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

      const response = await fetch("/api/tools/image/black-and-white", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
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
      const conversionMode =
        response.headers.get("X-Conversion-Mode") || "simple";
      const toning = response.headers.get("X-Toning") || "none";
      const filmType = response.headers.get("X-Film-Type") || undefined;

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `bw_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${bwOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setConversionResult({
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
        conversionMode,
        toning,
        filmType,
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
    if (!conversionResult) return;

    const link = document.createElement("a");
    link.href = conversionResult.downloadUrl;
    link.download = conversionResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setConversionResult(null);
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

  // Film presets for black and white conversion
  const filmPresets = [
    {
      name: "Kodak Tri-X",
      description: "Classic high-contrast film",
      settings: {
        conversionMode: "film",
        redChannel: 25,
        greenChannel: 70,
        blueChannel: 5,
        contrast: 40,
        grain: 30,
        filmType: "tri-x",
      },
    },
    {
      name: "Ilford HP5",
      description: "Versatile medium contrast",
      settings: {
        conversionMode: "film",
        redChannel: 33,
        greenChannel: 50,
        blueChannel: 17,
        contrast: 25,
        grain: 25,
        filmType: "hp5",
      },
    },
    {
      name: "Fuji Acros",
      description: "Fine grain, smooth tones",
      settings: {
        conversionMode: "film",
        redChannel: 30,
        greenChannel: 55,
        blueChannel: 15,
        contrast: 20,
        grain: 10,
        filmType: "acros",
      },
    },
    {
      name: "Kodak T-Max",
      description: "Sharp details, fine grain",
      settings: {
        conversionMode: "film",
        redChannel: 28,
        greenChannel: 60,
        blueChannel: 12,
        contrast: 30,
        grain: 15,
        filmType: "t-max",
      },
    },
    {
      name: "Ilford Delta",
      description: "Smooth tonal range",
      settings: {
        conversionMode: "film",
        redChannel: 35,
        greenChannel: 45,
        blueChannel: 20,
        contrast: 15,
        grain: 20,
        filmType: "delta",
      },
    },
  ];

  // Toning presets
  const toningPresets = [
    {
      name: "Sepia",
      description: "Warm brown tones",
      settings: {
        toning: "sepia",
        toningIntensity: 60,
      },
    },
    {
      name: "Selenium",
      description: "Purple-blue tones",
      settings: {
        toning: "selenium",
        toningIntensity: 50,
      },
    },
    {
      name: "Cyanotype",
      description: "Classic blue print",
      settings: {
        toning: "cyanotype",
        toningIntensity: 70,
      },
    },
    {
      name: "Platinum",
      description: "Rich metallic tones",
      settings: {
        toning: "platinum",
        toningIntensity: 40,
      },
    },
  ];

  const applyFilmPreset = (preset: any) => {
    setBwOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  const applyToningPreset = (preset: any) => {
    setBwOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  return (
    <>
      <Helmet>
        <title>
          Black & White Conversion - Professional Channel Mixing | Doclair
        </title>
        <meta
          name="description"
          content="Convert images to stunning black and white with professional channel mixing. Create film-like effects, add grain, and apply toning for artistic results."
        />
        <meta
          name="keywords"
          content="black and white conversion, channel mixing, monochrome, film simulation, b&w photography, image editing, photo effects"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/black-and-white"
        />
        <meta
          property="og:title"
          content="Black & White Conversion - Professional Channel Mixing | Doclair"
        />
        <meta
          property="og:description"
          content="Professional black and white conversion with channel mixing, film simulation, and darkroom-style toning effects."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl mb-6 shadow-2xl">
                <Contrast className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Black &{" "}
                <span className="cursive-text text-5xl text-gray-700">
                  White
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Professional black and white conversion with{" "}
                <span className="cursive-text text-gray-700 text-xl">
                  channel mixing
                </span>
                . Create film-like effects, add grain, and apply toning for
                artistic results.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Channel Mixing
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Film Simulation
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Toning Effects
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-100 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-gray-600" />
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
                        <div className="bg-gray-200 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-gray-700" />
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
                            Black & White (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Black & White"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                B&W preview will appear here
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-600 border-t-transparent"></div>
                          <span className="font-semibold text-gray-900">
                            Converting to black & white...
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying channel mixing..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            (bwOptions.toning !== "none"
                              ? "Applying toning effect..."
                              : "Enhancing contrast and details...")}
                          {processingProgress >= 90 &&
                            "Finalizing black & white image..."}
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
                              Black & White Conversion Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {conversionResult.processedDimensions.width}×
                                {conversionResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(conversionResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">Mode:</span>{" "}
                                {conversionResult.conversionMode
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </div>
                              {conversionResult.toning !== "none" && (
                                <div>
                                  <span className="font-medium">Toning:</span>{" "}
                                  {conversionResult.toning
                                    .charAt(0)
                                    .toUpperCase() +
                                    conversionResult.toning.slice(1)}
                                </div>
                              )}
                              {conversionResult.filmType && (
                                <div>
                                  <span className="font-medium">
                                    Film Type:
                                  </span>{" "}
                                  {conversionResult.filmType}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Black & White Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Convert Button */}
                    {!isProcessing && !conversionResult && (
                      <button
                        onClick={convertToBlackAndWhite}
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-gray-800 hover:to-black transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Contrast className="h-6 w-6" />
                        Convert to Black & White
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

              {/* Conversion Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-gray-600" />
                    Conversion Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Conversion Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Conversion Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          {
                            value: "simple",
                            label: "Simple",
                            desc: "Standard B&W",
                            icon: Contrast,
                          },
                          {
                            value: "channel-mix",
                            label: "Channel Mix",
                            desc: "Custom RGB mix",
                            icon: Sliders,
                          },
                          {
                            value: "tonal",
                            label: "Tonal",
                            desc: "Highlight/shadow",
                            icon: Droplet,
                          },
                          {
                            value: "film",
                            label: "Film",
                            desc: "Film simulation",
                            icon: Camera,
                          },
                          {
                            value: "custom",
                            label: "Custom",
                            desc: "All controls",
                            icon: SlidersHorizontal,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setBwOptions((prev) => ({
                                ...prev,
                                conversionMode: mode.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              bwOptions.conversionMode === mode.value
                                ? "border-gray-700 bg-gray-100 text-gray-900"
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

                    {/* Channel Mixing (for channel-mix or custom mode) */}
                    {(bwOptions.conversionMode === "channel-mix" ||
                      bwOptions.conversionMode === "custom") && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Channel Mixing
                        </label>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="text-xs text-gray-600">
                                Red Channel: {bwOptions.redChannel}%
                              </label>
                              <button
                                onClick={() =>
                                  setBwOptions((prev) => ({
                                    ...prev,
                                    redChannel: 30,
                                  }))
                                }
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Reset
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-200"
                              max="300"
                              value={bwOptions.redChannel}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  redChannel: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="text-xs text-gray-600">
                                Green Channel: {bwOptions.greenChannel}%
                              </label>
                              <button
                                onClick={() =>
                                  setBwOptions((prev) => ({
                                    ...prev,
                                    greenChannel: 59,
                                  }))
                                }
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Reset
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-200"
                              max="300"
                              value={bwOptions.greenChannel}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  greenChannel: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="text-xs text-gray-600">
                                Blue Channel: {bwOptions.blueChannel}%
                              </label>
                              <button
                                onClick={() =>
                                  setBwOptions((prev) => ({
                                    ...prev,
                                    blueChannel: 11,
                                  }))
                                }
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Reset
                              </button>
                            </div>
                            <input
                              type="range"
                              min="-200"
                              max="300"
                              value={bwOptions.blueChannel}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  blueChannel: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Tip: Adjust channel values to control how different
                          colors translate to black and white tones.
                        </div>
                      </div>
                    )}

                    {/* Tonal Adjustments (for tonal or custom mode) */}
                    {(bwOptions.conversionMode === "tonal" ||
                      bwOptions.conversionMode === "custom") && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Tonal Adjustments
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Contrast: {bwOptions.contrast}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={bwOptions.contrast}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  contrast: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Brightness: {bwOptions.brightness}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={bwOptions.brightness}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  brightness: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Highlights: {bwOptions.highlights}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={bwOptions.highlights}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  highlights: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Shadows: {bwOptions.shadows}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={bwOptions.shadows}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  shadows: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Film Effects (for film or custom mode) */}
                    {(bwOptions.conversionMode === "film" ||
                      bwOptions.conversionMode === "custom") && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Film Effects
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Film Grain: {bwOptions.grain}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={bwOptions.grain}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  grain: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Vignette: {bwOptions.vignette}
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={bwOptions.vignette}
                              onChange={(e) =>
                                setBwOptions((prev) => ({
                                  ...prev,
                                  vignette: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Toning Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Toning Effect
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                        {[
                          { value: "none", label: "None" },
                          { value: "sepia", label: "Sepia" },
                          { value: "selenium", label: "Selenium" },
                          { value: "cyanotype", label: "Cyanotype" },
                          { value: "platinum", label: "Platinum" },
                        ].map((tone) => (
                          <button
                            key={tone.value}
                            onClick={() =>
                              setBwOptions((prev) => ({
                                ...prev,
                                toning: tone.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                              bwOptions.toning === tone.value
                                ? "border-gray-700 bg-gray-100 text-gray-900"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold text-sm">
                              {tone.label}
                            </div>
                          </button>
                        ))}
                      </div>
                      {bwOptions.toning !== "none" && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Toning Intensity: {bwOptions.toningIntensity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bwOptions.toningIntensity}
                            onChange={(e) =>
                              setBwOptions((prev) => ({
                                ...prev,
                                toningIntensity: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={bwOptions.outputFormat}
                          onChange={(e) =>
                            setBwOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="png">PNG (Better quality)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {bwOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={bwOptions.quality}
                          onChange={(e) =>
                            setBwOptions((prev) => ({
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
              {/* Film Presets */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-gray-700" />
                    Film Presets
                  </h3>
                  <div className="space-y-2">
                    {filmPresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyFilmPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200"
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

              {/* Toning Presets */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-gray-700" />
                    Toning Presets
                  </h3>
                  <div className="space-y-2">
                    {toningPresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyToningPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200"
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
                  <Sparkles className="h-5 w-5 text-gray-700" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Sliders className="h-5 w-5 text-gray-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Channel Mixing
                      </div>
                      <div className="text-xs text-gray-600">
                        Control how each color channel contributes to the final
                        monochrome image
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Camera className="h-5 w-5 text-gray-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Film Simulation
                      </div>
                      <div className="text-xs text-gray-600">
                        Recreate the look of classic black & white film stocks
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Droplet className="h-5 w-5 text-gray-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Darkroom Toning
                      </div>
                      <div className="text-xs text-gray-600">
                        Apply sepia, selenium, and other traditional toning
                        effects
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Filter className="h-5 w-5 text-gray-700 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Grain & Vignette
                      </div>
                      <div className="text-xs text-gray-600">
                        Add authentic film grain and darkened edges for artistic
                        effect
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
                    <div className="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your color image
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose a conversion mode and adjust settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Apply film simulation or toning if desired
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your professional black & white image
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
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Fine art photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Portrait photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Landscape images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Street photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Architectural shots
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Vintage-style images
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
                      deleted after conversion. We never store or share your
                      images.
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      99.8%
                    </div>
                    <div className="text-xs text-gray-600">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">2.5s</div>
                    <div className="text-xs text-gray-600">Avg. Processing</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      280K+
                    </div>
                    <div className="text-xs text-gray-600">
                      Images Converted
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      4.9/5
                    </div>
                    <div className="text-xs text-gray-600">User Rating</div>
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

export default BlackAndWhite;
