import { describe, it, expect } from 'vitest';
import {
  formatAgentList,
  formatAgentStatus,
  formatConversation,
  formatModels,
  formatRepositories,
  formatApiKeyInfo,
  formatError,
  formatSuccess,
} from './responses';
import type { Agent, ConversationMessage, Repository } from '../cursor/types';

describe('formatAgentList', () => {
  it('should return empty message when no agents', () => {
    expect(formatAgentList([])).toBe('📋 No agents found.');
  });

  it('should format a list of agents', () => {
    const agents: Agent[] = [
      {
        id: 'bc_abc123',
        name: 'Test Agent',
        status: 'RUNNING',
        source: { repository: 'https://github.com/owner/repo' },
        target: { url: 'https://cursor.com/agent/bc_abc123' },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'bc_def456',
        name: 'Another Agent',
        status: 'FINISHED',
        source: { repository: 'https://github.com/owner/other' },
        target: { url: 'https://cursor.com/agent/bc_def456' },
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    const result = formatAgentList(agents);
    expect(result).toContain('📋 **Your Agents** (2)');
    expect(result).toContain('🔄 **Test Agent**');
    expect(result).toContain('✅ **Another Agent**');
    expect(result).toContain('bc_abc123');
    expect(result).toContain('bc_def456');
  });

  it('should use correct emoji for each status', () => {
    const makeAgent = (status: Agent['status']): Agent => ({
      id: 'bc_test',
      name: 'Test',
      status,
      source: { repository: 'repo' },
      target: { url: 'url' },
      createdAt: '2024-01-01T00:00:00Z',
    });

    expect(formatAgentList([makeAgent('RUNNING')])).toContain('🔄');
    expect(formatAgentList([makeAgent('FINISHED')])).toContain('✅');
    expect(formatAgentList([makeAgent('STOPPED')])).toContain('⏸️');
    expect(formatAgentList([makeAgent('FAILED')])).toContain('❌');
  });
});

describe('formatAgentStatus', () => {
  it('should return an embed with agent details', () => {
    const agent: Agent = {
      id: 'bc_abc123',
      name: 'My Agent',
      status: 'FINISHED',
      source: {
        repository: 'https://github.com/owner/repo',
        ref: 'main',
      },
      target: {
        url: 'https://cursor.com/agent/bc_abc123',
        branchName: 'feature/my-changes',
        prUrl: 'https://github.com/owner/repo/pull/1',
      },
      summary: 'Fixed the bug in the login form',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const result = formatAgentStatus(agent);
    expect(result.embeds).toHaveLength(1);

    const embed = result.embeds[0];
    expect(embed.title).toContain('My Agent');
    expect(embed.description).toBe('Fixed the bug in the login form');
    expect(embed.url).toBe('https://cursor.com/agent/bc_abc123');
    expect(embed.color).toBe(0x00ff00); // Green for FINISHED

    const fieldNames = embed.fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain('Status');
    expect(fieldNames).toContain('Repository');
    expect(fieldNames).toContain('Branch/Ref');
    expect(fieldNames).toContain('Target Branch');
    expect(fieldNames).toContain('Pull Request');
  });

  it('should use correct color for different statuses', () => {
    const makeAgent = (status: Agent['status']): Agent => ({
      id: 'bc_test',
      name: 'Test',
      status,
      source: { repository: 'repo' },
      target: { url: 'url' },
      createdAt: '2024-01-01T00:00:00Z',
    });

    expect(formatAgentStatus(makeAgent('FINISHED')).embeds[0].color).toBe(0x00ff00);
    expect(formatAgentStatus(makeAgent('FAILED')).embeds[0].color).toBe(0xff0000);
    expect(formatAgentStatus(makeAgent('RUNNING')).embeds[0].color).toBe(0x0099ff);
  });
});

describe('formatConversation', () => {
  it('should return empty message when no messages', () => {
    expect(formatConversation([])).toBe('💬 No conversation history yet.');
  });

  it('should format conversation messages', () => {
    const messages: ConversationMessage[] = [
      { id: '1', type: 'user_message', text: 'Fix the bug' },
      { id: '2', type: 'assistant_message', text: 'I will fix it now' },
    ];

    const result = formatConversation(messages);
    expect(result).toContain('💬 **Conversation History**');
    expect(result).toContain('👤 **You:**');
    expect(result).toContain('Fix the bug');
    expect(result).toContain('🤖 **Agent:**');
    expect(result).toContain('I will fix it now');
  });
});

describe('formatModels', () => {
  it('should return empty message when no models', () => {
    expect(formatModels([])).toBe('🤖 No models available.');
  });

  it('should format models list', () => {
    const models = ['gpt-4', 'claude-3-opus', 'gemini-pro'];
    const result = formatModels(models);

    expect(result).toContain('🤖 **Available Models**');
    expect(result).toContain('• gpt-4');
    expect(result).toContain('• claude-3-opus');
    expect(result).toContain('• gemini-pro');
    expect(result).toContain('Tip:');
  });
});

describe('formatRepositories', () => {
  it('should return empty message when no repos', () => {
    expect(formatRepositories([])).toBe('📦 No repositories found.');
  });

  it('should format repositories list with rate limit warning', () => {
    const repos: Repository[] = [
      { owner: 'owner1', name: 'repo1', repository: 'https://github.com/owner1/repo1' },
      { owner: 'owner2', name: 'repo2', repository: 'https://github.com/owner2/repo2' },
    ];

    const result = formatRepositories(repos);
    expect(result).toContain('📦 **Accessible Repositories**');
    expect(result).toContain('rate-limited');
    expect(result).toContain('**owner1/repo1**');
    expect(result).toContain('**owner2/repo2**');
  });
});

describe('formatApiKeyInfo', () => {
  it('should format API key information', () => {
    const info = {
      apiKeyName: 'My API Key',
      userEmail: 'user@example.com',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const result = formatApiKeyInfo(info);
    expect(result).toContain('🔑 **API Key Information**');
    expect(result).toContain('My API Key');
    expect(result).toContain('user@example.com');
    expect(result).toContain('Your API key is valid');
  });
});

describe('formatError', () => {
  it('should format error messages', () => {
    const result = formatError(new Error('Something went wrong'));
    expect(result).toContain('❌ **Error**');
  });

  it('should sanitize unknown errors', () => {
    const result = formatError(new Error('Internal database xyz failed'));
    expect(result).toContain('unexpected error');
    expect(result).not.toContain('database');
  });
});

describe('formatSuccess', () => {
  it('should format success messages', () => {
    expect(formatSuccess('Operation completed')).toBe('✅ Operation completed');
  });
});
