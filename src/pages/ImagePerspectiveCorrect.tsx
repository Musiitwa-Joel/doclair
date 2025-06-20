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
  Square,
  Move,
  Grid3X3,
  Maximize,
  MousePointer,
  RefreshCw,
  Crosshair,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  Scan,
  Wand2,
} from "lucide-react";

interface PerspectivePoint {
  x: number;
  y: number;
}

interface PerspectiveCorrectOptions {
  corners: {
    topLeft: PerspectivePoint;
    topRight: PerspectivePoint;
    bottomLeft: PerspectivePoint;
    bottomRight: PerspectivePoint;
  };
  outputWidth: number;
  outputHeight: number;
  autoDetect: boolean;
  gridOverlay: boolean;
  outputFormat?: "png" | "jpg" | "jpeg" | "webp";
  quality?: number;
  interpolation?: "bilinear" | "bicubic" | "nearest";
}

interface PerspectiveCorrectResult {
  filename: string;
  originalDimensions: { width: number; height: number };
  correctedDimensions: { width: number; height: number };
  processingTime: number;
  downloadUrl: string;
  correctionAngle: number;
  keyStoneCorrection: number;
}

const ImagePerspectiveCorrect: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [correctionResult, setCorrectionResult] =
    useState<PerspectiveCorrectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [correctionOptions, setCorrectionOptions] =
    useState<PerspectiveCorrectOptions>({
      corners: {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 100, y: 0 },
        bottomLeft: { x: 0, y: 100 },
        bottomRight: { x: 100, y: 100 },
      },
      outputWidth: 800,
      outputHeight: 600,
      autoDetect: false,
      gridOverlay: true,
      outputFormat: "png",
      quality: 95,
      interpolation: "bicubic",
    });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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
    setCorrectionResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFilePreview(imageUrl);

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });

        // Initialize corner points based on image dimensions
        const margin = 0.1; // 10% margin from edges
        setCorrectionOptions((prev) => ({
          ...prev,
          corners: {
            topLeft: { x: img.width * margin, y: img.height * margin },
            topRight: { x: img.width * (1 - margin), y: img.height * margin },
            bottomLeft: { x: img.width * margin, y: img.height * (1 - margin) },
            bottomRight: {
              x: img.width * (1 - margin),
              y: img.height * (1 - margin),
            },
          },
          outputWidth: img.width,
          outputHeight: img.height,
        }));
      };
      img.src = imageUrl;
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

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageDimensions) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) / rect.width) * imageDimensions.width;
    const y =
      ((event.clientY - rect.top) / rect.height) * imageDimensions.height;

    if (selectedCorner) {
      setCorrectionOptions((prev) => ({
        ...prev,
        corners: {
          ...prev.corners,
          [selectedCorner]: { x, y },
        },
      }));
      setSelectedCorner(null);
    }
  };

  const autoDetectCorners = async () => {
    if (!uploadedFile || !imageDimensions) return;

    setIsProcessing(true);

    // Simulate auto-detection process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock auto-detected corners (in a real implementation, this would use computer vision)
    const mockCorners = {
      topLeft: {
        x: imageDimensions.width * 0.15,
        y: imageDimensions.height * 0.12,
      },
      topRight: {
        x: imageDimensions.width * 0.88,
        y: imageDimensions.height * 0.08,
      },
      bottomLeft: {
        x: imageDimensions.width * 0.12,
        y: imageDimensions.height * 0.92,
      },
      bottomRight: {
        x: imageDimensions.width * 0.85,
        y: imageDimensions.height * 0.95,
      },
    };

    setCorrectionOptions((prev) => ({
      ...prev,
      corners: mockCorners,
    }));

    setIsProcessing(false);
  };

  const correctPerspective = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("correctionOptions", JSON.stringify(correctionOptions));

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

      const response = await fetch("/api/tools/image/perspective-correct", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Perspective correction failed");
      }

      // Get correction metadata from headers
      const processingTime = parseInt(
        response.headers.get("X-Processing-Time") || "0"
      );
      const originalDimensions = response.headers
        .get("X-Original-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const correctedDimensions = response.headers
        .get("X-Corrected-Dimensions")
        ?.split("x")
        .map(Number) || [0, 0];
      const correctionAngle = parseFloat(
        response.headers.get("X-Correction-Angle") || "0"
      );
      const keyStoneCorrection = parseFloat(
        response.headers.get("X-Keystone-Correction") || "0"
      );

      // Create download blob
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] ||
        `corrected_${uploadedFile.name.replace(
          /\.[^/.]+$/,
          `.${correctionOptions.outputFormat}`
        )}`;

      setCorrectionResult({
        filename,
        originalDimensions: {
          width: originalDimensions[0],
          height: originalDimensions[1],
        },
        correctedDimensions: {
          width: correctedDimensions[0],
          height: correctedDimensions[1],
        },
        processingTime,
        downloadUrl,
        correctionAngle,
        keyStoneCorrection,
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
    if (!correctionResult) return;

    const link = document.createElement("a");
    link.href = correctionResult.downloadUrl;
    link.download = correctionResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetCorrection = () => {
    if (!imageDimensions) return;

    // Reset to default corners
    const margin = 0.1; // 10% margin from edges
    setCorrectionOptions((prev) => ({
      ...prev,
      corners: {
        topLeft: {
          x: imageDimensions.width * margin,
          y: imageDimensions.height * margin,
        },
        topRight: {
          x: imageDimensions.width * (1 - margin),
          y: imageDimensions.height * margin,
        },
        bottomLeft: {
          x: imageDimensions.width * margin,
          y: imageDimensions.height * (1 - margin),
        },
        bottomRight: {
          x: imageDimensions.width * (1 - margin),
          y: imageDimensions.height * (1 - margin),
        },
      },
    }));
    setCorrectionResult(null);
  };

  const resetProcessor = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setImageDimensions(null);
    setCorrectionResult(null);
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

  // Draw the corner markers and grid overlay
  useEffect(() => {
    if (!filePreview || !canvasRef.current || !imageDimensions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    // Draw the image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Draw grid overlay
      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0; i <= 10; i++) {
          const x = (imageDimensions.width / 10) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, imageDimensions.height);
          ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
          const y = (imageDimensions.height / 10) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(imageDimensions.width, y);
          ctx.stroke();
        }
      }

      // Draw the perspective points
      const { corners } = correctionOptions;
      const cornerPoints = [
        {
          key: "topLeft",
          point: corners.topLeft,
          color: "#FF3B30",
          icon: CornerUpLeft,
        },
        {
          key: "topRight",
          point: corners.topRight,
          color: "#34C759",
          icon: CornerUpRight,
        },
        {
          key: "bottomLeft",
          point: corners.bottomLeft,
          color: "#007AFF",
          icon: CornerDownLeft,
        },
        {
          key: "bottomRight",
          point: corners.bottomRight,
          color: "#FF9500",
          icon: CornerDownRight,
        },
      ];

      // Draw lines connecting the corners
      ctx.beginPath();
      ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
      ctx.lineTo(corners.topRight.x, corners.topRight.y);
      ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
      ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
      ctx.closePath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw corner points
      cornerPoints.forEach(({ key, point, color }) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.fillStyle =
          selectedCorner === key ? "rgba(255, 255, 255, 0.9)" : color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };
    img.src = filePreview;
  }, [
    filePreview,
    imageDimensions,
    correctionOptions.corners,
    selectedCorner,
    showGrid,
  ]);

  // Presets for common perspective corrections
  const presets = [
    { name: "Document Scan", description: "Ideal for documents and papers" },
    { name: "Building Front", description: "For architecture and buildings" },
    { name: "Whiteboard", description: "For presentations and notes" },
    { name: "Product Photo", description: "For product photography" },
  ];

  const applyPreset = (presetName: string) => {
    if (!imageDimensions) return;

    const { width, height } = imageDimensions;

    switch (presetName) {
      case "Document Scan":
        setCorrectionOptions((prev) => ({
          ...prev,
          corners: {
            topLeft: { x: width * 0.1, y: height * 0.1 },
            topRight: { x: width * 0.9, y: height * 0.1 },
            bottomLeft: { x: width * 0.1, y: height * 0.9 },
            bottomRight: { x: width * 0.9, y: height * 0.9 },
          },
          outputWidth: width,
          outputHeight: height,
          interpolation: "bicubic",
        }));
        break;
      case "Building Front":
        setCorrectionOptions((prev) => ({
          ...prev,
          corners: {
            topLeft: { x: width * 0.2, y: height * 0.15 },
            topRight: { x: width * 0.8, y: height * 0.15 },
            bottomLeft: { x: width * 0.1, y: height * 0.9 },
            bottomRight: { x: width * 0.9, y: height * 0.9 },
          },
          outputWidth: width,
          outputHeight: Math.round(height * 1.2),
          interpolation: "bilinear",
        }));
        break;
      case "Whiteboard":
        setCorrectionOptions((prev) => ({
          ...prev,
          corners: {
            topLeft: { x: width * 0.15, y: height * 0.1 },
            topRight: { x: width * 0.85, y: height * 0.1 },
            bottomLeft: { x: width * 0.15, y: height * 0.85 },
            bottomRight: { x: width * 0.85, y: height * 0.85 },
          },
          outputWidth: Math.round(width * 1.2),
          outputHeight: Math.round(height * 0.8),
          interpolation: "bicubic",
        }));
        break;
      case "Product Photo":
        setCorrectionOptions((prev) => ({
          ...prev,
          corners: {
            topLeft: { x: width * 0.25, y: height * 0.2 },
            topRight: { x: width * 0.75, y: height * 0.2 },
            bottomLeft: { x: width * 0.25, y: height * 0.8 },
            bottomRight: { x: width * 0.75, y: height * 0.8 },
          },
          outputWidth: Math.round(width * 0.8),
          outputHeight: Math.round(height * 0.8),
          interpolation: "bicubic",
        }));
        break;
    }
  };

  return (
    <>
      <Helmet>
        <title>
          Perspective Correction Tool - Fix Distortion & Keystone Effects |
          Doclair
        </title>
        <meta
          name="description"
          content="Fix perspective distortion and keystone effects in photos. Perfect for document scans, architecture photos, and whiteboard images."
        />
        <meta
          name="keywords"
          content="perspective correction, keystone effect, image distortion, document scan, photo correction, perspective fix"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/perspective-correct"
        />
        <meta
          property="og:title"
          content="Perspective Correction Tool - Fix Distortion & Keystone Effects"
        />
        <meta
          property="og:description"
          content="Professional tool to fix perspective distortion and keystone effects in photos with precision control."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl mb-6 shadow-2xl">
                <Grid3X3 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Perspective{" "}
                <span className="cursive-text text-5xl text-indigo-600">
                  Correct
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
                Fix perspective distortion and keystone effects with{" "}
                <span className="cursive-text text-blue-600 text-xl">
                  precision control
                </span>
                . Perfect for document scans, architecture photos, and
                whiteboard images.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Crosshair className="h-4 w-4" />
                  Precise Corner Control
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Scan className="h-4 w-4" />
                  Auto-Detection
                </div>
                <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Grid Overlay
                </div>
                <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Preset Corrections
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Correction Area */}
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
                            {imageDimensions &&
                              ` • ${imageDimensions.width}×${imageDimensions.height}px`}
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

                    {/* Perspective Correction Interface */}
                    {filePreview && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Perspective Control
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowGrid(!showGrid)}
                              className={`p-2 rounded-lg ${
                                showGrid
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                              title="Toggle Grid"
                            >
                              <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={autoDetectCorners}
                              disabled={isProcessing}
                              className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Auto-Detect Corners"
                            >
                              {isProcessing ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                              ) : (
                                <Scan className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={resetCorrection}
                              className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                              title="Reset Corners"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                          <div
                            className="relative"
                            style={{
                              width: "100%",
                              height: "auto",
                              maxHeight: "500px",
                              overflow: "hidden",
                            }}
                            onClick={handleImageClick}
                          >
                            <img
                              ref={imageRef}
                              src={filePreview}
                              alt="Preview"
                              className="w-full h-auto object-contain"
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            />
                          </div>

                          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1.5 rounded-full">
                            {selectedCorner ? (
                              <>Click to place {selectedCorner} corner</>
                            ) : (
                              <>Select a corner or drag points to adjust</>
                            )}
                          </div>
                        </div>

                        {/* Corner Selection Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button
                            onClick={() => setSelectedCorner("topLeft")}
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                              selectedCorner === "topLeft"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <CornerUpLeft className="h-4 w-4" />
                            <span className="text-sm">Top Left</span>
                          </button>
                          <button
                            onClick={() => setSelectedCorner("topRight")}
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                              selectedCorner === "topRight"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <CornerUpRight className="h-4 w-4" />
                            <span className="text-sm">Top Right</span>
                          </button>
                          <button
                            onClick={() => setSelectedCorner("bottomLeft")}
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                              selectedCorner === "bottomLeft"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <CornerDownLeft className="h-4 w-4" />
                            <span className="text-sm">Bottom Left</span>
                          </button>
                          <button
                            onClick={() => setSelectedCorner("bottomRight")}
                            className={`p-2 rounded-lg flex items-center gap-2 ${
                              selectedCorner === "bottomRight"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <CornerDownRight className="h-4 w-4" />
                            <span className="text-sm">Bottom Right</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                          <span className="font-semibold text-indigo-900">
                            Correcting perspective...
                          </span>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-indigo-700">
                          {processingProgress < 30 &&
                            "Analyzing image geometry..."}
                          {processingProgress >= 30 &&
                            processingProgress < 60 &&
                            "Calculating transformation matrix..."}
                          {processingProgress >= 60 &&
                            processingProgress < 90 &&
                            "Applying perspective correction..."}
                          {processingProgress >= 90 && "Finalizing image..."}
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
                              Correction Failed
                            </div>
                            <div className="text-red-700 text-sm mt-1">
                              {error}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Correction Result */}
                    {correctionResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-green-900 mb-2">
                              Perspective Correction Complete!
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 mb-4">
                              <div>
                                <span className="font-medium">Original:</span>{" "}
                                {correctionResult.originalDimensions.width}×
                                {correctionResult.originalDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">Corrected:</span>{" "}
                                {correctionResult.correctedDimensions.width}×
                                {correctionResult.correctedDimensions.height}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Processing Time:
                                </span>{" "}
                                {formatTime(correctionResult.processingTime)}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Correction Angle:
                                </span>{" "}
                                {correctionResult.correctionAngle.toFixed(1)}°
                              </div>
                            </div>
                            <button
                              onClick={downloadFile}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="h-5 w-5" />
                              Download Corrected Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Correct Button */}
                    {!isProcessing && !correctionResult && (
                      <button
                        onClick={correctPerspective}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                      >
                        <Grid3X3 className="h-6 w-6" />
                        Correct Perspective
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

              {/* Output Settings */}
              {uploadedFile && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Output Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Output Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Width (px)
                        </label>
                        <input
                          type="number"
                          value={correctionOptions.outputWidth}
                          onChange={(e) =>
                            setCorrectionOptions((prev) => ({
                              ...prev,
                              outputWidth: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Height (px)
                        </label>
                        <input
                          type="number"
                          value={correctionOptions.outputHeight}
                          onChange={(e) =>
                            setCorrectionOptions((prev) => ({
                              ...prev,
                              outputHeight: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Output Format and Quality */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Output Format
                        </label>
                        <select
                          value={correctionOptions.outputFormat}
                          onChange={(e) =>
                            setCorrectionOptions((prev) => ({
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
                          Quality: {correctionOptions.quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={correctionOptions.quality}
                          onChange={(e) =>
                            setCorrectionOptions((prev) => ({
                              ...prev,
                              quality: parseInt(e.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Interpolation Method */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interpolation Method
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {
                            value: "bicubic",
                            label: "Bicubic",
                            desc: "Best quality",
                          },
                          {
                            value: "bilinear",
                            label: "Bilinear",
                            desc: "Balanced",
                          },
                          {
                            value: "nearest",
                            label: "Nearest",
                            desc: "Fastest",
                          },
                        ].map((method) => (
                          <button
                            key={method.value}
                            onClick={() =>
                              setCorrectionOptions((prev) => ({
                                ...prev,
                                interpolation: method.value as any,
                              }))
                            }
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              correctionOptions.interpolation === method.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold text-sm">
                              {method.label}
                            </div>
                            <div className="text-xs opacity-75">
                              {method.desc}
                            </div>
                          </button>
                        ))}
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
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    Correction Presets
                  </h3>
                  <div className="space-y-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset.name)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
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
                    <Crosshair className="h-5 w-5 text-indigo-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Precise Corner Control
                      </div>
                      <div className="text-xs text-gray-600">
                        Manually adjust each corner for perfect alignment
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Scan className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Auto-Detection
                      </div>
                      <div className="text-xs text-gray-600">
                        AI-powered corner detection for quick corrections
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Grid3X3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Grid Overlay
                      </div>
                      <div className="text-xs text-gray-600">
                        Visual guide for perfect alignment
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Wand2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Correction Presets
                      </div>
                      <div className="text-xs text-gray-600">
                        Quick settings for common correction scenarios
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
                      Upload your image with perspective distortion
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm text-gray-600">
                      Position the four corner points or use auto-detection
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm text-gray-600">
                      Adjust output settings for optimal results
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div className="text-sm text-gray-600">
                      Download your perfectly corrected image
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
                      Your images are processed securely and automatically
                      deleted after correction. We never store or share your
                      images.
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
                      99.5%
                    </div>
                    <div className="text-xs text-indigo-700">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      3.5s
                    </div>
                    <div className="text-xs text-indigo-700">
                      Avg. Processing
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      450K+
                    </div>
                    <div className="text-xs text-indigo-700">
                      Images Corrected
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      4.9/5
                    </div>
                    <div className="text-xs text-indigo-700">User Rating</div>
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

export default ImagePerspectiveCorrect;
