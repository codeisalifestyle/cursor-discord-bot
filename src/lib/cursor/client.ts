import { getConfig, CURSOR_API_BASE_URL } from '../config';
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

class CursorApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CURSOR_API_BASE_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const config = getConfig();
    const url = `${this.baseUrl}${path}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.CURSOR_API_TOKEN}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as CursorApiError;
        throw new Error(
          errorData.message || errorData.error || `Cursor API error: ${response.status}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Cursor API request failed: ${error.message}`);
      }
      throw new Error('Cursor API request failed with unknown error');
    }
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
    return this.request<Agent>('GET', `/v0/agents/${id}`);
  }

  async getAgentConversation(id: string): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('GET', `/v0/agents/${id}/conversation`);
  }

  async launchAgent(payload: LaunchAgentPayload): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', '/v0/agents', payload);
  }

  async followUpAgent(id: string, payload: FollowUpPayload): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/v0/agents/${id}/followup`, payload);
  }

  async stopAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/v0/agents/${id}/stop`);
  }

  async deleteAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('DELETE', `/v0/agents/${id}`);
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

