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
  Film,
  Camera,
  Palette,
  Sliders,
  Droplet,
  Contrast,
  Calendar,
  Aperture,
  Brush,
  Scissors,
  Loader,
  Lightbulb,
  Brain as Grain,
  Framer,
  Maximize,
  Minimize,
  Thermometer,
  Sunset,
  Sunrise,
  Scan,
  Wand2,
} from "lucide-react";

interface VintageEffectOptions {
  vintageStyle:
    | "classic"
    | "sepia"
    | "noir"
    | "faded"
    | "technicolor"
    | "polaroid"
    | "cinematic"
    | "retro"
    | "custom";
  intensity: number; // 1-100
  filmGrain: number; // 0-100
  colorShift: number; // -100 to 100
  vignette: boolean;
  vignetteIntensity?: number; // 0-100
  lightLeak: boolean;
  lightLeakType?: "none" | "soft" | "harsh" | "random";
  scratches: boolean;
  colorBalance: {
    red: number; // -100 to 100
    green: number; // -100 to 100
    blue: number; // -100 to 100
  };
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  saturation: number; // -100 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  border?: "none" | "white" | "black" | "film" | "polaroid";
  borderWidth?: number;
  dateStamp?: boolean;
  dateFormat?: string;
}

interface VintageEffectResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  vintageStyle: string;
  effectIntensity: number;
  filmGrain: number;
  colorShift: number;
  vignette: boolean;
}

