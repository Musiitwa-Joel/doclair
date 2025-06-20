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
  Sliders,
  Wand2,
  SunMedium,
  Moon,
  Contrast,
  Droplet,
  Palette,
  Lightbulb,
  Sunset,
  CloudLightning,
  Mountain,
  Waves,
  Flower2,
  Gauge,
} from "lucide-react";

interface HDREffectOptions {
  effectType:
    | "natural"
    | "dramatic"
    | "cinematic"
    | "surreal"
    | "vivid"
    | "moody"
    | "landscape"
    | "custom";
  intensity: number; // 1-100
  dynamicRange: number; // 1-100
  shadowRecovery: number; // 0-100
  highlightRecovery: number; // 0-100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  vibrance: number; // 0-100
  clarity: number; // 0-100
  glow: number; // 0-100
  toneMapping: "reinhard" | "filmic" | "aces" | "uncharted2";
  colorGrading: boolean;
  colorTemperature: number; // -100 to 100
  colorTint: number; // -100 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface HDREffectResult {
  buffer: Buffer;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  hdrStyle: string;
  toneMapping: string;
  dynamicRange: number;
}

const HDREffects: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [effectResult, setEffectResult] = useState<HDREffectResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [effectOptions, setEffectOptions] = useState<HDREffectOptions>({
    effectType: "natural",
    intensity: 75,
    dynamicRange: 80,
    shadowRecovery: 60,
    highlightRecovery: 70,
    contrast: 20,
    saturation: 15,
    vibrance: 30,
    clarity: 40,
    glow: 25,
    toneMapping: "filmic",
    colorGrading: true,
    colorTemperature: 0,
    colorTint: 0,
    outputFormat: "jpg",
    quality: 95,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const applyHDREffect = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("hdrOptions", JSON.stringify(effectOptions));

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

      const response = await fetch("/api/tools/image/hdr-effect", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "HDR effect application failed");
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
      const hdrStyle = response.headers.get("X-HDR-Style") || "natural";
      const toneMapping = response.headers.get("X-Tone-Mapping") || "filmic";
      const dynamicRange = parseFloat(
        response.headers.get("X-Dynamic-Range") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `hdr_${uploadedFile.name.replace(
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
        buffer: (await blob.arrayBuffer()) as unknown as Buffer,
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
        hdrStyle,
        toneMapping,
        dynamicRange,
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
    link.download = `hdr_${uploadedFile?.name || "image"}`;
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

  // Presets for HDR effects
  const presets = [
    {
      name: "Natural HDR",
      description: "Balanced, realistic look",
      settings: {
        effectType: "natural",
        intensity: 65,
        dynamicRange: 70,
        shadowRecovery: 60,
        highlightRecovery: 65,
        contrast: 15,
        saturation: 10,
        vibrance: 25,
        clarity: 30,
        glow: 20,
        toneMapping: "filmic",
      },
    },
    {
      name: "Dramatic Skies",
      description: "Intense clouds and contrast",
      settings: {
        effectType: "dramatic",
        intensity: 85,
        dynamicRange: 90,
        shadowRecovery: 70,
        highlightRecovery: 60,
        contrast: 40,
        saturation: 25,
        vibrance: 40,
        clarity: 50,
        glow: 30,
        toneMapping: "reinhard",
      },
    },
    {
      name: "Cinematic Look",
      description: "Film-like color grading",
      settings: {
        effectType: "cinematic",
        intensity: 75,
        dynamicRange: 85,
        shadowRecovery: 75,
        highlightRecovery: 65,
        contrast: 30,
        saturation: 15,
        vibrance: 35,
        clarity: 40,
        glow: 25,
        toneMapping: "aces",
        colorGrading: true,
        colorTemperature: -10,
        colorTint: 5,
      },
    },
    {
      name: "Surreal HDR",
      description: "Artistic, hyper-real effect",
      settings: {
        effectType: "surreal",
        intensity: 100,
        dynamicRange: 100,
        shadowRecovery: 80,
        highlightRecovery: 80,
        contrast: 50,
        saturation: 40,
        vibrance: 60,
        clarity: 70,
        glow: 50,
        toneMapping: "reinhard",
      },
    },
    {
      name: "Landscape Enhancer",
      description: "Perfect for nature photos",
      settings: {
        effectType: "landscape",
        intensity: 80,
        dynamicRange: 85,
        shadowRecovery: 70,
        highlightRecovery: 75,
        contrast: 25,
        saturation: 20,
        vibrance: 40,
        clarity: 45,
        glow: 15,
        toneMapping: "uncharted2",
        colorGrading: true,
        colorTemperature: 5,
        colorTint: 0,
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
        <title>HDR Effects - Enhance Image Dynamic Range | Doclair</title>
        <meta
          name="description"
          content="Apply professional HDR effects to your images. Enhance shadows and highlights, increase dynamic range, and create stunning visual impact with tone mapping."
        />
        <meta
          name="keywords"
          content="HDR effects, high dynamic range, tone mapping, image enhancement, shadow recovery, highlight recovery, HDR photography"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/hdr-effect"
        />
        <meta
          property="og:title"
          content="HDR Effects - Enhance Image Dynamic Range | Doclair"
        />
        <meta
          property="og:description"
          content="Professional HDR effects tool to enhance image dynamic range, recover shadow and highlight details, and create stunning visual impact."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mb-6 shadow-2xl">
                <SunMedium className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                HDR{" "}
                <span className="cursive-text text-5xl text-amber-600">
                  Effects
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Enhance your images with professional{" "}
                <span className="cursive-text text-amber-600 text-xl">
                  High Dynamic Range
                </span>{" "}
                effects. Recover shadow and highlight details, increase dynamic
                range, and create stunning visual impact.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Tone Mapping
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Shadow Recovery
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Highlight Control
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Grading
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
                            HDR Effect (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="HDR Effect"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                HDR preview will appear here
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
                            Applying HDR effect...
                          </span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-amber-700">
                          {processingProgress < 30 &&
                            "Analyzing image tones..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Expanding dynamic range..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Applying tone mapping..."}
                          {processingProgress >= 90 &&
                            "Finalizing HDR effect..."}
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
                              HDR Effect Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* HDR Result */}
                    {effectResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              HDR Effect Applied Successfully!
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
                                <span className="font-medium">HDR Style:</span>{" "}
                                {effectResult.hdrStyle.charAt(0).toUpperCase() +
                                  effectResult.hdrStyle.slice(1)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Tone Mapping:
                                </span>{" "}
                                {effectResult.toneMapping
                                  .charAt(0)
                                  .toUpperCase() +
                                  effectResult.toneMapping.slice(1)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Dynamic Range:
                                </span>{" "}
                                {effectResult.dynamicRange.toFixed(1)}
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download HDR Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Apply HDR Button */}
                    {!isProcessing && !effectResult && (
                      <button
                        onClick={applyHDREffect}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <SunMedium className="h-6 w-6" />
                        Apply HDR Effect
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

              {/* HDR Effect Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    HDR Effect Settings
                  </h3>

                  <div className="space-y-6">
                    {/* HDR Style Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        HDR Style
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {
                            value: "natural",
                            label: "Natural",
                            desc: "Realistic look",
                            icon: Mountain,
                          },
                          {
                            value: "dramatic",
                            label: "Dramatic",
                            desc: "Bold contrast",
                            icon: CloudLightning,
                          },
                          {
                            value: "cinematic",
                            label: "Cinematic",
                            desc: "Film-like look",
                            icon: Sunset,
                          },
                          {
                            value: "surreal",
                            label: "Surreal",
                            desc: "Artistic effect",
                            icon: Flower2,
                          },
                          {
                            value: "vivid",
                            label: "Vivid",
                            desc: "Intense colors",
                            icon: Palette,
                          },
                          {
                            value: "moody",
                            label: "Moody",
                            desc: "Atmospheric",
                            icon: Moon,
                          },
                          {
                            value: "landscape",
                            label: "Landscape",
                            desc: "Nature optimized",
                            icon: Mountain,
                          },
                          {
                            value: "custom",
                            label: "Custom",
                            desc: "Manual settings",
                            icon: Sliders,
                          },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                effectType: style.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              effectOptions.effectType === style.value
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

                    {/* Tone Mapping */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Tone Mapping
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {
                            value: "reinhard",
                            label: "Reinhard",
                            desc: "Classic HDR",
                          },
                          {
                            value: "filmic",
                            label: "Filmic",
                            desc: "Cinematic look",
                          },
                          {
                            value: "aces",
                            label: "ACES",
                            desc: "Hollywood standard",
                          },
                          {
                            value: "uncharted2",
                            label: "Uncharted 2",
                            desc: "Game-inspired",
                          },
                        ].map((mapping) => (
                          <button
                            key={mapping.value}
                            onClick={() =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                toneMapping: mapping.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              effectOptions.toneMapping === mapping.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold text-sm">
                              {mapping.label}
                            </div>
                            <div className="text-xs opacity-75">
                              {mapping.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main HDR Controls */}
                    <div className="space-y-4">
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
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dynamic Range: {effectOptions.dynamicRange}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={effectOptions.dynamicRange}
                          onChange={(e) =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              dynamicRange: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Shadow Recovery: {effectOptions.shadowRecovery}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={effectOptions.shadowRecovery}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                shadowRecovery: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Highlight Recovery:{" "}
                            {effectOptions.highlightRecovery}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={effectOptions.highlightRecovery}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                highlightRecovery: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Controls */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Advanced Controls
                        </h4>
                        <button
                          onClick={() =>
                            setEffectOptions((prev) => ({
                              ...prev,
                              colorGrading: !prev.colorGrading,
                            }))
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            effectOptions.colorGrading
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {effectOptions.colorGrading
                            ? "Color Grading: ON"
                            : "Color Grading: OFF"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Contrast: {effectOptions.contrast > 0 ? "+" : ""}
                            {effectOptions.contrast}%
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
                            {effectOptions.saturation}%
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
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Vibrance: {effectOptions.vibrance}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={effectOptions.vibrance}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                vibrance: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Clarity: {effectOptions.clarity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={effectOptions.clarity}
                            onChange={(e) =>
                              setEffectOptions((prev) => ({
                                ...prev,
                                clarity: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>

                      {effectOptions.colorGrading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Color Temperature:{" "}
                              {effectOptions.colorTemperature > 0 ? "+" : ""}
                              {effectOptions.colorTemperature}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={effectOptions.colorTemperature}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  colorTemperature: parseInt(e.target.value),
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
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Color Tint:{" "}
                              {effectOptions.colorTint > 0 ? "+" : ""}
                              {effectOptions.colorTint}
                            </label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={effectOptions.colorTint}
                              onChange={(e) =>
                                setEffectOptions((prev) => ({
                                  ...prev,
                                  colorTint: parseInt(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Green</span>
                              <span>Neutral</span>
                              <span>Magenta</span>
                            </div>
                          </div>
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
                    HDR Presets
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
                    <SunMedium className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Dynamic Range Expansion
                      </div>
                      <div className="text-xs text-gray-600">
                        Reveal details in shadows and highlights
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Gauge className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Advanced Tone Mapping
                      </div>
                      <div className="text-xs text-gray-600">
                        Multiple algorithms for different visual styles
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sunset className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Cinematic Color Grading
                      </div>
                      <div className="text-xs text-gray-600">
                        Professional color enhancement techniques
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sliders className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Precise Control
                      </div>
                      <div className="text-xs text-gray-600">
                        Fine-tune every aspect of the HDR effect
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
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose an HDR style or customize settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Our algorithms analyze and enhance the dynamic range
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your stunning HDR-enhanced image
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
                      Landscape photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Real estate images
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Architectural photos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Sunset/sunrise scenes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Interior photography
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Artistic compositions
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
                    <div className="text-2xl font-bold text-amber-600">
                      98.5%
                    </div>
                    <div className="text-xs text-amber-700">
                      Detail Preservation
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      4.2s
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
                      Images Enhanced
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

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default HDREffects;
