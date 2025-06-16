import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { logger } from '../utils/logger.js';
import { ApiError } from '../types/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError | MulterError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof MulterError) {
    statusCode = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        code = 'FILE_TOO_LARGE';
        message = 'File too large. Maximum size is 100MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        code = 'TOO_MANY_FILES';
        message = 'Too many files. Maximum is 10 files at once.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        code = 'UNEXPECTED_FILE';
        message = 'Unexpected file field.';
        break;
      default:
        code = 'UPLOAD_ERROR';
        message = 'File upload error.';
    }
  } else if (error.message.includes('timeout')) {
    statusCode = 408;
    code = 'TIMEOUT';
    message = 'Request timeout - operation took too long';
  } else if (error.message.includes('ENOENT')) {
    statusCode = 404;
    code = 'FILE_NOT_FOUND';
    message = 'Required file or resource not found';
  } else if (error.message.includes('EACCES')) {
    statusCode = 403;
    code = 'PERMISSION_DENIED';
    message = 'Permission denied - insufficient access rights';
  }

  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  const errorResponse: ApiError = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      stack: error.stack,
      originalMessage: error.message,
    };
  }

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiError = {
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
};