const VintageEffects: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [effectResult, setEffectResult] = useState<VintageEffectResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [effectOptions, setEffectOptions] = useState<VintageEffectOptions>({
    vintageStyle: "classic",
    intensity: 75,
    filmGrain: 50,
    colorShift: 0,
    vignette: true,
    vignetteIntensity: 50,
    lightLeak: false,
    lightLeakType: "none",
    scratches: false,
    colorBalance: {
      red: 0,
      green: 0,
      blue: 0,
    },
    contrast: 10,
    brightness: 5,
    saturation: -10,
    outputFormat: "jpg",
    quality: 90,
    border: "none",
    borderWidth: 20,
    dateStamp: false,
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
    setEffectResult(null);
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

  const applyVintageEffect = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("vintageOptions", JSON.stringify(effectOptions));

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

      const response = await fetch("/api/tools/image/vintage-effect", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Vintage effect application failed");
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
      const vintageStyle = response.headers.get("X-Vintage-Style") || "classic";
      const effectIntensity = parseFloat(
        response.headers.get("X-Effect-Intensity") || "0"
      );
      const filmGrain = parseFloat(response.headers.get("X-Film-Grain") || "0");
      const colorShift = parseFloat(
        response.headers.get("X-Color-Shift") || "0"
      );
      const vignette = response.headers.get("X-Vignette") === "true";

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `vintage_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${effectOptions.outputFormat}`
        )}`;

      // Create a preview of the processed image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProcessedPreview(e.target?.result as string);
      };
      reader.readAsDataURL(blob);

      setEffectResult({
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
        vintageStyle,
        effectIntensity,
        filmGrain,
        colorShift,
        vignette,
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
    if (!effectResult) return;

    const link = document.createElement("a");
    link.href = effectResult.downloadUrl;
    link.download = effectResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setEffectResult(null);
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

  // Presets for common vintage effects
  const presets = [
    {
      name: "1970s Film",
      description: "Warm tones with grain",
      settings: {
        vintageStyle: "classic",
        intensity: 80,
        filmGrain: 60,
        vignette: true,
        vignetteIntensity: 40,
        colorShift: 15,
        contrast: 15,
        saturation: -15,
      },
    },
    {
      name: "Sepia Memories",
      description: "Classic sepia tone",
      settings: {
        vintageStyle: "sepia",
        intensity: 90,
        filmGrain: 30,
        vignette: true,
        vignetteIntensity: 60,
        scratches: true,
      },
    },
    {
      name: "Film Noir",
      description: "High contrast B&W",
      settings: {
        vintageStyle: "noir",
        intensity: 100,
        filmGrain: 70,
        vignette: true,
        vignetteIntensity: 80,
        contrast: 30,
      },
    },
    {
      name: "Faded Polaroid",
      description: "Soft, faded look",
      settings: {
        vintageStyle: "polaroid",
        intensity: 75,
        filmGrain: 20,
        vignette: true,
        border: "polaroid",
        borderWidth: 30,
        dateStamp: true,
        brightness: 10,
        contrast: -10,
      },
    },
    {
      name: "Technicolor",
      description: "Vibrant vintage cinema",
      settings: {
        vintageStyle: "technicolor",
        intensity: 85,
        filmGrain: 15,
        colorShift: 5,
        saturation: 20,
        contrast: 20,
      },
    },
    {
      name: "80s Retro",
      description: "Vibrant neon-inspired",
      settings: {
        vintageStyle: "retro",
        intensity: 70,
        filmGrain: 10,
        colorShift: -10,
        saturation: 30,
        contrast: 15,
        colorBalance: {
          red: 10,
          green: -5,
          blue: 15,
        },
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setEffectOptions((prev) => ({
      ...prev,
      ...preset.settings,
    }));
  };

  return (
    <>
      <Helmet>
        <title>Vintage Effects - Retro Film & Photo Filters | Doclair</title>
        <meta
          name="description"
          content="Apply vintage film effects and retro color grading to your photos. Create classic film looks, sepia tones, polaroid styles, and more."
        />
        <meta
          name="keywords"
          content="vintage effects, retro film, photo filters, film grain, vignette, sepia, polaroid, film noir, color grading"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/vintage-effects"
        />
        <meta
          property="og:title"
          content="Vintage Effects - Retro Film & Photo Filters"
        />
        <meta
          property="og:description"
          content="Transform your photos with professional vintage film effects and retro color grading."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mb-6 shadow-2xl">
                <Film className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Vintage{" "}
                <span className="cursive-text text-5xl text-amber-600">
                  Effects
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Transform your photos with{" "}
                <span className="cursive-text text-amber-600 text-xl">
                  professional
                </span>{" "}
                vintage film effects and retro color grading. Create classic
                film looks, sepia tones, polaroid styles, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Film Emulation
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Grain className="h-4 w-4" />
                  Film Grain
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Light Leaks
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Framer className="h-4 w-4" />
                  Polaroid Frames
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-amber-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-amber-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-amber-600" />
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
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-amber-600" />
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
                            Vintage Effect (Preview)
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
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-600 border-t-transparent"></div>
                          <span className="font-semibold text-amber-900">
                            Applying vintage effect...
                          </span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-amber-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying color grading..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Adding film effects..."}
                          {processingProgress >= 90 &&
                            "Finalizing vintage look..."}
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
                              Effect Application Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Effect Result */}
                    {effectResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Vintage Effect Applied!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {effectResult.processedDimensions.width}×
                                {effectResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(effectResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">Style:</span>{" "}
                                {effectResult.vintageStyle
                                  .charAt(0)
                                  .toUpperCase() +
                                  effectResult.vintageStyle.slice(1)}
                              </div>
                              <div>
                                <span className="font-medium">Film Grain:</span>{" "}
                                {effectResult.filmGrain}%
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Vintage Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Apply Effect Button */}
                    {!isProcessing && !effectResult && (
                      <button
                        onClick={applyVintageEffect}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Film className="h-6 w-6" />
                        Apply Vintage Effect
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

              {/* Effect Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Vintage Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Vintage Style */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Vintage Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {
                            value: "classic",
                            label: "Classic Film",
                            desc: "Warm tones",
                            icon: Film,
                          },
                          {
                            value: "sepia",
                            label: "Sepia",
                            desc: "Antique look",
                            icon: Sunset,
                          },
                          {
                            value: "noir",
                            label: "Film Noir",
                            desc: "High contrast B&W",
                            icon: Contrast,
                          },
                          {
                            value: "faded",
                            label: "Faded",
                            desc: "Soft, washed out",
                            icon: Droplet,
                          },
                          {
                            value: "technicolor",
                            label: "Technicolor",
                            desc: "Vibrant cinema",
                            icon: Palette,
                          },
                          {
                            value: "polaroid",
                            label: "Polaroid",
                            desc: "Instant camera",
                            icon: Camera,
                          },
                          {
                            value: "cinematic",
                            label: "Cinematic",
                            desc: "Movie color grade",
                            icon: Aperture,
                          },
                          {
                            value: "retro",
                            label: "Retro",
                            desc: "80s/90s style",
                            icon: Sunrise,
                          },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                vintageStyle: style.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              effectOptions.vintageStyle === style.value
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <style.icon className="h-4 w-4" />
                              <div className="font-semibold text-sm">
                                {style.label}
                              </div>
                            </div>
                            <div className="text-xs opacity-75">
                              {style.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intensity and Film Grain */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Effect Intensity: {effectOptions.intensity}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={effectOptions.intensity}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              intensity: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Subtle</span>
                          <span>Balanced</span>
                          <span>Strong</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Film Grain: {effectOptions.filmGrain}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={effectOptions.filmGrain}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              filmGrain: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>None</span>
                          <span>Medium</span>
                          <span>Heavy</span>
                        </div>
                      </div>
                    </div>

                    {/* Color Shift and Vignette */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Color Shift: {effectOptions.colorShift > 0 ? "+" : ""}
                          {effectOptions.colorShift}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={effectOptions.colorShift}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              colorShift: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Cool (Blue)</span>
                          <span>Neutral</span>
                          <span>Warm (Yellow)</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Vignette Effect
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={effectOptions.vignette}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  vignette: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>
                        {effectOptions.vignette && (
                          <>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={effectOptions.vignetteIntensity || 50}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  vignetteIntensity: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Subtle</span>
                              <span>Medium</span>
                              <span>Strong</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Light Leaks and Scratches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Light Leak Effect
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={effectOptions.lightLeak}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  lightLeak: e.target.checked,
                                  lightLeakType: e.target.checked
                                    ? "soft"
                                    : "none",
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                        </div>
                        {effectOptions.lightLeak && (
                          <select
                            value={effectOptions.lightLeakType}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                lightLeakType: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="soft">Soft Light Leak</option>
                            <option value="harsh">Harsh Light Leak</option>
                            <option value="random">Random Position</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Film Scratches
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={effectOptions.scratches}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  scratches: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Adds random film scratches and dust for an authentic
                          vintage look
                        </div>
                      </div>
                    </div>

                    {/* Border Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Border Style
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {[
                          {
                            value: "none",
                            label: "None",
                          },
                          {
                            value: "white",
                            label: "White",
                          },
                          {
                            value: "black",
                            label: "Black",
                          },
                          {
                            value: "film",
                            label: "Film",
                          },
                          {
                            value: "polaroid",
                            label: "Polaroid",
                          },
                        ].map((border) => (
                          <button
                            key={border.value}
                            onClick={() =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                border: border.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                              effectOptions.border === border.value
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold text-sm">
                              {border.label}
                            </div>
                          </button>
                        ))}
                      </div>
                      {effectOptions.border !== "none" && (
                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">
                            Border Width: {effectOptions.borderWidth}px
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            value={effectOptions.borderWidth}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                borderWidth: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      )}
                      {effectOptions.border === "polaroid" && (
                        <div className="mt-3 flex items-center">
                          <input
                            type="checkbox"
                            id="dateStamp"
                            checked={effectOptions.dateStamp}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                dateStamp: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                          />
                          <label
                            htmlFor="dateStamp"
                            className="text-sm text-gray-700"
                          >
                            Add date stamp
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Advanced Settings (for Custom style) */}
                    {effectOptions.vintageStyle === "custom" && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sliders className="h-5 w-5 text-purple-600" />
                          <label className="block text-sm font-semibold text-gray-700">
                            Advanced Color Settings
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Brightness:{" "}
                              {effectOptions.brightness > 0 ? "+" : ""}
                              {effectOptions.brightness}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={effectOptions.brightness}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  brightness: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Contrast: {effectOptions.contrast > 0 ? "+" : ""}
                              {effectOptions.contrast}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={effectOptions.contrast}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  contrast: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Saturation:{" "}
                              {effectOptions.saturation > 0 ? "+" : ""}
                              {effectOptions.saturation}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={effectOptions.saturation}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  saturation: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-xs text-gray-600 mb-1">
                            Color Balance
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>
                                  Red: {effectOptions.colorBalance.red}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={effectOptions.colorBalance.red}
                                onChange={(e) =>
                                  setEffectOptions((prev) => ({
                                    ...prev,
                                    colorBalance: {
                                      ...prev.colorBalance,
                                      red: parseInt(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>
                                  Green: {effectOptions.colorBalance.green}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={effectOptions.colorBalance.green}
                                onChange={(e) =>
                                  setEffectOptions((prev) => ({
                                    ...prev,
                                    colorBalance: {
                                      ...prev.colorBalance,
                                      green: parseInt(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>
                                  Blue: {effectOptions.colorBalance.blue}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={effectOptions.colorBalance.blue}
                                onChange={(e) =>
                                  setEffectOptions((prev) => ({
                                    ...prev,
                                    colorBalance: {
                                      ...prev.colorBalance,
                                      blue: parseInt(e.target.value),
                                    },
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                          </div>
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
                          value={effectOptions.outputFormat}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="png">PNG (Better quality)</option>
                          <option value="webp">WebP (Modern format)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {effectOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={effectOptions.quality}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
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
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    Vintage Presets
                  </h3>
                  <div className="space-y-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
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
                    <Film className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Film Emulation
                      </div>
                      <div className="text-xs text-gray-600">
                        Authentic vintage film color profiles
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Grain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Film Grain & Texture
                      </div>
                      <div className="text-xs text-gray-600">
                        Add realistic film grain and scratches
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Light Leaks & Vignettes
                      </div>
                      <div className="text-xs text-gray-600">
                        Simulate film camera light leaks and lens vignetting
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Framer className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Authentic Borders
                      </div>
                      <div className="text-xs text-gray-600">
                        Add film and polaroid-style frames
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
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your digital photo
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose a vintage style or use a preset
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Customize film grain, color, and effects
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your vintage-styled photo
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
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Social media posts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Photography portfolios
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Retro-themed projects
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Album covers and posters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Digital scrapbooking
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Nostalgic gift photos
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-amber-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-amber-600">8</div>
                    <div className="text-xs text-amber-700">Vintage Styles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      2.8s
                    </div>
                    <div className="text-xs text-amber-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      280K+
                    </div>
                    <div className="text-xs text-amber-700">
                      Photos Processed
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      4.9/5
                    </div>
                    <div className="text-xs text-amber-700">User Rating</div>
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

export default VintageEffects;
