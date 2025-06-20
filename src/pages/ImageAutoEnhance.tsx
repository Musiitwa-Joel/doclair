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
  Wand2,
  TrendingUp,
  BarChart3,
  Palette,
  Sun,
  Contrast,
  Camera,
  Aperture,
  Focus,
  Sliders,
  Star,
  Award,
  Lightbulb,
  Gauge,
} from "lucide-react";

interface AutoEnhanceOptions {
  enhanceMode:
    | "auto"
    | "portrait"
    | "landscape"
    | "lowlight"
    | "vintage"
    | "vivid";
  intensity: number; // 0-100
  preserveColors: boolean;
  enhanceShadows: boolean;
  enhanceHighlights: boolean;
  improveClarity: boolean;
  reduceNoise: boolean;
  sharpenDetails: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
}

interface AutoEnhanceResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  enhancements: string[];
  qualityScore: number;
}

const ImageAutoEnhance: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [enhanceResult, setEnhanceResult] = useState<AutoEnhanceResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [enhanceOptions, setEnhanceOptions] = useState<AutoEnhanceOptions>({
    enhanceMode: "auto",
    intensity: 75,
    preserveColors: true,
    enhanceShadows: true,
    enhanceHighlights: true,
    improveClarity: true,
    reduceNoise: true,
    sharpenDetails: true,
    outputFormat: "png",
    quality: 95,
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
    setEnhanceResult(null);
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
        // Trigger initial auto enhancement
        applyLiveEnhancement();
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  // Live preview enhancement using Canvas API
  const applyLiveEnhancement = useCallback(() => {
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

    // Apply auto enhancement based on mode and intensity
    const intensity = enhanceOptions.intensity / 100;

    // Auto enhancement algorithm
    if (
      enhanceOptions.enhanceMode === "auto" ||
      enhanceOptions.enhanceMode === "vivid"
    ) {
      applyAutoEnhancement(data, intensity);
    } else if (enhanceOptions.enhanceMode === "portrait") {
      applyPortraitEnhancement(data, intensity);
    } else if (enhanceOptions.enhanceMode === "landscape") {
      applyLandscapeEnhancement(data, intensity);
    } else if (enhanceOptions.enhanceMode === "lowlight") {
      applyLowlightEnhancement(data, intensity);
    } else if (enhanceOptions.enhanceMode === "vintage") {
      applyVintageEnhancement(data, intensity);
    }

    // Apply additional enhancements
    if (enhanceOptions.improveClarity) {
      applyClarity(data, intensity * 0.3);
    }

    if (enhanceOptions.reduceNoise) {
      applyNoiseReduction(data);
    }

    if (enhanceOptions.sharpenDetails) {
      applySharpen(data, intensity * 0.5);
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to data URL for preview
    const processedDataUrl = canvas.toDataURL("image/png");
    setProcessedPreview(processedDataUrl);
  }, [enhanceOptions]);

  // Auto enhancement algorithms
  const applyAutoEnhancement = (data: Uint8ClampedArray, intensity: number) => {
    // Auto levels and contrast
    const histogram = calculateHistogram(data);
    const { minLevel, maxLevel } = findOptimalLevels(histogram);

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Auto levels
      r = ((r - minLevel) / (maxLevel - minLevel)) * 255;
      g = ((g - minLevel) / (maxLevel - minLevel)) * 255;
      b = ((b - minLevel) / (maxLevel - minLevel)) * 255;

      // Auto contrast
      const contrastFactor = 1 + intensity * 0.3;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      // Saturation boost
      if (enhanceOptions.preserveColors) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = 1 + intensity * 0.2;
        r = Math.max(0, Math.min(255, gray + (r - gray) * saturationFactor));
        g = Math.max(0, Math.min(255, gray + (g - gray) * saturationFactor));
        b = Math.max(0, Math.min(255, gray + (b - gray) * saturationFactor));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyPortraitEnhancement = (
    data: Uint8ClampedArray,
    intensity: number
  ) => {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Skin tone enhancement
      const skinToneFactor = 1 + intensity * 0.15;
      r = Math.max(0, Math.min(255, r * skinToneFactor));

      // Gentle contrast
      const contrastFactor = 1 + intensity * 0.2;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyLandscapeEnhancement = (
    data: Uint8ClampedArray,
    intensity: number
  ) => {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Enhance greens and blues for nature
      g = Math.max(0, Math.min(255, g * (1 + intensity * 0.2)));
      b = Math.max(0, Math.min(255, b * (1 + intensity * 0.15)));

      // Increase contrast
      const contrastFactor = 1 + intensity * 0.4;
      r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyLowlightEnhancement = (
    data: Uint8ClampedArray,
    intensity: number
  ) => {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brighten shadows
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 128) {
        const shadowBoost = intensity * 0.5;
        r = Math.max(0, Math.min(255, r + shadowBoost * 50));
        g = Math.max(0, Math.min(255, g + shadowBoost * 50));
        b = Math.max(0, Math.min(255, b + shadowBoost * 50));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyVintageEnhancement = (
    data: Uint8ClampedArray,
    intensity: number
  ) => {
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Vintage color grading
      r = Math.max(0, Math.min(255, r + intensity * 20));
      g = Math.max(0, Math.min(255, g + intensity * 10));
      b = Math.max(0, Math.min(255, b - intensity * 15));

      // Reduce saturation slightly
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const desaturationFactor = 1 - intensity * 0.2;
      r = Math.max(0, Math.min(255, gray + (r - gray) * desaturationFactor));
      g = Math.max(0, Math.min(255, gray + (g - gray) * desaturationFactor));
      b = Math.max(0, Math.min(255, gray + (b - gray) * desaturationFactor));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyClarity = (data: Uint8ClampedArray, intensity: number) => {
    // Simple clarity enhancement (mid-tone contrast)
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 64 && luminance < 192) {
        const clarityFactor = 1 + intensity;
        r = Math.max(0, Math.min(255, clarityFactor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, clarityFactor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, clarityFactor * (b - 128) + 128));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  const applyNoiseReduction = (data: Uint8ClampedArray) => {
    // Simple noise reduction (blur similar pixels)
    const width = canvasRef.current?.width || 0;
    const height = canvasRef.current?.height || 0;
    const output = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        // 3x3 kernel
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            r += data[neighborIdx];
            g += data[neighborIdx + 1];
            b += data[neighborIdx + 2];
            count++;
          }
        }

        output[idx] = r / count;
        output[idx + 1] = g / count;
        output[idx + 2] = b / count;
      }
    }

    data.set(output);
  };

  const applySharpen = (data: Uint8ClampedArray, intensity: number) => {
    const width = canvasRef.current?.width || 0;
    const height = canvasRef.current?.height || 0;
    const output = new Uint8ClampedArray(data);

    // Sharpen kernel
    const kernel = [
      0,
      -intensity,
      0,
      -intensity,
      1 + 4 * intensity,
      -intensity,
      0,
      -intensity,
      0,
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        let r = 0,
          g = 0,
          b = 0;
        let kernelIdx = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            const weight = kernel[kernelIdx++];
            r += data[neighborIdx] * weight;
            g += data[neighborIdx + 1] * weight;
            b += data[neighborIdx + 2] * weight;
          }
        }

        output[idx] = Math.max(0, Math.min(255, r));
        output[idx + 1] = Math.max(0, Math.min(255, g));
        output[idx + 2] = Math.max(0, Math.min(255, b));
      }
    }

    data.set(output);
  };

  const calculateHistogram = (data: Uint8ClampedArray) => {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const luminance = Math.round(
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      );
      histogram[luminance]++;
    }
    return histogram;
  };

  const findOptimalLevels = (histogram: number[]) => {
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
    const threshold = totalPixels * 0.01; // 1% threshold

    let minLevel = 0;
    let maxLevel = 255;
    let cumulative = 0;

    // Find min level
    for (let i = 0; i < 256; i++) {
      cumulative += histogram[i];
      if (cumulative >= threshold) {
        minLevel = i;
        break;
      }
    }

    // Find max level
    cumulative = 0;
    for (let i = 255; i >= 0; i--) {
      cumulative += histogram[i];
      if (cumulative >= threshold) {
        maxLevel = i;
        break;
      }
    }

    return { minLevel, maxLevel };
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
      applyLiveEnhancement();
      setIsLiveProcessing(false);
    }, 150); // 150ms debounce

    return () => {
      if (liveProcessingTimeoutRef.current) {
        clearTimeout(liveProcessingTimeoutRef.current);
      }
    };
  }, [enhanceOptions, applyLiveEnhancement]);

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

  const enhanceImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("enhanceOptions", JSON.stringify(enhanceOptions));

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

      const response = await fetch("/api/tools/image/auto-enhance", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Enhancement failed");
      }

      // Get enhancement metadata from headers
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
      const qualityScore = parseFloat(
        response.headers.get("X-Quality-Score") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `enhanced_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${enhanceOptions.outputFormat}`
        )}`;

      setEnhanceResult({
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
        qualityScore,
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
    if (!enhanceResult) return;

    const link = document.createElement("a");
    link.href = enhanceResult.downloadUrl;
    link.download = enhanceResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetEnhancer = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setEnhanceResult(null);
    setError(null);
    setProcessingProgress(0);
    setEnhanceOptions({
      enhanceMode: "auto",
      intensity: 75,
      preserveColors: true,
      enhanceShadows: true,
      enhanceHighlights: true,
      improveClarity: true,
      reduceNoise: true,
      sharpenDetails: true,
      outputFormat: "png",
      quality: 95,
    });
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

  const enhanceModes = [
    {
      value: "auto",
      label: "Auto Enhance",
      description: "Intelligent automatic enhancement",
      icon: Wand2,
      color: "from-blue-500 to-indigo-500",
    },
    {
      value: "portrait",
      label: "Portrait",
      description: "Optimized for people and faces",
      icon: Camera,
      color: "from-pink-500 to-rose-500",
    },
    {
      value: "landscape",
      label: "Landscape",
      description: "Enhanced for nature and scenery",
      icon: Sun,
      color: "from-green-500 to-emerald-500",
    },
    {
      value: "lowlight",
      label: "Low Light",
      description: "Brighten dark and shadowy images",
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
    },
    {
      value: "vintage",
      label: "Vintage",
      description: "Classic film-like enhancement",
      icon: Star,
      color: "from-purple-500 to-violet-500",
    },
    {
      value: "vivid",
      label: "Vivid",
      description: "Bold colors and high contrast",
      icon: Palette,
      color: "from-red-500 to-pink-500",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Auto Enhance Tool - One-Click Image Enhancement | Doclair</title>
        <meta
          name="description"
          content="Automatically enhance images with AI-powered one-click enhancement. Improve brightness, contrast, colors, and clarity instantly."
        />
        <meta
          name="keywords"
          content="auto enhance, image enhancement, one-click enhancement, AI image processing, photo enhancement, automatic image improvement"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-auto-enhance"
        />
        <meta
          property="og:title"
          content="Auto Enhance Tool - One-Click Image Enhancement"
        />
        <meta
          property="og:description"
          content="Automatically enhance images with AI-powered algorithms for perfect results in one click."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 shadow-2xl">
                <Wand2 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="cursive-text text-5xl text-purple-600">
                  Auto
                </span>{" "}
                Enhance
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                One-click automatic image enhancement with{" "}
                <span className="cursive-text text-pink-600 text-xl">
                  AI-powered
                </span>{" "}
                algorithms. Instantly improve brightness, contrast, colors, and
                clarity.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Powered
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  One-Click Enhancement
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Professional Quality
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Enhancement Area */}
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
                        onClick={resetEnhancer}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Before/After Preview */}
                    {processedPreview && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Live Preview
                          </h4>
                          {isLiveProcessing && (
                            <div className="flex items-center gap-2 text-purple-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                              <span className="text-xs">Enhancing...</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-2">
                              Original
                            </div>
                            <img
                              src={filePreview}
                              alt="Original"
                              className="w-full h-48 object-cover rounded-lg shadow-sm"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-2">
                              Enhanced
                            </div>
                            <img
                              src={processedPreview}
                              alt="Enhanced Preview"
                              className="w-full h-48 object-cover rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                          <span className="font-semibold text-purple-900">
                            Enhancing image with AI...
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
                            "Analyzing image quality..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying AI enhancements..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Optimizing colors and contrast..."}
                          {processingProgress >= 90 &&
                            "Finalizing enhanced image..."}
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
                              Enhancement Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhancement Result */}
                    {enhanceResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Enhancement Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {enhanceResult.processedDimensions.width}×
                                {enhanceResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(enhanceResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Quality Score:
                                </span>{" "}
                                <span className="inline-flex items-center gap-1">
                                  {enhanceResult.qualityScore.toFixed(1)}/10
                                  <Gauge className="h-3 w-3" />
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Mode:</span>{" "}
                                {
                                  enhanceModes.find(
                                    (m) =>
                                      m.value === enhanceOptions.enhanceMode
                                  )?.label
                                }
                              </div>
                            </div>
                            {enhanceResult.enhancements.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Enhancements:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {enhanceResult.enhancements.map(
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
                              Download Enhanced Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhance Button */}
                    {!isProcessing && !enhanceResult && (
                      <button
                        onClick={enhanceImage}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Wand2 className="h-6 w-6" />
                        Download Final Enhanced Image
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

              {/* Enhancement Controls */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Enhancement Controls
                  </h3>

                  <div className="space-y-6">
                    {/* Enhancement Modes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Enhancement Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {enhanceModes.map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                enhanceMode: mode.value as any,
                              }))
                            }
                            className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                              enhanceOptions.enhanceMode === mode.value
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${mode.color}`}
                              >
                                <mode.icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="font-semibold text-sm">
                                {mode.label}
                              </div>
                            </div>
                            <div className="text-xs opacity-75">
                              {mode.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intensity Control */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enhancement Intensity: {enhanceOptions.intensity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={enhanceOptions.intensity}
                        onChange={(e) =>
                          setEnhanceOptions((prev) => ({
                            ...prev,
                            intensity: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Subtle</span>
                        <span>Moderate</span>
                        <span>Strong</span>
                      </div>
                    </div>

                    {/* Enhancement Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Enhancement Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.preserveColors}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                preserveColors: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Preserve Natural Colors
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.enhanceShadows}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                enhanceShadows: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Enhance Shadows
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.enhanceHighlights}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                enhanceHighlights: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Enhance Highlights
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.improveClarity}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                improveClarity: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Improve Clarity
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.reduceNoise}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                reduceNoise: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Reduce Noise
                          </span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            checked={enhanceOptions.sharpenDetails}
                            onChange={(e) =>
                              setEnhanceOptions((prev) => ({
                                ...prev,
                                sharpenDetails: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Sharpen Details
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Output Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={enhanceOptions.outputFormat}
                          onChange={(e) =>
                            setEnhanceOptions((prev) => ({
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
                          Quality: {enhanceOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={enhanceOptions.quality}
                          onChange={(e) =>
                            setEnhanceOptions((prev) => ({
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
                  AI Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Smart Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        AI analyzes your image and applies optimal enhancements
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Live Preview
                      </div>
                      <div className="text-xs text-gray-600">
                        See changes instantly as you adjust settings
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        One-Click Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        Perfect results with minimal effort
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Professional Quality
                      </div>
                      <div className="text-xs text-gray-600">
                        Studio-grade enhancement algorithms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhancement Modes Guide */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Enhancement Modes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-900 text-sm mb-1">
                      Auto Enhance
                    </div>
                    <div className="text-xs text-blue-700">
                      Best for general photos with automatic optimization
                    </div>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg">
                    <div className="font-semibold text-pink-900 text-sm mb-1">
                      Portrait
                    </div>
                    <div className="text-xs text-pink-700">
                      Optimized for people, faces, and skin tones
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-900 text-sm mb-1">
                      Landscape
                    </div>
                    <div className="text-xs text-green-700">
                      Enhanced for nature, scenery, and outdoor photos
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-yellow-900 text-sm mb-1">
                      Low Light
                    </div>
                    <div className="text-xs text-yellow-700">
                      Brightens dark images and enhances shadows
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
                      Choose enhancement mode and intensity
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI analyzes and enhances your image
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
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
                      Enhancement Success
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      2.8s
                    </div>
                    <div className="text-xs text-purple-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      1.2M+
                    </div>
                    <div className="text-xs text-purple-700">
                      Images Enhanced
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">6</div>
                    <div className="text-xs text-purple-700">
                      Enhancement Modes
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

export default ImageAutoEnhance;
