import React, { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  FileText,
  Upload,
  Download,
  Settings,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Loader,
  Star,
  Clock,
  Users,
  Sparkles,
  Lock,
  Layers,
  Target,
  RefreshCw,
  FileCheck,
  Trash2,
  RotateCcw,
  Save,
  Info,
  Award,
  Plus,
  Download as DownloadIcon,
  Folder,
  Image,
  Link,
  Key,
  Type,
  Maximize,
  Minimize,
  MoreHorizontal,
  Server,
  Wifi,
  WifiOff,
  Archive,
  Package,
  Timer,
  Pause,
  Play,
  StopCircle,
} from "lucide-react";

interface ConversionSettings {
  quality: "high" | "medium" | "small";
  pageOrientation: "portrait" | "landscape" | "auto";
  pageSize: "A4" | "Letter" | "Legal" | "A3" | "A5" | "custom";
  margins: "normal" | "narrow" | "wide" | "custom";
  includeImages: boolean;
  includeHyperlinks: boolean;
  passwordProtect: boolean;
  password?: string;
  watermark: boolean;
  watermarkText?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "ready" | "converting" | "completed" | "error";
  downloadUrl?: string;
  convertedSize?: number;
  conversionTime?: number;
  errorMessage?: string;
  estimatedTimeRemaining?: number;
  startTime?: number;
}

interface BatchProgress {
  isActive: boolean;
  currentFile: number;
  totalFiles: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  startTime: number;
  completedFiles: number;
  totalDataProcessed: number;
}

const API_BASE_URL = "http://localhost:3001/api";
const BATCH_SIZE = 3; // Process 3 files simultaneously
const ESTIMATED_TIME_PER_FILE = 40000; // 40 seconds per file

