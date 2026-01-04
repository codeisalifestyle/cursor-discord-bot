// Cursor Cloud Agents API Types

export interface Agent {
  id: string;
  name: string;
  status: 'RUNNING' | 'FINISHED' | 'STOPPED' | 'FAILED';
  source: {
    repository: string;
    ref?: string;
  };
  target: {
    branchName?: string;
    url: string;
    prUrl?: string;
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };
  summary?: string;
  createdAt: string;
}

export interface AgentListResponse {
  agents: Agent[];
  nextCursor?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user_message' | 'assistant_message';
  text: string;
}

export interface ConversationResponse {
  id: string;
  messages: ConversationMessage[];
}

export interface LaunchAgentPayload {
  prompt: {
    text: string;
    images?: Array<{
      data: string; // base64
      dimension: {
        width: number;
        height: number;
      };
    }>;
  };
  model?: string;
  source: {
    repository: string;
    ref?: string;
  };
  target?: {
    branchName?: string;
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };
  webhook?: {
    url: string;
    secret?: string;
  };
}

export interface FollowUpPayload {
  prompt: {
    text: string;
    images?: Array<{
      data: string;
      dimension: {
        width: number;
        height: number;
      };
    }>;
  };
}

export interface ModelsResponse {
  models: string[];
}

export interface Repository {
  owner: string;
  name: string;
  repository: string;
}

export interface RepositoriesResponse {
  repositories: Repository[];
}

export interface ApiKeyInfo {
  apiKeyName: string;
  createdAt: string;
  userEmail: string;
}

export interface CursorApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

