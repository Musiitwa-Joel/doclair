import React, { useState, useRef, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  Download,
  Crop,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Grid3X3,
  Maximize2,
  Square,
  Circle,
  Scissors,
  Settings,
  Eye,
  Layers,
  Target,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  MousePointer,
  Hand,
  MoreHorizontal,
  Crosshair,
  Focus,
  Expand,
} from "lucide-react";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface CropSettings {
  outputFormat: "png" | "jpg" | "webp";
  quality: number;
  maintainAspectRatio: boolean;
  aspectRatio?: string;
  cropMode: "precise" | "smart" | "face-detect";
  showGrid: boolean;
  gridType: "thirds" | "golden" | "diagonal" | "center" | "custom";
  snapToGrid: boolean;
  showGuides: boolean;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

const ImageCrop: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<"crop" | "move" | "zoom">("crop");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [settings, setSettings] = useState<CropSettings>({
    outputFormat: "png",
    quality: 95,
    maintainAspectRatio: false,
    cropMode: "precise",
    showGrid: true,
    gridType: "thirds",
    snapToGrid: false,
    showGuides: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aspectRatios = [
    { label: "Free", value: "free" },
    { label: "1:1 (Square)", value: "1:1" },
    { label: "4:3 (Standard)", value: "4:3" },
    { label: "16:9 (Widescreen)", value: "16:9" },
    { label: "3:2 (Photo)", value: "3:2" },
    { label: "5:4 (Print)", value: "5:4" },
    { label: "2:3 (Portrait)", value: "2:3" },
    { label: "9:16 (Mobile)", value: "9:16" },
    { label: "21:9 (Cinematic)", value: "21:9" },
  ];

  const presetSizes = [
    {
      label: "Instagram Square",
      width: 1080,
      height: 1080,
      color: "from-pink-500 to-purple-500",
    },
    {
      label: "Instagram Story",
      width: 1080,
      height: 1920,
      color: "from-purple-500 to-indigo-500",
    },
    {
      label: "Facebook Cover",
      width: 1200,
      height: 630,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Twitter Header",
      width: 1500,
      height: 500,
      color: "from-cyan-500 to-blue-500",
    },
    {
      label: "LinkedIn Banner",
      width: 1584,
      height: 396,
      color: "from-blue-600 to-indigo-600",
    },
    {
      label: "YouTube Thumbnail",
      width: 1280,
      height: 720,
      color: "from-red-500 to-orange-500",
    },
    {
      label: "Pinterest Pin",
      width: 1000,
      height: 1500,
      color: "from-red-600 to-pink-600",
    },
    {
      label: "TikTok Video",
      width: 1080,
      height: 1920,
      color: "from-gray-800 to-gray-900",
    },
  ];

  const gridTypes = [
    { label: "Rule of Thirds", value: "thirds" },
    { label: "Golden Ratio", value: "golden" },
    { label: "Diagonal Lines", value: "diagonal" },
    { label: "Center Cross", value: "center" },
    { label: "Custom Grid", value: "custom" },
  ];

  // Calculate image display properties
  useEffect(() => {
    if (containerRef.current && imageDimensions) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;

      const scaleX = containerWidth / imageDimensions.width;
      const scaleY = containerHeight / imageDimensions.height;
      const scale = Math.min(scaleX, scaleY, 1) * zoom;

      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;

      setImageScale(scale);
      setImageOffset({
        x: (containerWidth - displayWidth) / 2 + pan.x,
        y: (containerHeight - displayHeight) / 2 + pan.y,
      });
      setCanvasSize({ width: displayWidth, height: displayHeight });
    }
  }, [imageDimensions, zoom, pan]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, WebP).");
        return;
      }

      setUploadedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          // Set initial crop area to center 60% of image
          const cropWidth = img.width * 0.6;
          const cropHeight = img.height * 0.6;
          setCropArea({
            x: (img.width - cropWidth) / 2,
            y: (img.height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight,
          });
          setZoom(1);
          setPan({ x: 0, y: 0 });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback(
    (screenX: number, screenY: number) => {
      if (!imageDimensions || !imageScale) return { x: 0, y: 0 };

      const imageX = (screenX - imageOffset.x) / imageScale;
      const imageY = (screenY - imageOffset.y) / imageScale;

      return { x: imageX, y: imageY };
    },
    [imageDimensions, imageScale, imageOffset]
  );

  // Convert image coordinates to screen coordinates
  const imageToScreen = useCallback(
    (imageX: number, imageY: number) => {
      if (!imageDimensions || !imageScale) return { x: 0, y: 0 };

      const screenX = imageX * imageScale + imageOffset.x;
      const screenY = imageY * imageScale + imageOffset.y;

      return { x: screenX, y: screenY };
    },
    [imageDimensions, imageScale, imageOffset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle?: ResizeHandle) => {
      if (!imageDimensions) return;

      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setIsDragging(true);
      setActiveHandle(handle || "move");
      setDragStart({
        x: mouseX,
        y: mouseY,
        cropX: cropArea.x,
        cropY: cropArea.y,
        cropWidth: cropArea.width,
        cropHeight: cropArea.height,
      });
    },
    [imageDimensions, cropArea]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageDimensions || !activeHandle) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      // Convert screen delta to image delta
      const imageDeltaX = deltaX / imageScale;
      const imageDeltaY = deltaY / imageScale;

      let newCrop = { ...cropArea };

      if (activeHandle === "move") {
        // Move the entire crop area
        newCrop.x = Math.max(
          0,
          Math.min(
            dragStart.cropX + imageDeltaX,
            imageDimensions.width - cropArea.width
          )
        );
        newCrop.y = Math.max(
          0,
          Math.min(
            dragStart.cropY + imageDeltaY,
            imageDimensions.height - cropArea.height
          )
        );
      } else {
        // Resize based on handle
        const aspectRatio =
          settings.maintainAspectRatio && settings.aspectRatio !== "free"
            ? (() => {
                const [w, h] = (settings.aspectRatio || "1:1")
                  .split(":")
                  .map(Number);
                return w / h;
              })()
            : null;

        switch (activeHandle) {
          case "nw":
            newCrop.x = Math.max(0, dragStart.cropX + imageDeltaX);
            newCrop.y = Math.max(0, dragStart.cropY + imageDeltaY);
            newCrop.width = Math.max(20, dragStart.cropWidth - imageDeltaX);
            newCrop.height = Math.max(20, dragStart.cropHeight - imageDeltaY);
            break;
          case "n":
            newCrop.y = Math.max(0, dragStart.cropY + imageDeltaY);
            newCrop.height = Math.max(20, dragStart.cropHeight - imageDeltaY);
            break;
          case "ne":
            newCrop.y = Math.max(0, dragStart.cropY + imageDeltaY);
            newCrop.width = Math.max(20, dragStart.cropWidth + imageDeltaX);
            newCrop.height = Math.max(20, dragStart.cropHeight - imageDeltaY);
            break;
          case "e":
            newCrop.width = Math.max(20, dragStart.cropWidth + imageDeltaX);
            break;
          case "se":
            newCrop.width = Math.max(20, dragStart.cropWidth + imageDeltaX);
            newCrop.height = Math.max(20, dragStart.cropHeight + imageDeltaY);
            break;
          case "s":
            newCrop.height = Math.max(20, dragStart.cropHeight + imageDeltaY);
            break;
          case "sw":
            newCrop.x = Math.max(0, dragStart.cropX + imageDeltaX);
            newCrop.width = Math.max(20, dragStart.cropWidth - imageDeltaX);
            newCrop.height = Math.max(20, dragStart.cropHeight + imageDeltaY);
            break;
          case "w":
            newCrop.x = Math.max(0, dragStart.cropX + imageDeltaX);
            newCrop.width = Math.max(20, dragStart.cropWidth - imageDeltaX);
            break;
        }

        // Apply aspect ratio constraint
        if (aspectRatio && activeHandle !== "move") {
          if (["e", "w", "ne", "nw", "se", "sw"].includes(activeHandle)) {
            newCrop.height = newCrop.width / aspectRatio;
          } else if (["n", "s"].includes(activeHandle)) {
            newCrop.width = newCrop.height * aspectRatio;
          }
        }

        // Ensure crop stays within image bounds
        if (newCrop.x + newCrop.width > imageDimensions.width) {
          newCrop.width = imageDimensions.width - newCrop.x;
          if (aspectRatio) newCrop.height = newCrop.width / aspectRatio;
        }
        if (newCrop.y + newCrop.height > imageDimensions.height) {
          newCrop.height = imageDimensions.height - newCrop.y;
          if (aspectRatio) newCrop.width = newCrop.height * aspectRatio;
        }
      }

      setCropArea(newCrop);
    },
    [
      isDragging,
      imageDimensions,
      activeHandle,
      dragStart,
      imageScale,
      cropArea,
      settings,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  // Add event listeners for mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const applyPresetSize = (preset: (typeof presetSizes)[0]) => {
    if (!imageDimensions) return;

    const scale = Math.min(
      imageDimensions.width / preset.width,
      imageDimensions.height / preset.height
    );

    const scaledWidth = Math.min(preset.width * scale, imageDimensions.width);
    const scaledHeight = Math.min(
      preset.height * scale,
      imageDimensions.height
    );

    setCropArea({
      x: (imageDimensions.width - scaledWidth) / 2,
      y: (imageDimensions.height - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });
  };

  const renderGrid = () => {
    if (!settings.showGrid) return null;

    const lines = [];

    switch (settings.gridType) {
      case "thirds":
        // Rule of thirds
        lines.push(
          <line
            key="v1"
            x1="33.33%"
            y1="0%"
            x2="33.33%"
            y2="100%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />,
          <line
            key="v2"
            x1="66.67%"
            y1="0%"
            x2="66.67%"
            y2="100%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />,
          <line
            key="h1"
            x1="0%"
            y1="33.33%"
            x2="100%"
            y2="33.33%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />,
          <line
            key="h2"
            x1="0%"
            y1="66.67%"
            x2="100%"
            y2="66.67%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />
        );
        break;
      case "golden":
        // Golden ratio
        lines.push(
          <line
            key="v1"
            x1="38.2%"
            y1="0%"
            x2="38.2%"
            y2="100%"
            stroke="rgba(255,215,0,0.6)"
            strokeWidth="1"
          />,
          <line
            key="v2"
            x1="61.8%"
            y1="0%"
            x2="61.8%"
            y2="100%"
            stroke="rgba(255,215,0,0.6)"
            strokeWidth="1"
          />,
          <line
            key="h1"
            x1="0%"
            y1="38.2%"
            x2="100%"
            y2="38.2%"
            stroke="rgba(255,215,0,0.6)"
            strokeWidth="1"
          />,
          <line
            key="h2"
            x1="0%"
            y1="61.8%"
            x2="100%"
            y2="61.8%"
            stroke="rgba(255,215,0,0.6)"
            strokeWidth="1"
          />
        );
        break;
      case "diagonal":
        // Diagonal lines
        lines.push(
          <line
            key="d1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />,
          <line
            key="d2"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
        );
        break;
      case "center":
        // Center cross
        lines.push(
          <line
            key="v"
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />,
          <line
            key="h"
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />
        );
        break;
    }

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {lines}
      </svg>
    );
  };

  const processCrop = async () => {
    if (!uploadedImage || !imageDimensions) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage);
      formData.append(
        "cropOptions",
        JSON.stringify({
          x: Math.round(cropArea.x),
          y: Math.round(cropArea.y),
          width: Math.round(cropArea.width),
          height: Math.round(cropArea.height),
          outputFormat: settings.outputFormat,
          quality: settings.quality,
          maintainAspectRatio: settings.maintainAspectRatio,
          cropMode: settings.cropMode,
        })
      );

      const response = await fetch("/api/tools/image/crop-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Crop failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || `cropped.${settings.outputFormat}`;

      // Create download link
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Crop failed:", error);
      alert(
        `Crop failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    if (!imageDimensions) return;

    const cropWidth = imageDimensions.width * 0.6;
    const cropHeight = imageDimensions.height * 0.6;
    setCropArea({
      x: (imageDimensions.width - cropWidth) / 2,
      y: (imageDimensions.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getCursorStyle = (handle: ResizeHandle) => {
    const cursors = {
      nw: "nw-resize",
      n: "n-resize",
      ne: "ne-resize",
      e: "e-resize",
      se: "se-resize",
      s: "s-resize",
      sw: "sw-resize",
      w: "w-resize",
      move: "move",
    };
    return cursors[handle];
  };

  return (
    <>
      <Helmet>
        <title>
          Professional Image Crop Tool - Free Online Editor | Doclair
        </title>
        <meta
          name="description"
          content="Professional image cropping tool with precision controls, aspect ratio presets, and advanced grid guides. Crop images with pixel-perfect accuracy."
        />
        <meta
          name="keywords"
          content="image crop, photo crop, resize image, aspect ratio, image editor, crop tool"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex p-5 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-3xl mb-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Crop className="h-14 w-14 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                Professional{" "}
                <span className="cursive-text text-6xl md:text-7xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  Image
                </span>{" "}
                Crop
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
                Crop images with{" "}
                <span className="cursive-text text-emerald-600 text-2xl font-semibold">
                  pixel-perfect
                </span>{" "}
                precision. Advanced grid system, movable guides, and
                professional controls for perfect results.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-200/50 shadow-sm">
                  <Grid3X3 className="h-4 w-4" />
                  Movable Grid System
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 border border-green-200/50 shadow-sm">
                  <Target className="h-4 w-4" />
                  Precision Controls
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 border border-purple-200/50 shadow-sm">
                  <Layers className="h-4 w-4" />
                  Smart Presets
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 border border-orange-200/50 shadow-sm">
                  <Focus className="h-4 w-4" />
                  Golden Ratio
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Crop Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* File Upload */}
              {!uploadedImage ? (
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-12">
                  <div
                    className="border-3 border-dashed border-gray-300 rounded-2xl p-20 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-500 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex justify-center mb-8">
                      <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-8 rounded-3xl group-hover:scale-110 transition-transform duration-500 shadow-lg">
                        <Upload className="h-20 w-20 text-emerald-600" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4">
                      Upload Image to Crop
                    </h3>
                    <p className="text-gray-600 mb-8 text-xl leading-relaxed">
                      Drop your image here or click to browse
                      <br />
                      <span className="text-emerald-600 font-semibold">
                        Professional cropping awaits
                      </span>
                    </p>
                    <button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 mx-auto">
                      <Upload className="h-6 w-6" />
                      Choose Image
                    </button>
                    <p className="text-sm text-gray-500 mt-6">
                      Supports JPG, PNG, WebP up to 50MB • Professional quality
                      processing
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Advanced Toolbar */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      {/* Tool Selection */}
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 flex shadow-inner">
                          <button
                            onClick={() => setTool("crop")}
                            className={`p-3 rounded-lg transition-all duration-300 ${
                              tool === "crop"
                                ? "bg-white shadow-lg text-emerald-600 scale-105"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            title="Crop Tool (C)"
                          >
                            <Crop className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setTool("move")}
                            className={`p-3 rounded-lg transition-all duration-300 ${
                              tool === "move"
                                ? "bg-white shadow-lg text-blue-600 scale-105"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            title="Pan Tool (H)"
                          >
                            <Hand className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setTool("zoom")}
                            className={`p-3 rounded-lg transition-all duration-300 ${
                              tool === "zoom"
                                ? "bg-white shadow-lg text-purple-600 scale-105"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            title="Zoom Tool (Z)"
                          >
                            <ZoomIn className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm rounded-xl px-4 py-2">
                          <button
                            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200"
                            title="Zoom Out (-)"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-bold text-gray-700 min-w-[70px] text-center bg-white px-3 py-1 rounded-lg shadow-sm">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200"
                            title="Zoom In (+)"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="h-8 w-px bg-gray-300"></div>

                        {/* Grid Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                showGrid: !prev.showGrid,
                              }))
                            }
                            className={`p-3 rounded-xl transition-all duration-300 ${
                              settings.showGrid
                                ? "bg-blue-100 text-blue-600 shadow-lg"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                            title="Toggle Grid (G)"
                          >
                            <Grid3X3 className="h-5 w-5" />
                          </button>

                          <select
                            value={settings.gridType}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                gridType: e.target.value as any,
                              }))
                            }
                            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {gridTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={resetCrop}
                          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <Upload className="h-4 w-4" />
                          New Image
                        </button>
                        <button
                          onClick={processCrop}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Scissors className="h-5 w-5" />
                              Crop Image
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Crop Canvas */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8">
                    <div
                      ref={containerRef}
                      className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-inner"
                      style={{ height: "700px" }}
                    >
                      {imagePreview && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Checkerboard Background */}
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='12' height='12'/%3E%3Crect x='12' y='12' width='12' height='12'/%3E%3C/g%3E%3C/svg%3E")`,
                              backgroundSize: "24px 24px",
                            }}
                          ></div>

                          {/* Image */}
                          <img
                            ref={imageRef}
                            src={imagePreview}
                            alt="Crop preview"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                            style={{
                              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                              transformOrigin: "center",
                              width: canvasSize.width,
                              height: canvasSize.height,
                              position: "absolute",
                              left: imageOffset.x,
                              top: imageOffset.y,
                            }}
                            draggable={false}
                          />

                          {/* Advanced Crop Overlay */}
                          {imageDimensions && (
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Dark overlay outside crop area */}
                              <div className="absolute inset-0 bg-black bg-opacity-60"></div>

                              {/* Crop area */}
                              <div
                                className="absolute pointer-events-auto"
                                style={{
                                  left: imageOffset.x + cropArea.x * imageScale,
                                  top: imageOffset.y + cropArea.y * imageScale,
                                  width: cropArea.width * imageScale,
                                  height: cropArea.height * imageScale,
                                  cursor: getCursorStyle("move"),
                                }}
                                onMouseDown={(e) => handleMouseDown(e, "move")}
                              >
                                {/* Clear crop area */}
                                <div className="absolute inset-0 bg-transparent border-2 border-white shadow-2xl">
                                  {/* Grid overlay */}
                                  {renderGrid()}

                                  {/* Corner and edge handles */}
                                  {[
                                    {
                                      handle: "nw" as ResizeHandle,
                                      className: "-top-2 -left-2",
                                      cursor: "nw-resize",
                                    },
                                    {
                                      handle: "n" as ResizeHandle,
                                      className:
                                        "-top-2 left-1/2 transform -translate-x-1/2",
                                      cursor: "n-resize",
                                    },
                                    {
                                      handle: "ne" as ResizeHandle,
                                      className: "-top-2 -right-2",
                                      cursor: "ne-resize",
                                    },
                                    {
                                      handle: "e" as ResizeHandle,
                                      className:
                                        "top-1/2 -right-2 transform -translate-y-1/2",
                                      cursor: "e-resize",
                                    },
                                    {
                                      handle: "se" as ResizeHandle,
                                      className: "-bottom-2 -right-2",
                                      cursor: "se-resize",
                                    },
                                    {
                                      handle: "s" as ResizeHandle,
                                      className:
                                        "-bottom-2 left-1/2 transform -translate-x-1/2",
                                      cursor: "s-resize",
                                    },
                                    {
                                      handle: "sw" as ResizeHandle,
                                      className: "-bottom-2 -left-2",
                                      cursor: "sw-resize",
                                    },
                                    {
                                      handle: "w" as ResizeHandle,
                                      className:
                                        "top-1/2 -left-2 transform -translate-y-1/2",
                                      cursor: "w-resize",
                                    },
                                  ].map(({ handle, className, cursor }) => (
                                    <div
                                      key={handle}
                                      className={`absolute w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow-lg hover:bg-emerald-50 hover:scale-125 transition-all duration-200 ${className}`}
                                      style={{ cursor }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleMouseDown(e, handle);
                                      }}
                                    />
                                  ))}

                                  {/* Center crosshair */}
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <Crosshair className="h-6 w-6 text-white opacity-60" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Zoom indicator */}
                          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                            {Math.round(zoom * 100)}% zoom
                          </div>

                          {/* Crop dimensions indicator */}
                          {imageDimensions && (
                            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                              {Math.round(cropArea.width)} ×{" "}
                              {Math.round(cropArea.height)}px
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Aspect Ratio & Presets */}
              {uploadedImage && (
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                    <Target className="h-6 w-6 text-emerald-600" />
                    Aspect Ratio
                  </h3>

                  <div className="space-y-4">
                    <select
                      value={settings.aspectRatio || "free"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          aspectRatio: e.target.value,
                          maintainAspectRatio: e.target.value !== "free",
                        }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                    >
                      {aspectRatios.map((ratio) => (
                        <option key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </option>
                      ))}
                    </select>

                    {/* Lock aspect ratio toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        {settings.maintainAspectRatio ? (
                          <Lock className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm font-semibold text-gray-700">
                          Lock Ratio
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            maintainAspectRatio: !prev.maintainAspectRatio,
                          }))
                        }
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          settings.maintainAspectRatio
                            ? "bg-emerald-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                            settings.maintainAspectRatio
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Presets */}
              {uploadedImage && (
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    Social Presets
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {presetSizes.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPresetSize(preset)}
                        className="group text-left p-4 bg-gradient-to-r hover:from-gray-50 hover:to-white rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg transform hover:scale-105"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-gray-800">
                              {preset.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {preset.width} × {preset.height}
                            </div>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${preset.color} shadow-sm`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Output Settings */}
              {uploadedImage && (
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
                  <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                    Output Settings
                  </h3>

                  <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["png", "jpg", "webp"] as const).map((format) => (
                          <button
                            key={format}
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                outputFormat: format,
                              }))
                            }
                            className={`p-3 text-sm font-bold rounded-xl border-2 transition-all duration-300 ${
                              settings.outputFormat === format
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg scale-105"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quality Slider */}
                    {settings.outputFormat === "jpg" && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Quality: {settings.quality}%
                        </label>
                        <div className="relative">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={settings.quality}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                quality: parseInt(e.target.value),
                              }))
                            }
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Small</span>
                            <span>Best</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Crop Information */}
              {uploadedImage && imageDimensions && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-3">
                    <Eye className="h-6 w-6 text-blue-600" />
                    Crop Info
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">
                        Original:
                      </span>
                      <span className="font-black text-blue-900">
                        {imageDimensions.width} × {imageDimensions.height}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">
                        Crop Size:
                      </span>
                      <span className="font-black text-blue-900">
                        {Math.round(cropArea.width)} ×{" "}
                        {Math.round(cropArea.height)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">
                        Position:
                      </span>
                      <span className="font-black text-blue-900">
                        {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <span className="text-sm font-semibold text-blue-800">
                        Ratio:
                      </span>
                      <span className="font-black text-blue-900">
                        {(cropArea.width / cropArea.height).toFixed(2)}:1
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Keyboard Shortcuts */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6">
                <h4 className="text-lg font-black text-purple-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Shortcuts
                </h4>
                <div className="space-y-3 text-sm">
                  {[
                    { action: "Move crop", key: "Arrow keys" },
                    { action: "Resize crop", key: "Shift + Arrow" },
                    { action: "Reset crop", key: "R" },
                    { action: "Apply crop", key: "Enter" },
                    { action: "Toggle grid", key: "G" },
                    { action: "Zoom in/out", key: "+/-" },
                  ].map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-white/70 rounded-lg"
                    >
                      <span className="font-semibold text-purple-800">
                        {shortcut.action}:
                      </span>
                      <span className="font-mono bg-purple-100 text-purple-900 px-2 py-1 rounded text-xs font-bold">
                        {shortcut.key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};

export default ImageCrop;