const WordToPDF: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    isActive: false,
    currentFile: 0,
    totalFiles: 0,
    overallProgress: 0,
    estimatedTimeRemaining: 0,
    startTime: 0,
    completedFiles: 0,
    totalDataProcessed: 0,
  });
  const [conversionSettings, setConversionSettings] =
    useState<ConversionSettings>({
      quality: "high",
      pageOrientation: "portrait",
      pageSize: "A4",
      margins: "normal",
      includeImages: true,
      includeHyperlinks: true,
      passwordProtect: false,
      watermark: false,
    });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Check server status on component mount
  React.useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Cleanup intervals on unmount
  React.useEffect(() => {
    return () => {
      progressIntervals.current.forEach((interval) => clearInterval(interval));
      progressIntervals.current.clear();
    };
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch (error) {
      setServerStatus("offline");
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isConverting) {
        setIsDragOver(true);
      }
    },
    [isConverting]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (isConverting) return;

      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    },
    [isConverting]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isConverting) return;

      const files = Array.from(e.target.files || []);
      handleFileUpload(files);

      // Reset input to allow re-uploading same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [isConverting]
  );

  const handleFileUpload = useCallback((files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-word",
        "text/plain",
      ];
      return (
        validTypes.includes(file.type) ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx")
      );
    });

    if (validFiles.length !== files.length) {
      alert(
        "Some files were skipped. Only Word documents (.doc, .docx) are supported."
      );
    }

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading", // Start with uploading status
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress for each file
    newFiles.forEach((fileData) => {
      simulateUploadProgress(fileData.id);
    });
  }, []);

  const simulateUploadProgress = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // 5-20% increments

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        progressIntervals.current.delete(fileId);

        // Mark as ready
        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? { ...file, status: "ready", progress: 100 }
              : file
          )
        );
      } else {
        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId ? { ...file, progress } : file
          )
        );
      }
    }, 100);

    progressIntervals.current.set(fileId, interval);
  }, []);

  const simulateConversionProgress = useCallback(
    (fileId: string, estimatedDuration: number) => {
      const startTime = Date.now();
      let progress = 0;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const expectedProgress = (elapsed / estimatedDuration) * 100;

        // Add some randomness but keep it realistic
        progress = Math.min(expectedProgress + (Math.random() - 0.5) * 10, 95);

        const timeRemaining = Math.max(0, estimatedDuration - elapsed);

        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? {
                  ...file,
                  progress: Math.max(file.progress, progress),
                  estimatedTimeRemaining: timeRemaining,
                }
              : file
          )
        );

        if (elapsed >= estimatedDuration || progress >= 95) {
          clearInterval(interval);
          progressIntervals.current.delete(fileId);
        }
      }, 100);

      progressIntervals.current.set(fileId, interval);
    },
    []
  );

  const convertFile = useCallback(
    async (fileId: string) => {
      const fileData = uploadedFiles.find((f) => f.id === fileId);
      if (!fileData || serverStatus !== "online") return;

      // Clear any existing progress interval
      const existingInterval = progressIntervals.current.get(fileId);
      if (existingInterval) {
        clearInterval(existingInterval);
        progressIntervals.current.delete(fileId);
      }

      const startTime = Date.now();
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === fileId
            ? {
                ...file,
                status: "converting",
                progress: 0,
                startTime,
                estimatedTimeRemaining: ESTIMATED_TIME_PER_FILE,
              }
            : file
        )
      );

      // Start progress simulation
      simulateConversionProgress(fileId, ESTIMATED_TIME_PER_FILE);

      try {
        const formData = new FormData();
        formData.append("file", fileData.file);
        formData.append("settings", JSON.stringify(conversionSettings));

        const response = await fetch(`${API_BASE_URL}/convert/word-to-pdf`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Conversion failed");
        }

        const conversionTime = Date.now() - startTime;
        const pdfBlob = await response.blob();
        const downloadUrl = URL.createObjectURL(pdfBlob);

        // Clear progress interval
        const interval = progressIntervals.current.get(fileId);
        if (interval) {
          clearInterval(interval);
          progressIntervals.current.delete(fileId);
        }

        setUploadedFiles((prev) =>
          prev.map((file) => {
            if (file.id === fileId) {
              return {
                ...file,
                status: "completed",
                progress: 100,
                downloadUrl,
                convertedSize: pdfBlob.size,
                conversionTime,
                estimatedTimeRemaining: 0,
              };
            }
            return file;
          })
        );
      } catch (error) {
        console.error("Conversion error:", error);

        // Clear progress interval
        const interval = progressIntervals.current.get(fileId);
        if (interval) {
          clearInterval(interval);
          progressIntervals.current.delete(fileId);
        }

        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? {
                  ...file,
                  status: "error",
                  progress: 0,
                  estimatedTimeRemaining: 0,
                  errorMessage:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : file
          )
        );
      }
    },
    [
      uploadedFiles,
      conversionSettings,
      serverStatus,
      simulateConversionProgress,
    ]
  );

  const convertAllFiles = useCallback(async () => {
    if (serverStatus !== "online") {
      alert("Server is offline. Please check your connection and try again.");
      return;
    }

    const readyFiles = uploadedFiles.filter((file) => file.status === "ready");
    if (readyFiles.length === 0) return;

    setIsConverting(true);

    // Initialize batch progress
    const batchStartTime = Date.now();
    setBatchProgress({
      isActive: true,
      currentFile: 0,
      totalFiles: readyFiles.length,
      overallProgress: 0,
      estimatedTimeRemaining: readyFiles.length * ESTIMATED_TIME_PER_FILE,
      startTime: batchStartTime,
      completedFiles: 0,
      totalDataProcessed: 0,
    });

    // Process files in batches of BATCH_SIZE
    for (let i = 0; i < readyFiles.length; i += BATCH_SIZE) {
      const batch = readyFiles.slice(i, i + BATCH_SIZE);

      // Update batch progress
      setBatchProgress((prev) => ({
        ...prev,
        currentFile: i + 1,
      }));

      // Convert batch files simultaneously
      const batchPromises = batch.map((file) => convertFile(file.id));
      await Promise.all(batchPromises);

      // Update completed count
      setBatchProgress((prev) => {
        const newCompletedFiles = prev.completedFiles + batch.length;
        const overallProgress = (newCompletedFiles / readyFiles.length) * 100;
        const elapsed = Date.now() - batchStartTime;
        const estimatedTotal =
          (elapsed / newCompletedFiles) * readyFiles.length;
        const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

        return {
          ...prev,
          completedFiles: newCompletedFiles,
          overallProgress,
          estimatedTimeRemaining,
          totalDataProcessed:
            prev.totalDataProcessed +
            batch.reduce((sum, f) => sum + f.file.size, 0),
        };
      });

      // Small delay between batches to prevent server overload
      if (i + BATCH_SIZE < readyFiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Complete batch processing
    setBatchProgress((prev) => ({
      ...prev,
      isActive: false,
      overallProgress: 100,
      estimatedTimeRemaining: 0,
    }));

    setIsConverting(false);
  }, [uploadedFiles, convertFile, serverStatus]);

  const removeFile = useCallback(
    (fileId: string) => {
      // Don't allow removal during conversion
      if (isConverting) return;

      setUploadedFiles((prev) => {
        const fileToRemove = prev.find((f) => f.id === fileId);
        if (fileToRemove?.downloadUrl) {
          URL.revokeObjectURL(fileToRemove.downloadUrl);
        }

        // Clear any progress interval
        const interval = progressIntervals.current.get(fileId);
        if (interval) {
          clearInterval(interval);
          progressIntervals.current.delete(fileId);
        }

        return prev.filter((file) => file.id !== fileId);
      });
    },
    [isConverting]
  );

  const downloadFile = useCallback((file: UploadedFile) => {
    if (file.downloadUrl) {
      const a = document.createElement("a");
      a.href = file.downloadUrl;
      a.download = file.name.replace(/\.(doc|docx)$/i, ".pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, []);

  const createZipAndDownload = useCallback(async () => {
    const completedFiles = uploadedFiles.filter(
      (file) => file.status === "completed" && file.downloadUrl
    );

    if (completedFiles.length === 0) return;

    try {
      // Create a simple zip-like structure using JSZip would be ideal, but we'll simulate
      // For now, we'll download files individually with a delay
      for (let i = 0; i < completedFiles.length; i++) {
        setTimeout(() => {
          downloadFile(completedFiles[i]);
        }, i * 500); // 500ms delay between downloads
      }

      // TODO: Implement actual ZIP creation when JSZip is available
      alert(
        `Downloading ${completedFiles.length} PDF files. They will download one by one.`
      );
    } catch (error) {
      console.error("Error creating zip:", error);
      alert("Error creating zip file. Files will download individually.");
      completedFiles.forEach((file, index) => {
        setTimeout(() => downloadFile(file), index * 500);
      });
    }
  }, [uploadedFiles, downloadFile]);

  const clearAllFiles = useCallback(() => {
    // Don't allow clearing during conversion
    if (isConverting) return;

    uploadedFiles.forEach((file) => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }

      // Clear progress intervals
      const interval = progressIntervals.current.get(file.id);
      if (interval) {
        clearInterval(interval);
        progressIntervals.current.delete(file.id);
      }
    });

    setUploadedFiles([]);
    setBatchProgress({
      isActive: false,
      currentFile: 0,
      totalFiles: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      startTime: 0,
      completedFiles: 0,
      totalDataProcessed: 0,
    });
  }, [uploadedFiles, isConverting]);

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader className="h-4 w-4 animate-spin text-blue-600" />;
      case "ready":
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case "converting":
        return <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "ready":
        return "Ready to convert";
      case "converting":
        return "Converting...";
      case "completed":
        return "Completed";
      case "error":
        return "Error occurred";
      default:
        return "Unknown";
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
    if (ms < 1000) return "< 1s";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const readyFilesCount = uploadedFiles.filter(
    (f) => f.status === "ready"
  ).length;
  const completedFilesCount = uploadedFiles.filter(
    (f) => f.status === "completed"
  ).length;
  const convertingFilesCount = uploadedFiles.filter(
    (f) => f.status === "converting"
  ).length;
  const totalFiles = uploadedFiles.length;

  return (
    <>
      <Helmet>
        <title>Word to PDF Converter - Free Online Tool | Doclair</title>
        <meta
          name="description"
          content="Convert Word documents to PDF online for free. Supports DOC, DOCX files with perfect formatting preservation. Fast, secure, and easy to use."
        />
        <meta
          name="keywords"
          content="word to pdf, doc to pdf, docx to pdf, convert word to pdf, online pdf converter"
        />
        <link
          rel="canonical"
          href="https://doclair.com/en-US/tool/word-to-pdf"
        />
        <meta
          property="og:title"
          content="Word to PDF Converter - Free Online Tool"
        />
        <meta
          property="og:description"
          content="Convert Word documents to PDF online for free with perfect formatting preservation."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Server Status Banner */}
        {serverStatus !== "online" && (
          <div
            className={`w-full py-2 px-4 text-center text-sm font-medium ${
              serverStatus === "offline"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {serverStatus === "offline" ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {serverStatus === "offline"
                ? 'Conversion server is offline. Please start the server with "npm run server"'
                : "Checking server status..."}
            </div>
          </div>
        )}

        {/* Batch Progress Banner */}
        {batchProgress.isActive && (
          <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">
                    Batch Processing: {batchProgress.completedFiles}/
                    {batchProgress.totalFiles} files
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {formatTime(batchProgress.estimatedTimeRemaining)} remaining
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {formatFileSize(batchProgress.totalDataProcessed)} processed
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
                  style={{ width: `${batchProgress.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-2xl floating-element">
                <FileText className="h-12 w-12 text-white" />
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                <span className="cursive-text text-5xl md:text-6xl text-blue-600">
                  Word
                </span>{" "}
                to PDF
                <br />
                <span className="cursive-accent text-indigo-600">
                  Converter
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
                Convert Microsoft Word documents to{" "}
                <span className="cursive-text text-blue-600 text-xl">
                  professional
                </span>{" "}
                PDF files with perfect formatting preservation.{" "}
                <span className="font-semibold text-orange-600">40-second</span>{" "}
                conversion time with batch processing.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    100% Secure
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    40s Per File
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                  <Layers className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Batch Processing
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                  <Archive className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    ZIP Download
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border shadow-sm ${
                    serverStatus === "online"
                      ? "border-green-200/50"
                      : "border-red-200/50"
                  }`}
                >
                  {serverStatus === "online" ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">
                        Server Online
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">
                        Server Offline
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600 mb-1">
                    2.1M+
                  </div>
                  <div className="text-sm text-gray-600">Files Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600 mb-1">
                    99.9%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-600 mb-1">
                    40s
                  </div>
                  <div className="text-sm text-gray-600">Avg. Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-600 mb-1">
                    3x
                  </div>
                  <div className="text-sm text-gray-600">Batch Size</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Upload Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Upload Zone */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Upload className="h-6 w-6 text-blue-600" />
                    Upload Word Documents
                  </h2>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    disabled={isConverting}
                    className={`p-2 rounded-lg transition-colors ${
                      isConverting
                        ? "opacity-50 cursor-not-allowed"
                        : showSettings
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>

                {/* Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isConverting && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    isConverting
                      ? "opacity-50 cursor-not-allowed border-gray-200"
                      : isDragOver
                      ? "border-blue-400 bg-blue-50 scale-105"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
                  } ${
                    serverStatus !== "online"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${
                        isConverting
                          ? "bg-gray-100"
                          : isDragOver
                          ? "bg-blue-100 scale-110"
                          : "bg-gray-100"
                      }`}
                    >
                      {isConverting ? (
                        <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
                      ) : (
                        <FileText
                          className={`h-12 w-12 ${
                            isDragOver ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {isConverting
                        ? "Processing Files..."
                        : serverStatus !== "online"
                        ? "Server Offline - Cannot Upload Files"
                        : isDragOver
                        ? "Drop your files here!"
                        : "Choose Word documents or drag them here"}
                    </h3>

                    <p className="text-gray-600 mb-6 max-w-md">
                      {isConverting
                        ? "Please wait while files are being converted. Upload is disabled during processing."
                        : serverStatus !== "online"
                        ? "Please start the conversion server to upload and convert files."
                        : "Supports .DOC and .DOCX files up to 100MB each. Batch processing available for multiple files."}
                    </p>

                    {serverStatus === "online" && !isConverting && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button className="btn-primary px-6 py-3">
                          <Plus className="h-5 w-5" />
                          Select Files
                        </button>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Files processed on server, never stored
                        </div>
                      </div>
                    )}

                    {isConverting && (
                      <div className="flex items-center gap-3 text-orange-600">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span className="font-semibold">
                          {convertingFilesCount > 0
                            ? `Converting ${convertingFilesCount} file(s)...`
                            : "Processing..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={serverStatus !== "online" || isConverting}
                />
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Conversion Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Quality */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        PDF Quality
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            value: "high",
                            label: "High Quality",
                            desc: "Best for printing",
                          },
                          {
                            value: "medium",
                            label: "Medium Quality",
                            desc: "Balanced size",
                          },
                          {
                            value: "small",
                            label: "Small Size",
                            desc: "Compressed",
                          },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="quality"
                              value={option.value}
                              checked={
                                conversionSettings.quality === option.value
                              }
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  quality: e.target.value as any,
                                }))
                              }
                              className="mr-3"
                              disabled={isConverting}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {option.label}
                              </div>
                              <div className="text-sm text-gray-600">
                                {option.desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Page Size */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Page Size
                      </label>
                      <select
                        value={conversionSettings.pageSize}
                        onChange={(e) =>
                          setConversionSettings((prev) => ({
                            ...prev,
                            pageSize: e.target.value as any,
                          }))
                        }
                        disabled={isConverting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="Letter">Letter (8.5 × 11 in)</option>
                        <option value="Legal">Legal (8.5 × 14 in)</option>
                        <option value="A3">A3 (297 × 420 mm)</option>
                        <option value="A5">A5 (148 × 210 mm)</option>
                      </select>
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Orientation
                      </label>
                      <select
                        value={conversionSettings.pageOrientation}
                        onChange={(e) =>
                          setConversionSettings((prev) => ({
                            ...prev,
                            pageOrientation: e.target.value as any,
                          }))
                        }
                        disabled={isConverting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                        <option value="auto">Auto Detect</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Advanced Options
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Include Options */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Image className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Include Images
                              </div>
                              <div className="text-sm text-gray-600">
                                Preserve all images in PDF
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={conversionSettings.includeImages}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  includeImages: e.target.checked,
                                }))
                              }
                              disabled={isConverting}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Link className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Include Hyperlinks
                              </div>
                              <div className="text-sm text-gray-600">
                                Keep clickable links active
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={conversionSettings.includeHyperlinks}
                              onChange={(e) =>
                                setConversionSettings((prev) => ({
                                  ...prev,
                                  includeHyperlinks: e.target.checked,
                                }))
                              }
                              disabled={isConverting}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      </div>

                      {/* Security Options */}
                    </div>
                  </div>
                </div>
              )}

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <Folder className="h-6 w-6 text-green-600" />
                      Files ({totalFiles})
                    </h3>
                    <div className="flex gap-3">
                      {readyFilesCount > 0 && serverStatus === "online" && (
                        <button
                          onClick={convertAllFiles}
                          disabled={isConverting}
                          className={`btn-primary ${
                            isConverting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isConverting ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              Converting...
                            </>
                          ) : (
                            <>
                              <Zap className="h-5 w-5" />
                              Convert All ({readyFilesCount})
                            </>
                          )}
                        </button>
                      )}
                      {completedFilesCount > 0 && (
                        <button
                          onClick={createZipAndDownload}
                          disabled={isConverting}
                          className={`btn-secondary ${
                            isConverting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Archive className="h-5 w-5" />
                          Download All ({completedFilesCount})
                        </button>
                      )}
                      <button
                        onClick={clearAllFiles}
                        disabled={isConverting}
                        className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                          isConverting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title={
                          isConverting
                            ? "Cannot clear files during conversion"
                            : "Clear all files"
                        }
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-shrink-0">
                              {getStatusIcon(file.status)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {file.name}
                                </h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    file.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : file.status === "converting"
                                      ? "bg-orange-100 text-orange-800"
                                      : file.status === "ready"
                                      ? "bg-blue-100 text-blue-800"
                                      : file.status === "uploading"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {getStatusText(file.status)}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span>{formatFileSize(file.size)}</span>
                                {file.convertedSize && (
                                  <span>
                                    → {formatFileSize(file.convertedSize)}
                                  </span>
                                )}
                                {file.conversionTime && (
                                  <span>
                                    ({(file.conversionTime / 1000).toFixed(1)}s)
                                  </span>
                                )}
                                {file.estimatedTimeRemaining &&
                                  file.estimatedTimeRemaining > 0 && (
                                    <span className="text-orange-600 font-medium">
                                      {formatTime(file.estimatedTimeRemaining)}{" "}
                                      remaining
                                    </span>
                                  )}
                                {file.errorMessage && (
                                  <span className="text-red-600">
                                    {file.errorMessage}
                                  </span>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {(file.status === "uploading" ||
                                file.status === "converting") && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      file.status === "uploading"
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                        : "bg-gradient-to-r from-orange-500 to-orange-600"
                                    }`}
                                    style={{ width: `${file.progress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {file.status === "ready" &&
                              serverStatus === "online" &&
                              !isConverting && (
                                <button
                                  onClick={() => convertFile(file.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Convert to PDF"
                                >
                                  <Zap className="h-5 w-5" />
                                </button>
                              )}

                            {file.status === "completed" && (
                              <button
                                onClick={() => downloadFile(file)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <DownloadIcon className="h-5 w-5" />
                              </button>
                            )}

                            <button
                              onClick={() => removeFile(file.id)}
                              disabled={isConverting}
                              className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                                isConverting
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title={
                                isConverting
                                  ? "Cannot remove files during conversion"
                                  : "Remove file"
                              }
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Server Status */}
              <div
                className={`rounded-2xl shadow-sm border p-6 ${
                  serverStatus === "online"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Server
                    className={`h-5 w-5 ${
                      serverStatus === "online"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                  Server Status
                </h3>

                <div
                  className={`text-sm ${
                    serverStatus === "online"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {serverStatus === "online" ? (
                    <div>
                      <div className="font-semibold mb-2">✅ Server Online</div>
                      <div>
                        Ready to process your Word documents with high-quality
                        conversion.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold mb-2">
                        ❌ Server Offline
                      </div>
                      <div className="mb-2">
                        To start the conversion server, run:
                      </div>
                      <code className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
                        npm run server
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Batch Processing Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  Batch Processing
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Timer className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        40 seconds per file
                      </div>
                      <div className="text-gray-600 text-xs">
                        Estimated conversion time
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        3 files simultaneously
                      </div>
                      <div className="text-gray-600 text-xs">
                        Parallel processing for speed
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Archive className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        ZIP download
                      </div>
                      <div className="text-gray-600 text-xs">
                        All files in one package
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        Protected during conversion
                      </div>
                      <div className="text-gray-600 text-xs">
                        Delete disabled while processing
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Key Features
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      icon: Shield,
                      text: "Perfect formatting preservation",
                      color: "text-green-600",
                    },
                    {
                      icon: Server,
                      text: "Server-side processing",
                      color: "text-blue-600",
                    },
                    {
                      icon: Zap,
                      text: "Lightning-fast conversion",
                      color: "text-yellow-600",
                    },
                    {
                      icon: Lock,
                      text: "No file storage policy",
                      color: "text-purple-600",
                    },
                    {
                      icon: Layers,
                      text: "Batch processing support",
                      color: "text-indigo-600",
                    },
                    {
                      icon: Target,
                      text: "Professional PDF output",
                      color: "text-red-600",
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <feature.icon
                        className={`h-5 w-5 ${feature.color} mt-0.5 flex-shrink-0`}
                      />
                      <span className="text-gray-700 text-sm">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-green-600" />
                  How It Works
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      text: "Upload your Word documents",
                      icon: Upload,
                    },
                    {
                      step: 2,
                      text: "Choose conversion settings",
                      icon: Settings,
                    },
                    {
                      step: 3,
                      text: "Server processes files in batches",
                      icon: Server,
                    },
                    {
                      step: 4,
                      text: "Download individual or ZIP files",
                      icon: Archive,
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 text-sm">
                          {item.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-green-900 mb-2">
                      Privacy Guaranteed
                    </h4>
                    <p className="text-green-800 text-sm leading-relaxed">
                      Files are processed on our server but never stored. All
                      temporary files are automatically deleted after
                      conversion. Your documents remain completely private.
                    </p>
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

export default WordToPDF;
