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
  History,
  Wand2,
  Scissors,
  Palette,
  RefreshCw,
  Scan,
  Maximize,
  Brush,
  Eraser,
  Camera,
  Aperture,
  Contrast,
  Droplet,
  Syringe,
  Loader,
} from "lucide-react";

interface RestoreOptions {
  enhanceMode: "auto" | "colorize" | "enhance" | "repair";
  colorizeStrength: number;
  enhanceDetails: boolean;
  repairDamage: boolean;
  removeNoise: boolean;
  sharpenImage: boolean;
  enhanceContrast: boolean;
  outputFormat: "png" | "jpg" | "jpeg" | "webp";
  quality: number;
}

interface RestoreResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  enhancements: string[];
  restorationScore: number;
}

const RestoreOldPhotos: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    enhanceMode: "auto",
    colorizeStrength: 75,
    enhanceDetails: true,
    repairDamage: true,
    removeNoise: true,
    sharpenImage: true,
    enhanceContrast: true,
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
      "image/tiff",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, WebP, GIF, TIFF).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      setError("File size must be less than 50MB.");
      return;
    }

    setUploadedFile(file);
    setError(null);
    setRestoreResult(null);
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

  const restorePhoto = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("restoreOptions", JSON.stringify(restoreOptions));

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

      // Mock API call - in a real implementation, this would be a fetch to your backend
      // const response = await fetch("/api/tools/image/restore-photo", {
      //   method: "POST",
      //   body: formData,
      // });

      // Simulate API response for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Create a mock processed image (in a real app, this would come from the API)
      // For demo, we'll just use a filter on the original image
      const img = new Image();
      img.src = filePreview as string;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Apply a simple sepia filter for demo purposes
        if (restoreOptions.enhanceMode === "colorize") {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Sepia effect
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          }

          ctx.putImageData(imageData, 0, 0);
        } else {
          // Apply contrast enhancement for other modes
          ctx.filter = "contrast(120%) brightness(105%)";
          ctx.drawImage(img, 0, 0);
          ctx.filter = "none";
        }
      }

      const processedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setProcessedPreview(processedDataUrl);

      // Create mock result
      const enhancements = [];
      if (restoreOptions.enhanceMode === "colorize")
        enhancements.push("Colorization");
      if (restoreOptions.enhanceDetails)
        enhancements.push("Detail enhancement");
      if (restoreOptions.repairDamage) enhancements.push("Damage repair");
      if (restoreOptions.removeNoise) enhancements.push("Noise reduction");
      if (restoreOptions.sharpenImage) enhancements.push("Image sharpening");
      if (restoreOptions.enhanceContrast)
        enhancements.push("Contrast enhancement");

      setRestoreResult({
        filename: `restored_${uploadedFile.name}`,
        originalDimensions: { width: img.width, height: img.height },
        processedDimensions: { width: img.width, height: img.height },
        processingTime: 3245, // mock processing time in ms
        downloadUrl: processedDataUrl,
        enhancements,
        restorationScore: 8.7,
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
    if (!restoreResult) return;

    const link = document.createElement("a");
    link.href = restoreResult.downloadUrl;
    link.download = restoreResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setProcessedPreview(null);
    setRestoreResult(null);
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

  return (
    <>
      <Helmet>
        <title>Restore Old Photos - AI Photo Restoration Tool | Doclair</title>
        <meta
          name="description"
          content="Restore old, damaged, and faded photos with AI technology. Repair scratches, enhance details, and even colorize black and white images."
        />
        <meta
          name="keywords"
          content="photo restoration, old photo repair, colorize black and white, fix damaged photos, AI photo enhancement, vintage photo restoration"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/restore-old-photos"
        />
        <meta
          property="og:title"
          content="Restore Old Photos - AI Photo Restoration Tool"
        />
        <meta
          property="og:description"
          content="Professional AI-powered photo restoration tool. Repair scratches, enhance details, and colorize black and white images."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl mb-6 shadow-2xl">
                <History className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Restore{" "}
                <span className="cursive-text text-5xl text-amber-600">
                  Old Photos
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Breathe new life into old, damaged, and faded photos with{" "}
                <span className="cursive-text text-amber-600 text-xl">
                  AI restoration
                </span>
                . Repair scratches, enhance details, and even colorize black and
                white images.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI-Powered
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Brush className="h-4 w-4" />
                  Damage Repair
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colorization
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
                  Upload Old Photo
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
                      Drop your old photo here or click to browse
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Supports JPG, PNG, WebP, GIF, TIFF files up to 50MB
                    </p>
                    <button className="btn-primary">
                      <Upload className="h-5 w-5" />
                      Choose Photo
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
                            Restored (Preview)
                          </div>
                          {processedPreview ? (
                            <img
                              src={processedPreview}
                              alt="Restored"
                              className="w-full h-auto object-contain rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                Restoration preview will appear here
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
                            Restoring photo...
                          </span>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-amber-700">
                          {processingProgress < 30 && "Analyzing photo..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Repairing damage..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            (restoreOptions.enhanceMode === "colorize"
                              ? "Applying colorization..."
                              : "Enhancing details...")}
                          {processingProgress >= 90 &&
                            "Finalizing restoration..."}
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
                              Restoration Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Restoration Result */}
                    {restoreResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Photo Restoration Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Dimensions:</span>{" "}
                                {restoreResult.processedDimensions.width}×
                                {restoreResult.processedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(restoreResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Restoration Score:
                                </span>{" "}
                                {restoreResult.restorationScore.toFixed(1)}/10
                              </div>
                              <div>
                                <span className="font-medium">Mode:</span>{" "}
                                {restoreOptions.enhanceMode
                                  .charAt(0)
                                  .toUpperCase() +
                                  restoreOptions.enhanceMode.slice(1)}
                              </div>
                            </div>
                            {restoreResult.enhancements.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-green-800">
                                  Applied Enhancements:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {restoreResult.enhancements.map(
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
                              Download Restored Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Restore Button */}
                    {!isProcessing && !restoreResult && (
                      <button
                        onClick={restorePhoto}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Wand2 className="h-6 w-6" />
                        Restore Photo
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

              {/* Restoration Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Restoration Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Restoration Mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Restoration Mode
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {
                            value: "auto",
                            label: "Auto",
                            desc: "Best overall",
                            icon: Wand2,
                          },
                          {
                            value: "colorize",
                            label: "Colorize",
                            desc: "B&W to color",
                            icon: Palette,
                          },
                          {
                            value: "enhance",
                            label: "Enhance",
                            desc: "Improve details",
                            icon: Aperture,
                          },
                          {
                            value: "repair",
                            label: "Repair",
                            desc: "Fix damage",
                            icon: Brush,
                          },
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() =>
                              setRestoreOptions((prev) => ({
                                ...prev,
                                enhanceMode: mode.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              restoreOptions.enhanceMode === mode.value
                                ? "border-amber-500 bg-amber-50 text-amber-700"
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

                    {/* Colorization Strength (only for colorize mode) */}
                    {restoreOptions.enhanceMode === "colorize" && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Colorization Strength:{" "}
                          {restoreOptions.colorizeStrength}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={restoreOptions.colorizeStrength}
                          onChange={(e) =>
                            setRestoreOptions((prev) => ({
                              ...prev,
                              colorizeStrength: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Subtle</span>
                          <span>Natural</span>
                          <span>Vivid</span>
                        </div>
                      </div>
                    )}

                    {/* Enhancement Options */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Enhancement Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Brush className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Repair Damage
                              </div>
                              <div className="text-xs text-gray-600">
                                Fix scratches and tears
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.repairDamage}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  repairDamage: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Maximize className="h-5 w-5 text-purple-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Enhance Details
                              </div>
                              <div className="text-xs text-gray-600">
                                Improve clarity and sharpness
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.enhanceDetails}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  enhanceDetails: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Droplet className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Remove Noise
                              </div>
                              <div className="text-xs text-gray-600">
                                Smooth grainy textures
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.removeNoise}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  removeNoise: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Contrast className="h-5 w-5 text-orange-600" />
                            <div>
                              <div className="font-semibold text-gray-900">
                                Enhance Contrast
                              </div>
                              <div className="text-xs text-gray-600">
                                Improve faded images
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={restoreOptions.enhanceContrast}
                              onChange={(e) =>
                                setRestoreOptions((prev) => ({
                                  ...prev,
                                  enhanceContrast: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
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
                          value={restoreOptions.outputFormat}
                          onChange={(e) =>
                            setRestoreOptions((prev) => ({
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
                          Quality: {restoreOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={restoreOptions.quality}
                          onChange={(e) =>
                            setRestoreOptions((prev) => ({
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
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Key Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        AI Restoration
                      </div>
                      <div className="text-xs text-gray-600">
                        Advanced neural networks for photo repair
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        B&W Colorization
                      </div>
                      <div className="text-xs text-gray-600">
                        Add natural colors to black and white photos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brush className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Damage Repair
                      </div>
                      <div className="text-xs text-gray-600">
                        Fix scratches, tears, and stains automatically
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Aperture className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Detail Enhancement
                      </div>
                      <div className="text-xs text-gray-600">
                        Sharpen and clarify faded details
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
                      Upload your old or damaged photo
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Choose restoration mode and settings
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      AI analyzes and restores your photo
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your beautifully restored image
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
                      Family photo albums
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Historical photographs
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Genealogy research
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Vintage postcards
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Archival preservation
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      Memorial displays
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
                      Your photos are processed securely and automatically
                      deleted after restoration. We never store or share your
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
                      Detail Recovery
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      5.3s
                    </div>
                    <div className="text-xs text-amber-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      450K+
                    </div>
                    <div className="text-xs text-amber-700">
                      Photos Restored
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

export default RestoreOldPhotos;
