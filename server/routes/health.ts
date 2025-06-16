import { Router } from "express";
import { HealthCheckResponse, ServerStats } from "../types/index";
import { asyncHandler } from "../middleware/errorHandler";
import convertService from "../services/convertService";

const router = Router();

// Health check endpoint
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const response: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "doclair-converter",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
    };

    res.json(response);
  })
);

// LibreOffice status endpoint
router.get(
  "/libreoffice",
  asyncHandler(async (req, res) => {
    const libreOfficeStatus = convertService.getLibreOfficeStatus();

    const response = {
      service: "LibreOffice Converter",
      timestamp: new Date().toISOString(),
      libreoffice: {
        installed: libreOfficeStatus.isInstalled,
        version: libreOfficeStatus.version || null,
        path: libreOfficeStatus.path || null,
        error: libreOfficeStatus.error || null,
      },
      status: libreOfficeStatus.isInstalled ? "ready" : "unavailable",
      installInstructions: libreOfficeStatus.isInstalled
        ? null
        : {
            ubuntu: "sudo apt-get update && sudo apt-get install libreoffice",
            debian: "sudo apt-get update && sudo apt-get install libreoffice",
            centos: "sudo yum install libreoffice",
            rhel: "sudo yum install libreoffice",
            fedora: "sudo dnf install libreoffice",
            macos: "brew install --cask libreoffice",
            windows: "Download from https://www.libreoffice.org/download/",
            manual:
              "Visit https://www.libreoffice.org/download/ for manual installation",
          },
    };

    // Set appropriate HTTP status
    const httpStatus = libreOfficeStatus.isInstalled ? 200 : 503;
    res.status(httpStatus).json(response);
  })
);

// Get conversion statistics
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    // In a real application, these would come from a database
    const stats: ServerStats = {
      filesConvertedToday: Math.floor(Math.random() * 5000) + 10000,
      averageConversionTime: "23 seconds",
      successRate: "99.9%",
      userSatisfaction: 4.9,
      totalFilesConverted: "2.1M+",
      activeUsers: Math.floor(Math.random() * 1000) + 500,
    };

    res.json(stats);
  })
);

export default router;
