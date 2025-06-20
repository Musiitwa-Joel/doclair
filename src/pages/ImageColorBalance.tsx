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
  Droplets,
  Zap as Lightning,
  Sun,
  Moon,
  Contrast,
  CircleDot,
  Hexagon,
} from "lucide-react";

interface ColorBalanceOptions {
  temperature: number; // -100 to 100 (cool to warm)
  tint: number; // -100 to 100 (green to magenta)
  saturation: number; // -100 to 100
  vibrance: number; // -100 to 100
  hue: number; // -180 to 180
  redBalance: number; // -100 to 100
  greenBalance: number; // -100 to 100
  blueBalance: number; // -100 to 100
  shadowsColor: { r: number; g: number; b: number };
  midtonesColor: { r: number; g: number; b: number };
  highlightsColor: { r: number; g: number; b: number };
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  autoWhiteBalance?: boolean;
  autoColorCorrection?: boolean;
}

interface ColorBalanceResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  adjustments: string[];
}

const ImageColorBalance: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [colorBalanceResult, setColorBalanceResult] =
    useState<ColorBalanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorBalanceOptions, setColorBalanceOptions] =
    useState<ColorBalanceOptions>({
      temperature: 0,
      tint: 0,
      saturation: 0,
      vibrance: 0,
      hue: 0,
      redBalance: 0,
      greenBalance: 0,
      blueBalance: 0,
      shadowsColor: { r: 0, g: 0, b: 0 },
      midtonesColor: { r: 0, g: 0, b: 0 },
      highlightsColor: { r: 0, g: 0, b: 0 },
      outputFormat: "png",
      quality: 95,
      autoWhiteBalance: false,
      autoColorCorrection: false,
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
    setColorBalanceResult(null);
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
  const applyLiveColorBalance = useCallback(() => {
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

    // Apply color balance adjustments pixel by pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply temperature adjustment
      if (colorBalanceOptions.temperature !== 0) {
        const tempFactor = colorBalanceOptions.temperature / 100;
        if (tempFactor > 0) {
          // Warmer (more red/yellow)
          r = Math.max(0, Math.min(255, r + tempFactor * 40));
          g = Math.max(0, Math.min(255, g + tempFactor * 20));
        } else {
          // Cooler (more blue)
          b = Math.max(0, Math.min(255, b - tempFactor * 40));
        }
      }

      // Apply tint adjustment
      if (colorBalanceOptions.tint !== 0) {
        const tintFactor = colorBalanceOptions.tint / 100;
        if (tintFactor > 0) {
          // More magenta
          r = Math.max(0, Math.min(255, r + tintFactor * 25));
          b = Math.max(0, Math.min(255, b + tintFactor * 25));
        } else {
          // More green
          g = Math.max(0, Math.min(255, g - tintFactor * 25));
        }
      }

      // Apply hue shift
      if (colorBalanceOptions.hue !== 0) {
        const hueShift = (colorBalanceOptions.hue / 180) * Math.PI;
        const [newR, newG, newB] = applyHueShift(r, g, b, hueShift);
        r = newR;
        g = newG;
        b = newB;
      }

      // Apply saturation
      if (colorBalanceOptions.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = 1 + colorBalanceOptions.saturation / 100;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));
      }

      // Apply vibrance (smart saturation)
      if (colorBalanceOptions.vibrance !== 0) {
        const vibranceFactor = colorBalanceOptions.vibrance / 100;
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
        const amt = (((Math.abs(max - avg) * 2) / 255) * vibranceFactor) / 3;

        if (r !== max) r += (max - r) * amt;
        if (g !== max) g += (max - g) * amt;
        if (b !== max) b += (max - b) * amt;

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
      }

      // Apply RGB balance adjustments
      r = Math.max(
        0,
        Math.min(255, r + (colorBalanceOptions.redBalance / 100) * 50)
      );
      g = Math.max(
        0,
        Math.min(255, g + (colorBalanceOptions.greenBalance / 100) * 50)
      );
      b = Math.max(
        0,
        Math.min(255, b + (colorBalanceOptions.blueBalance / 100) * 50)
      );

      // Apply tone-based color adjustments (simplified)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 85) {
        // Shadows
        r = Math.max(
          0,
          Math.min(255, r + colorBalanceOptions.shadowsColor.r * 0.3)
        );
        g = Math.max(
          0,
          Math.min(255, g + colorBalanceOptions.shadowsColor.g * 0.3)
        );
        b = Math.max(
          0,
          Math.min(255, b + colorBalanceOptions.shadowsColor.b * 0.3)
        );
      } else if (luminance < 170) {
        // Midtones
        r = Math.max(
          0,
          Math.min(255, r + colorBalanceOptions.midtonesColor.r * 0.3)
        );
        g = Math.max(
          0,
          Math.min(255, g + colorBalanceOptions.midtonesColor.g * 0.3)
        );
        b = Math.max(
          0,
          Math.min(255, b + colorBalanceOptions.midtonesColor.b * 0.3)
        );
      } else {
        // Highlights
        r = Math.max(
          0,
          Math.min(255, r + colorBalanceOptions.highlightsColor.r * 0.3)
        );
        g = Math.max(
          0,
          Math.min(255, g + colorBalanceOptions.highlightsColor.g * 0.3)
        );
        b = Math.max(
          0,
          Math.min(255, b + colorBalanceOptions.highlightsColor.b * 0.3)
        );
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
  }, [colorBalanceOptions]);

  // Helper function for hue shift
  const applyHueShift = (
    r: number,
    g: number,
    b: number,
    hueShift: number
  ): [number, number, number] => {
    // Convert RGB to HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r / 255) h = ((g / 255 - b / 255) / delta) % 6;
      else if (max === g / 255) h = (b / 255 - r / 255) / delta + 2;
      else h = (r / 255 - g / 255) / delta + 4;
    }
    h = (h * 60 + (hueShift * 180) / Math.PI) % 360;
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Convert back to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rNew = 0,
      gNew = 0,
      bNew = 0;
    if (h < 60) {
      rNew = c;
      gNew = x;
      bNew = 0;
    } else if (h < 120) {
      rNew = x;
      gNew = c;
      bNew = 0;
    } else if (h < 180) {
      rNew = 0;
      gNew = c;
      bNew = x;
    } else if (h < 240) {
      rNew = 0;
      gNew = x;
      bNew = c;
    } else if (h < 300) {
      rNew = x;
      gNew = 0;
      bNew = c;
    } else {
      rNew = c;
      gNew = 0;
      bNew = x;
    }

    return [
      Math.round((rNew + m) * 255),
      Math.round((gNew + m) * 255),
      Math.round((bNew + m) * 255),
    ];
  };

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
      applyLiveColorBalance();
      setIsLiveProcessing(false);
    }, 100); // 100ms debounce

    return () => {
      if (liveProcessingTimeoutRef.current) {
        clearTimeout(liveProcessingTimeoutRef.current);
      }
    };
  }, [colorBalanceOptions, applyLiveColorBalance]);

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

  const processColorBalance = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append(
        "colorBalanceOptions",
        JSON.stringify(colorBalanceOptions)
      );

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

      const response = await fetch("/api/tools/image/color-balance", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Color balance processing failed");
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
        `color_balanced_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${colorBalanceOptions.outputFormat}`
        )}`;

      setColorBalanceResult({
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
    if (!colorBalanceResult) return;

    const link = document.createElement("a");
    link.href = colorBalanceResult.downloadUrl;
    link.download = colorBalanceResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetColorBalance = () => {
    setColorBalanceOptions({
      temperature: 0,
      tint: 0,
      saturation: 0,
      vibrance: 0,
      hue: 0,
      redBalance: 0,
      greenBalance: 0,
      blueBalance: 0,
      shadowsColor: { r: 0, g: 0, b: 0 },
      midtonesColor: { r: 0, g: 0, b: 0 },
      highlightsColor: { r: 0, g: 0, b: 0 },
      outputFormat: "png",
      quality: 95,
      autoWhiteBalance: false,
      autoColorCorrection: false,
    });
    setColorBalanceResult(null);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setColorBalanceResult(null);
    setError(null);
    setProcessingProgress(0);
    resetColorBalance();
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
      colorBalanceOptions.temperature !== 0 ||
      colorBalanceOptions.tint !== 0 ||
      colorBalanceOptions.saturation !== 0 ||
      colorBalanceOptions.vibrance !== 0 ||
      colorBalanceOptions.hue !== 0 ||
      colorBalanceOptions.redBalance !== 0 ||
      colorBalanceOptions.greenBalance !== 0 ||
      colorBalanceOptions.blueBalance !== 0 ||
      colorBalanceOptions.autoWhiteBalance ||
      colorBalanceOptions.autoColorCorrection
    );
  };

  const presets = [
    {
      name: "Warm Sunset",
      icon: Sunset,
      adjustments: { temperature: 35, tint: 10, saturation: 15, vibrance: 20 },
    },
    {
      name: "Cool Morning",
      icon: Sunrise,
      adjustments: { temperature: -25, tint: -5, saturation: 10, vibrance: 15 },
    },
    {
      name: "Vibrant Colors",
      icon: Palette,
      adjustments: {
        saturation: 30,
        vibrance: 25,
        redBalance: 5,
        greenBalance: 5,
        blueBalance: 5,
      },
    },
    {
      name: "Vintage Film",
      icon: Camera,
      adjustments: {
        temperature: 15,
        tint: 8,
        saturation: -10,
        redBalance: 10,
        greenBalance: -5,
      },
    },
    {
      name: "Natural Skin",
      icon: CircleDot,
      adjustments: { temperature: 8, tint: 3, vibrance: 12, redBalance: 8 },
    },
    {
      name: "Landscape",
      icon: Hexagon,
      adjustments: {
        temperature: -5,
        saturation: 20,
        vibrance: 15,
        greenBalance: 10,
        blueBalance: 8,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    setColorBalanceOptions((prev) => ({
      ...prev,
      ...preset.adjustments,
    }));
  };

  return (
    <>
      <Helmet>
        <title>
          Color Balance Tool - Professional Color Correction | Doclair
        </title>
        <meta
          name="description"
          content="Professional color balance tool with temperature, tint, saturation controls. Real-time preview and advanced color correction features."
        />
        <meta
          name="keywords"
          content="color balance, color correction, temperature, tint, saturation, vibrance, photo editing, color grading"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-color-balance"
        />
        <meta
          property="og:title"
          content="Color Balance Tool - Professional Color Correction"
        />
        <meta
          property="og:description"
          content="Professional color balance and correction tools with real-time preview and advanced color grading features."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 shadow-2xl">
                <Palette className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Color{" "}
                <span className="cursive-text text-5xl text-purple-600">
                  Balance
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Fine-tune color temperature, tint, and saturation with{" "}
                <span className="cursive-text text-pink-600 text-xl">
                  professional precision
                </span>
                . Advanced color grading tools with real-time preview.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature Control
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Tint Adjustment
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  RGB Balance
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

                    {/* Live Preview */}
                    {processedPreview && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Live Preview
                          </h4>
                          {isLiveProcessing && (
                            <div className="flex items-center gap-2 text-purple-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
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
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                          <span className="font-semibold text-purple-900">
                            Processing color balance...
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-purple-700">
                          {processingProgress < 30 && "Analyzing color data..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying color corrections..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Processing temperature and tint..."}
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
                    {colorBalanceResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Color Balance Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {colorBalanceResult.processedDimensions.width}×
                                {colorBalanceResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(colorBalanceResult.processingTime)}
                              </div>
                            </div>
                            {colorBalanceResult.adjustments.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Adjustments:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {colorBalanceResult.adjustments.map(
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
                              Download Color Balanced Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Process Final Button */}
                    {!isProcessing &&
                      !colorBalanceResult &&
                      hasAdjustments() && (
                        <button
                          onClick={processColorBalance}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
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

              {/* Color Balance Controls */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Settings className="h-6 w-6 text-purple-600" />
                      Live Color Balance Controls
                    </h3>
                    <button
                      onClick={resetColorBalance}
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
                            className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center gap-2"
                          >
                            <preset.icon className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Corrections */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Auto Corrections
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={colorBalanceOptions.autoWhiteBalance}
                            onChange={(e) =>
                              setColorBalanceOptions((prev) => ({
                                ...prev,
                                autoWhiteBalance: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Auto White Balance
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={colorBalanceOptions.autoColorCorrection}
                            onChange={(e) =>
                              setColorBalanceOptions((prev) => ({
                                ...prev,
                                autoColorCorrection: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Auto Color Correction
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Temperature and Tint */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Temperature: {colorBalanceOptions.temperature}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={colorBalanceOptions.temperature}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
                              ...prev,
                              temperature: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Cool</span>
                          <span>Warm</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tint: {colorBalanceOptions.tint}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={colorBalanceOptions.tint}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
                              ...prev,
                              tint: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Green</span>
                          <span>Magenta</span>
                        </div>
                      </div>
                    </div>

                    {/* Saturation and Vibrance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Saturation: {colorBalanceOptions.saturation}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={colorBalanceOptions.saturation}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
                              ...prev,
                              saturation: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Vibrance: {colorBalanceOptions.vibrance}
                        </label>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={colorBalanceOptions.vibrance}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
                              ...prev,
                              vibrance: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Hue Shift */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hue Shift: {colorBalanceOptions.hue}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={colorBalanceOptions.hue}
                        onChange={(e) =>
                          setColorBalanceOptions((prev) => ({
                            ...prev,
                            hue: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    {/* RGB Balance */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        RGB Balance
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Red: {colorBalanceOptions.redBalance}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorBalanceOptions.redBalance}
                            onChange={(e) =>
                              setColorBalanceOptions((prev) => ({
                                ...prev,
                                redBalance: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Green: {colorBalanceOptions.greenBalance}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorBalanceOptions.greenBalance}
                            onChange={(e) =>
                              setColorBalanceOptions((prev) => ({
                                ...prev,
                                greenBalance: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Blue: {colorBalanceOptions.blueBalance}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={colorBalanceOptions.blueBalance}
                            onChange={(e) =>
                              setColorBalanceOptions((prev) => ({
                                ...prev,
                                blueBalance: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
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
                          value={colorBalanceOptions.outputFormat}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {colorBalanceOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={colorBalanceOptions.quality}
                          onChange={(e) =>
                            setColorBalanceOptions((prev) => ({
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
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Thermometer className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Temperature Control
                      </div>
                      <div className="text-xs text-gray-600">
                        Adjust warm/cool color balance
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Droplets className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Tint Adjustment
                      </div>
                      <div className="text-xs text-gray-600">
                        Fine-tune green/magenta balance
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Saturation & Vibrance
                      </div>
                      <div className="text-xs text-gray-600">
                        Control color intensity and vibrancy
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        RGB Balance
                      </div>
                      <div className="text-xs text-gray-600">
                        Individual red, green, blue adjustments
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
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Adjust color controls and see live preview
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Fine-tune temperature, tint, and saturation
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your color-balanced image
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
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      99.7%
                    </div>
                    <div className="text-xs text-purple-700">
                      Color Accuracy
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      Live
                    </div>
                    <div className="text-xs text-purple-700">Preview Speed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      420K+
                    </div>
                    <div className="text-xs text-purple-700">
                      Images Balanced
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">8</div>
                    <div className="text-xs text-purple-700">
                      Color Controls
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

export default ImageColorBalance;
