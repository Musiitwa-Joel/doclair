export interface ConversionSettings {
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
  stripMetadata?: boolean;
}

export interface ConversionOptions {
  filename: string;
  settings: ConversionSettings;
}

export interface ConversionResult {
  buffer: Buffer;
  conversionTime: number;
  originalSize: number;
  convertedSize: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface BatchConversionResult {
  originalFilename: string;
  convertedFilename: string;
  originalSize: number;
  convertedSize: number;
  conversionTime: number;
  buffer: Buffer; // Changed from string to Buffer for ZIP creation
  index: number;
}

export interface BatchConversionError {
  filename: string;
  error: string;
  index: number;
}

export interface BatchConversionResponse {
  success: boolean;
  totalFiles: number;
  successfulConversions: number;
  results: BatchConversionResult[];
  errors: BatchConversionError[];
}

export interface ServerStats {
  filesConvertedToday: number;
  averageConversionTime: string;
  successRate: string;
  userSatisfaction: number;
  totalFilesConverted: string;
  activeUsers: number;
}

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  service: string;
  version?: string;
  uptime?: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: any;
  timestamp?: string;
}

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  maxFileSize: number;
  maxFiles: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  conversionTimeout: number;
  tempDir: string;
  helmetConfig: {
    crossOriginResourcePolicy: { policy: string };
  };
}

// FIXED: Use Express.Multer.File instead of custom MulterFile
// This ensures compatibility with Express types
export interface ConversionRequest extends Express.Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
  body: {
    settings?: string;
  };
}

// Keep MulterFile as an alias for compatibility with existing code
export type MulterFile = Express.Multer.File;
