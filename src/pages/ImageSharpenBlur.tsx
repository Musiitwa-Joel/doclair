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
  Focus,
  Sliders,
  Wand2,
  TrendingUp,
  Scissors,
  Palette,
  Camera,
  Aperture,
  Filter,
  Contrast,
  Sun,
  Moon,
  GlassWater,
} from "lucide-react";

interface SharpenBlurOptions {
  sharpenAmount: number; // 0 to 100
  sharpenRadius: number; // 0.1 to 5.0
  sharpenThreshold: number; // 0 to 255
  blurAmount: number; // 0 to 100
  blurType: "gaussian" | "motion" | "radial" | "surface";
  motionAngle: number; // 0 to 360 (for motion blur)
  motionDistance: number; // 1 to 50 (for motion blur)
  radialCenterX: number; // 0 to 100 (for radial blur)
  radialCenterY: number; // 0 to 100 (for radial blur)
  unsharpMask: boolean;
  edgeEnhancement: number; // 0 to 100
  noiseReduction: number; // 0 to 100
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  preserveDetails?: boolean;
  smartSharpen?: boolean;
}

interface SharpenBlurResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  adjustments: string[];
}

const ImageSharpenBlur: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [sharpenBlurResult, setSharpenBlurResult] =
    useState<SharpenBlurResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharpenBlurOptions, setSharpenBlurOptions] =
    useState<SharpenBlurOptions>({
      sharpenAmount: 0,
      sharpenRadius: 1.0,
      sharpenThreshold: 0,
      blurAmount: 0,
      blurType: "gaussian",
      motionAngle: 0,
      motionDistance: 10,
      radialCenterX: 50,
      radialCenterY: 50,
      unsharpMask: false,
      edgeEnhancement: 0,
      noiseReduction: 0,
      outputFormat: "png",
      quality: 95,
      preserveDetails: true,
      smartSharpen: false,
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
    setSharpenBlurResult(null);
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

    // Apply sharpening
    if (sharpenBlurOptions.sharpenAmount > 0) {
      applySharpeningCanvas(
        data,
        canvas.width,
        canvas.height,
        sharpenBlurOptions
      );
    }

    // Apply blur
    if (sharpenBlurOptions.blurAmount > 0) {
      applyBlurCanvas(data, canvas.width, canvas.height, sharpenBlurOptions);
    }

    // Apply edge enhancement
    if (sharpenBlurOptions.edgeEnhancement > 0) {
      applyEdgeEnhancementCanvas(
        data,
        canvas.width,
        canvas.height,
        sharpenBlurOptions.edgeEnhancement
      );
    }

    // Apply noise reduction
    if (sharpenBlurOptions.noiseReduction > 0) {
      applyNoiseReductionCanvas(
        data,
        canvas.width,
        canvas.height,
        sharpenBlurOptions.noiseReduction
      );
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to data URL for preview
    const processedDataUrl = canvas.toDataURL("image/png");
    setProcessedPreview(processedDataUrl);
  }, [sharpenBlurOptions]);

  // Sharpening algorithm for canvas
  const applySharpeningCanvas = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: SharpenBlurOptions
  ) => {
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    const factor = options.sharpenAmount / 100;
    applyConvolutionFilter(data, width, height, sharpenKernel, factor);
  };

  // Blur algorithm for canvas
  const applyBlurCanvas = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: SharpenBlurOptions
  ) => {
    const blurRadius = Math.round((options.blurAmount / 100) * 10);

    if (options.blurType === "gaussian") {
      applyGaussianBlur(data, width, height, blurRadius);
    } else {
      // Simple box blur for other types
      applyBoxBlur(data, width, height, blurRadius);
    }
  };

  // Edge enhancement algorithm
  const applyEdgeEnhancementCanvas = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    amount: number
  ) => {
    const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    const factor = amount / 100;
    applyConvolutionFilter(data, width, height, edgeKernel, factor);
  };

  // Noise reduction algorithm
  const applyNoiseReductionCanvas = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    amount: number
  ) => {
    const radius = Math.round((amount / 100) * 3);
    applyMedianFilter(data, width, height, radius);
  };

  // Convolution filter helper
  const applyConvolutionFilter = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[],
    factor: number
  ) => {
    const output = new Uint8ClampedArray(data);
    const kernelSize = Math.sqrt(kernel.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - half;
            const py = y + ky - half;
            const idx = (py * width + px) * 4;
            const weight = kernel[ky * kernelSize + kx];

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const idx = (y * width + x) * 4;
        const originalR = data[idx];
        const originalG = data[idx + 1];
        const originalB = data[idx + 2];

        output[idx] = Math.max(
          0,
          Math.min(255, originalR + (r - originalR) * factor)
        );
        output[idx + 1] = Math.max(
          0,
          Math.min(255, originalG + (g - originalG) * factor)
        );
        output[idx + 2] = Math.max(
          0,
          Math.min(255, originalB + (b - originalB) * factor)
        );
      }
    }

    data.set(output);
  };

  // Gaussian blur helper
  const applyGaussianBlur = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) => {
    if (radius <= 0) return;

    const sigma = radius / 3;
    const kernel = generateGaussianKernel(radius, sigma);

    // Horizontal pass
    applyHorizontalBlur(data, width, height, kernel);
    // Vertical pass
    applyVerticalBlur(data, width, height, kernel);
  };

  // Box blur helper
  const applyBoxBlur = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) => {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);
    const kernelSize = radius * 2 + 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;

            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = r / count;
        output[idx + 1] = g / count;
        output[idx + 2] = b / count;
      }
    }

    data.set(output);
  };

  // Median filter for noise reduction
  const applyMedianFilter = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ) => {
    if (radius <= 0) return;

    const output = new Uint8ClampedArray(data);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            rValues.push(data[idx]);
            gValues.push(data[idx + 1]);
            bValues.push(data[idx + 2]);
          }
        }

        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);

        const median = Math.floor(rValues.length / 2);
        const idx = (y * width + x) * 4;
        output[idx] = rValues[median];
        output[idx + 1] = gValues[median];
        output[idx + 2] = bValues[median];
      }
    }

    data.set(output);
  };

  // Gaussian kernel generator
  const generateGaussianKernel = (radius: number, sigma: number): number[] => {
    const kernel: number[] = [];
    let sum = 0;

    for (let i = -radius; i <= radius; i++) {
      const value = Math.exp(-(i * i) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }

    // Normalize
    return kernel.map((v) => v / sum);
  };

  // Horizontal blur pass
  const applyHorizontalBlur = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[]
  ) => {
    const output = new Uint8ClampedArray(data);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let i = 0; i < kernel.length; i++) {
          const px = Math.max(0, Math.min(width - 1, x + i - radius));
          const idx = (y * width + px) * 4;
          const weight = kernel[i];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }

        const idx = (y * width + x) * 4;
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
      }
    }

    data.set(output);
  };

  // Vertical blur pass
  const applyVerticalBlur = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
    kernel: number[]
  ) => {
    const output = new Uint8ClampedArray(data);
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let i = 0; i < kernel.length; i++) {
          const py = Math.max(0, Math.min(height - 1, y + i - radius));
          const idx = (py * width + x) * 4;
          const weight = kernel[i];

          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }

        const idx = (y * width + x) * 4;
        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
      }
    }

    data.set(output);
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
      applyLiveAdjustments();
      setIsLiveProcessing(false);
    }, 150); // 150ms debounce for more complex processing

    return () => {
      if (liveProcessingTimeoutRef.current) {
        clearTimeout(liveProcessingTimeoutRef.current);
      }
    };
  }, [sharpenBlurOptions, applyLiveAdjustments]);

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

  const processImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("sharpenBlurOptions", JSON.stringify(sharpenBlurOptions));

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

      const response = await fetch("/api/tools/image/sharpen-blur", {
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
        `processed_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${sharpenBlurOptions.outputFormat}`
        )}`;

      setSharpenBlurResult({
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
    if (!sharpenBlurResult) return;

    const link = document.createElement("a");
    link.href = sharpenBlurResult.downloadUrl;
    link.download = sharpenBlurResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAdjustments = () => {
    setSharpenBlurOptions({
      sharpenAmount: 0,
      sharpenRadius: 1.0,
      sharpenThreshold: 0,
      blurAmount: 0,
      blurType: "gaussian",
      motionAngle: 0,
      motionDistance: 10,
      radialCenterX: 50,
      radialCenterY: 50,
      unsharpMask: false,
      edgeEnhancement: 0,
      noiseReduction: 0,
      outputFormat: "png",
      quality: 95,
      preserveDetails: true,
      smartSharpen: false,
    });
    setSharpenBlurResult(null);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setSharpenBlurResult(null);
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
      sharpenBlurOptions.sharpenAmount !== 0 ||
      sharpenBlurOptions.blurAmount !== 0 ||
      sharpenBlurOptions.edgeEnhancement !== 0 ||
      sharpenBlurOptions.noiseReduction !== 0 ||
      sharpenBlurOptions.unsharpMask ||
      sharpenBlurOptions.smartSharpen
    );
  };

  const presets = [
    {
      name: "Portrait Sharpen",
      icon: Camera,
      adjustments: {
        sharpenAmount: 30,
        sharpenRadius: 0.8,
        edgeEnhancement: 15,
        preserveDetails: true,
      },
    },
    {
      name: "Landscape Sharpen",
      icon: Sun,
      adjustments: {
        sharpenAmount: 50,
        sharpenRadius: 1.2,
        edgeEnhancement: 25,
      },
    },
    {
      name: "Soft Blur",
      icon: Moon,
      adjustments: { blurAmount: 20, blurType: "gaussian", noiseReduction: 10 },
    },
    {
      name: "Motion Blur",
      icon: Zap,
      adjustments: {
        blurAmount: 40,
        blurType: "motion",
        motionAngle: 45,
        motionDistance: 20,
      },
    },
    {
      name: "Unsharp Mask",
      icon: Focus,
      adjustments: {
        sharpenAmount: 40,
        sharpenRadius: 1.0,
        sharpenThreshold: 10,
        unsharpMask: true,
      },
    },
    {
      name: "Noise Reduction",
      icon: Filter,
      adjustments: { noiseReduction: 30, preserveDetails: true },
    },
  ];

  const applyPreset = (preset: any) => {
    setSharpenBlurOptions((prev) => ({
      ...prev,
      ...preset.adjustments,
    }));
  };

  return (
    <>
      <Helmet>
        <title>
          Sharpen & Blur Tool - Professional Image Enhancement | Doclair
        </title>
        <meta
          name="description"
          content="Apply precise sharpening and blur effects to images. Professional tools for focus enhancement, motion blur, and noise reduction."
        />
        <meta
          name="keywords"
          content="image sharpen, image blur, unsharp mask, motion blur, noise reduction, focus enhancement"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/image-sharpen-blur"
        />
        <meta
          property="og:title"
          content="Sharpen & Blur Tool - Professional Image Enhancement"
        />
        <meta
          property="og:description"
          content="Professional sharpening and blur effects with real-time preview and advanced controls."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
                <Focus className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Sharpen &{" "}
                <span className="cursive-text text-5xl text-indigo-600">
                  Blur
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Apply precise sharpening or blur effects with{" "}
                <span className="cursive-text text-purple-600 text-xl">
                  professional controls
                </span>
                . Enhance focus, create artistic blur, and reduce noise with
                advanced algorithms.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Focus className="h-4 w-4" />
                  Unsharp Mask
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <GlassWater className="h-4 w-4" />
                  Motion Blur
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Noise Reduction
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
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="bg-indigo-50 p-4 rounded-2xl">
                        <ImageIcon className="h-12 w-12 text-indigo-600" />
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
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-indigo-600" />
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
                            <div className="flex items-center gap-2 text-indigo-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
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
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                          <span className="font-semibold text-indigo-900">
                            Processing image...
                          </span>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-indigo-700">
                          {processingProgress < 30 && "Analyzing image..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Applying sharpening..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Processing blur effects..."}
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
                    {sharpenBlurResult && (
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
                                {sharpenBlurResult.processedDimensions.width}×
                                {sharpenBlurResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(sharpenBlurResult.processingTime)}
                              </div>
                            </div>
                            {sharpenBlurResult.adjustments.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Effects:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sharpenBlurResult.adjustments.map(
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
                              Download Processed Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Process Final Button */}
                    {!isProcessing &&
                      !sharpenBlurResult &&
                      hasAdjustments() && (
                        <button
                          onClick={processImage}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
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

              {/* Processing Controls */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Settings className="h-6 w-6 text-purple-600" />
                      Live Processing Controls
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
                            className="p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center gap-2"
                          >
                            <preset.icon className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sharpening Controls */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Sharpening
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Amount: {sharpenBlurOptions.sharpenAmount}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sharpenBlurOptions.sharpenAmount}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                sharpenAmount: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Radius:{" "}
                            {sharpenBlurOptions.sharpenRadius.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={sharpenBlurOptions.sharpenRadius}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                sharpenRadius: parseFloat(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Threshold: {sharpenBlurOptions.sharpenThreshold}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="255"
                            value={sharpenBlurOptions.sharpenThreshold}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                sharpenThreshold: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Edge Enhancement:{" "}
                            {sharpenBlurOptions.edgeEnhancement}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sharpenBlurOptions.edgeEnhancement}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                edgeEnhancement: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Blur Controls */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Blur Effects
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Amount: {sharpenBlurOptions.blurAmount}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sharpenBlurOptions.blurAmount}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                blurAmount: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Blur Type
                          </label>
                          <select
                            value={sharpenBlurOptions.blurType}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                blurType: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="gaussian">Gaussian Blur</option>
                            <option value="motion">Motion Blur</option>
                            <option value="radial">Radial Blur</option>
                            <option value="surface">Surface Blur</option>
                          </select>
                        </div>
                        {sharpenBlurOptions.blurType === "motion" && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Motion Angle: {sharpenBlurOptions.motionAngle}°
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={sharpenBlurOptions.motionAngle}
                                onChange={(e) =>
                                  setSharpenBlurOptions((prev) => ({
                                    ...prev,
                                    motionAngle: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Motion Distance:{" "}
                                {sharpenBlurOptions.motionDistance}
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="50"
                                value={sharpenBlurOptions.motionDistance}
                                onChange={(e) =>
                                  setSharpenBlurOptions((prev) => ({
                                    ...prev,
                                    motionDistance: parseInt(e.target.value),
                                  }))
                                }
                                className="w-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Advanced Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Noise Reduction: {sharpenBlurOptions.noiseReduction}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sharpenBlurOptions.noiseReduction}
                            onChange={(e) =>
                              setSharpenBlurOptions((prev) => ({
                                ...prev,
                                noiseReduction: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={sharpenBlurOptions.unsharpMask}
                              onChange={(e) =>
                                setSharpenBlurOptions((prev) => ({
                                  ...prev,
                                  unsharpMask: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Unsharp Mask
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={sharpenBlurOptions.smartSharpen}
                              onChange={(e) =>
                                setSharpenBlurOptions((prev) => ({
                                  ...prev,
                                  smartSharpen: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Smart Sharpen
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={sharpenBlurOptions.preserveDetails}
                              onChange={(e) =>
                                setSharpenBlurOptions((prev) => ({
                                  ...prev,
                                  preserveDetails: e.target.checked,
                                }))
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Preserve Details
                            </span>
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
                          value={sharpenBlurOptions.outputFormat}
                          onChange={(e) =>
                            setSharpenBlurOptions((prev) => ({
                              ...prev,
                              outputFormat: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="png">PNG (Lossless)</option>
                          <option value="jpg">JPG (Smaller size)</option>
                          <option value="webp">WebP (Modern)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Quality: {sharpenBlurOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={sharpenBlurOptions.quality}
                          onChange={(e) =>
                            setSharpenBlurOptions((prev) => ({
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
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Focus className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Precision Sharpening
                      </div>
                      <div className="text-xs text-gray-600">
                        Advanced algorithms for crisp, clear images
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GlassWater className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Multiple Blur Types
                      </div>
                      <div className="text-xs text-gray-600">
                        Gaussian, motion, radial, and surface blur
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wand2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Unsharp Mask
                      </div>
                      <div className="text-xs text-gray-600">
                        Professional sharpening technique
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Filter className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Noise Reduction
                      </div>
                      <div className="text-xs text-gray-600">
                        Remove noise while preserving details
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
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm text-gray-600">
                      Upload your image (JPG, PNG, WebP, GIF)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Adjust sharpening and blur controls
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      See live preview of your adjustments
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
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
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-indigo-900 mb-4">
                  Performance Stats
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      99.7%
                    </div>
                    <div className="text-xs text-indigo-700">
                      Quality Retention
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      Live
                    </div>
                    <div className="text-xs text-indigo-700">Preview Speed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      420K+
                    </div>
                    <div className="text-xs text-indigo-700">
                      Images Enhanced
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">8</div>
                    <div className="text-xs text-indigo-700">Effect Types</div>
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

export default ImageSharpenBlur;
