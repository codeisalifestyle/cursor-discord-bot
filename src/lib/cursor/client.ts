import { getConfig, CURSOR_API_BASE_URL } from '../config';
import { createHttpError, AppError, ErrorCode } from '../errors';
import type {
  Agent,
  AgentListResponse,
  ConversationResponse,
  LaunchAgentPayload,
  FollowUpPayload,
  ModelsResponse,
  RepositoriesResponse,
  ApiKeyInfo,
  CursorApiError,
} from './types';

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

class CursorApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CURSOR_API_BASE_URL;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   * Formula: min(maxDelay, baseDelay * 2^attempt) + random jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS);
    // Add jitter (0-25% of the delay) to prevent thundering herd
    const jitter = Math.random() * cappedDelay * 0.25;
    return cappedDelay + jitter;
  }

  /**
   * Determine if an error is retryable
   * Retries on: 429 (rate limit), 5xx (server errors), network errors
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof AppError) {
      const status = error.statusCode;
      // Retry on rate limit (429) or server errors (5xx)
      return status === 429 || (status >= 500 && status < 600);
    }
    // Retry on network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    return false;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const config = getConfig();
    const url = `${this.baseUrl}${path}`;

    // Cursor API uses Basic Authentication with API key as username and empty password
    const basicAuthCredentials = Buffer.from(`${config.CURSOR_API_TOKEN}:`).toString('base64');

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${basicAuthCredentials}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as CursorApiError;
          // Log sanitized error for debugging (avoid logging sensitive response data)
          console.error('Cursor API error:', {
            status: response.status,
            statusCode: errorData.statusCode,
            path,
            attempt: attempt + 1,
          });
          throw createHttpError(response.status, errorData.message || errorData.error);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Convert non-AppError errors to AppError for consistent handling
        if (!(error instanceof AppError)) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            lastError = new AppError(
              ErrorCode.API_ERROR,
              'Unable to connect to Cursor API. Please try again.',
              error.message
            );
          } else {
            lastError = new AppError(
              ErrorCode.UNKNOWN,
              'An unexpected error occurred while communicating with Cursor.',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        }

        // Check if we should retry
        const shouldRetry = attempt < MAX_RETRIES && this.isRetryableError(error);

        if (shouldRetry) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`Cursor API request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(delay)}ms...`, {
            path,
            error: lastError.message,
          });
          await this.sleep(delay);
        } else {
          // No more retries, throw the error
          throw lastError;
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError ?? new AppError(ErrorCode.UNKNOWN, 'Request failed after all retries');
  }

  async listAgents(limit?: number, cursor?: string): Promise<AgentListResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const query = params.toString();
    const path = `/v0/agents${query ? `?${query}` : ''}`;
    
    return this.request<AgentListResponse>('GET', path);
  }

  async getAgentStatus(id: string): Promise<Agent> {
    return this.request<Agent>('GET', `/v0/agents/${encodeURIComponent(id)}`);
  }

  async getAgentConversation(id: string): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('GET', `/v0/agents/${encodeURIComponent(id)}/conversation`);
  }

  async launchAgent(payload: LaunchAgentPayload): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', '/v0/agents', payload);
  }

  async followUpAgent(id: string, payload: FollowUpPayload): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/v0/agents/${encodeURIComponent(id)}/followup`, payload);
  }

  async stopAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/v0/agents/${encodeURIComponent(id)}/stop`);
  }

  async deleteAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('DELETE', `/v0/agents/${encodeURIComponent(id)}`);
  }

  async listModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>('GET', '/v0/models');
  }

  async listRepositories(): Promise<RepositoriesResponse> {
    return this.request<RepositoriesResponse>('GET', '/v0/repositories');
  }

  async getApiKeyInfo(): Promise<ApiKeyInfo> {
    return this.request<ApiKeyInfo>('GET', '/v0/me');
  }
}

export const cursorApi = new CursorApiClient();

