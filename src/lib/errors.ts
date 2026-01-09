// Error handling and sanitization utilities

/**
 * Known error types that are safe to show to users
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Application error with sanitized message
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly statusCode?: number;

  constructor(code: ErrorCode, userMessage: string, internalMessage?: string, statusCode?: number) {
    super(internalMessage || userMessage);
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Maps HTTP status codes to error codes and user-friendly messages
 */
const HTTP_ERROR_MAP: Record<number, { code: ErrorCode; message: string }> = {
  400: { code: ErrorCode.VALIDATION_ERROR, message: 'Invalid request. Please check your input.' },
  401: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication failed. Please check your API credentials.' },
  403: { code: ErrorCode.UNAUTHORIZED, message: 'Access denied. You may not have permission for this action.' },
  404: { code: ErrorCode.NOT_FOUND, message: 'Resource not found. The agent may have been deleted.' },
  429: { code: ErrorCode.RATE_LIMITED, message: 'Rate limited. Please wait a moment and try again.' },
  500: { code: ErrorCode.API_ERROR, message: 'The service is experiencing issues. Please try again later.' },
  502: { code: ErrorCode.API_ERROR, message: 'The service is temporarily unavailable. Please try again.' },
  503: { code: ErrorCode.API_ERROR, message: 'The service is under maintenance. Please try again later.' },
};

/**
 * Sanitizes an error for safe display to users
 * @param error - The error to sanitize
 * @returns A user-safe error message
 */
export function sanitizeError(error: unknown): string {
  // If it's our custom error, use the user message
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for common error patterns and return safe messages
    if (message.includes('invalid agent id') || message.includes('agent id is required')) {
      return error.message; // These are our validation messages, safe to show
    }

    if (message.includes('not found') || message.includes('404')) {
      return 'Agent not found. Please verify the agent ID exists.';
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication failed. Please verify your API credentials in Vercel.';
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return 'Rate limited. Please wait before making more requests.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Request timed out. The operation may still be processing.';
    }

    if (message.includes('network') || message.includes('fetch failed')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Check if it's a validation error (starts with known patterns)
    if (
      message.startsWith('prompt') ||
      message.startsWith('repository') ||
      message.startsWith('missing')
    ) {
      return error.message;
    }
  }

  // Default safe message for unknown errors
  return 'An unexpected error occurred. Please try again or check the logs.';
}

/**
 * Creates an appropriate error from an HTTP response
 * @param status - HTTP status code
 * @param responseMessage - Optional message from the response
 */
export function createHttpError(status: number, responseMessage?: string): AppError {
  const mapped = HTTP_ERROR_MAP[status];

  if (mapped) {
    return new AppError(mapped.code, mapped.message, responseMessage, status);
  }

  return new AppError(
    ErrorCode.UNKNOWN,
    'An error occurred while communicating with the service.',
    responseMessage || `HTTP ${status}`,
    status
  );
}
