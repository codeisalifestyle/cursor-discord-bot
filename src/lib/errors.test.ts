import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCode,
  sanitizeError,
  createHttpError,
} from './errors';

describe('AppError', () => {
  it('should create an error with code and user message', () => {
    const error = new AppError(ErrorCode.NOT_FOUND, 'Item not found');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.userMessage).toBe('Item not found');
    expect(error.message).toBe('Item not found');
    expect(error.name).toBe('AppError');
  });

  it('should use internal message for Error.message when provided', () => {
    const error = new AppError(
      ErrorCode.API_ERROR,
      'Service unavailable',
      'Internal: Connection refused to api.cursor.com'
    );
    expect(error.userMessage).toBe('Service unavailable');
    expect(error.message).toBe('Internal: Connection refused to api.cursor.com');
  });

  it('should store statusCode when provided', () => {
    const error = new AppError(
      ErrorCode.RATE_LIMITED,
      'Rate limited',
      'Too many requests',
      429
    );
    expect(error.statusCode).toBe(429);
  });

  it('should have undefined statusCode when not provided', () => {
    const error = new AppError(ErrorCode.UNKNOWN, 'Unknown error');
    expect(error.statusCode).toBeUndefined();
  });
});

describe('sanitizeError', () => {
  it('should return userMessage for AppError', () => {
    const error = new AppError(ErrorCode.NOT_FOUND, 'Custom user message');
    expect(sanitizeError(error)).toBe('Custom user message');
  });

  it('should return validation messages as-is', () => {
    expect(sanitizeError(new Error('Invalid agent ID format'))).toBe(
      'Invalid agent ID format'
    );
    expect(sanitizeError(new Error('Agent ID is required'))).toBe(
      'Agent ID is required'
    );
  });

  it('should sanitize 404/not found errors', () => {
    expect(sanitizeError(new Error('404 Not Found'))).toBe(
      'Agent not found. Please verify the agent ID exists.'
    );
    expect(sanitizeError(new Error('Resource not found: abc123'))).toBe(
      'Agent not found. Please verify the agent ID exists.'
    );
  });

  it('should sanitize 401/unauthorized errors', () => {
    expect(sanitizeError(new Error('401 Unauthorized'))).toBe(
      'Authentication failed. Please verify your API credentials in Vercel.'
    );
  });

  it('should sanitize rate limit errors', () => {
    expect(sanitizeError(new Error('429 Rate limit exceeded'))).toBe(
      'Rate limited. Please wait before making more requests.'
    );
  });

  it('should sanitize timeout errors', () => {
    expect(sanitizeError(new Error('Request timed out'))).toBe(
      'Request timed out. The operation may still be processing.'
    );
  });

  it('should sanitize network errors', () => {
    expect(sanitizeError(new Error('Network error occurred'))).toBe(
      'Network error. Please check your connection and try again.'
    );
    expect(sanitizeError(new Error('fetch failed'))).toBe(
      'Network error. Please check your connection and try again.'
    );
  });

  it('should return generic message for unknown errors', () => {
    expect(sanitizeError(new Error('Some internal error xyz123'))).toBe(
      'An unexpected error occurred. Please try again or check the logs.'
    );
    expect(sanitizeError('string error')).toBe(
      'An unexpected error occurred. Please try again or check the logs.'
    );
    expect(sanitizeError(null)).toBe(
      'An unexpected error occurred. Please try again or check the logs.'
    );
  });
});

describe('createHttpError', () => {
  it('should create appropriate errors for known status codes', () => {
    const error400 = createHttpError(400);
    expect(error400.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error400.userMessage).toBe('Invalid request. Please check your input.');

    const error401 = createHttpError(401);
    expect(error401.code).toBe(ErrorCode.UNAUTHORIZED);

    const error404 = createHttpError(404);
    expect(error404.code).toBe(ErrorCode.NOT_FOUND);

    const error429 = createHttpError(429);
    expect(error429.code).toBe(ErrorCode.RATE_LIMITED);

    const error500 = createHttpError(500);
    expect(error500.code).toBe(ErrorCode.API_ERROR);
  });

  it('should create UNKNOWN error for unmapped status codes', () => {
    const error418 = createHttpError(418);
    expect(error418.code).toBe(ErrorCode.UNKNOWN);
    expect(error418.userMessage).toBe(
      'An error occurred while communicating with the service.'
    );
  });

  it('should include response message in internal error', () => {
    const error = createHttpError(500, 'Database connection failed');
    expect(error.message).toBe('Database connection failed');
    expect(error.userMessage).toBe(
      'The service is experiencing issues. Please try again later.'
    );
  });

  it('should include statusCode for known status codes', () => {
    expect(createHttpError(400).statusCode).toBe(400);
    expect(createHttpError(401).statusCode).toBe(401);
    expect(createHttpError(429).statusCode).toBe(429);
    expect(createHttpError(500).statusCode).toBe(500);
  });

  it('should include statusCode for unknown status codes', () => {
    expect(createHttpError(418).statusCode).toBe(418);
    expect(createHttpError(599).statusCode).toBe(599);
  });
});
