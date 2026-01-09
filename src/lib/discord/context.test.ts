import { describe, it, expect } from 'vitest';
import { buildPromptWithContext, extractReferencedMessage, extractTargetMessage } from './context';
import type { DiscordInteraction, ReferencedMessage } from './types';

describe('buildPromptWithContext', () => {
  it('should return prompt as-is when no referenced message', () => {
    const prompt = 'Fix the login bug';
    expect(buildPromptWithContext(prompt, undefined)).toBe(prompt);
  });

  it('should include referenced message context', () => {
    const prompt = 'Fix this issue';
    const referencedMessage: ReferencedMessage = {
      id: '123',
      content: 'The button is not working on mobile',
      author: {
        id: '456',
        username: 'testuser',
        global_name: 'Test User',
      },
      timestamp: '2024-01-01T00:00:00Z',
    };

    const result = buildPromptWithContext(prompt, referencedMessage);

    expect(result).toContain('=== CHANNEL CONTEXT ===');
    expect(result).toContain('Message from @Test User:');
    expect(result).toContain('The button is not working on mobile');
    expect(result).toContain('=== USER TASK ===');
    expect(result).toContain('Fix this issue');
  });

  it('should use username when global_name is not available', () => {
    const referencedMessage: ReferencedMessage = {
      id: '123',
      content: 'Test message',
      author: {
        id: '456',
        username: 'testuser',
      },
      timestamp: '2024-01-01T00:00:00Z',
    };

    const result = buildPromptWithContext('Task', referencedMessage);
    expect(result).toContain('Message from @testuser:');
  });

  it('should mark bot messages', () => {
    const referencedMessage: ReferencedMessage = {
      id: '123',
      content: 'Bot response',
      author: {
        id: '456',
        username: 'botuser',
        bot: true,
      },
      timestamp: '2024-01-01T00:00:00Z',
    };

    const result = buildPromptWithContext('Task', referencedMessage);
    expect(result).toContain('[BOT]');
  });

  it('should include attachment information', () => {
    const referencedMessage: ReferencedMessage = {
      id: '123',
      content: 'Check this file',
      author: {
        id: '456',
        username: 'testuser',
      },
      timestamp: '2024-01-01T00:00:00Z',
      attachments: [
        {
          id: 'att1',
          filename: 'screenshot.png',
          url: 'https://cdn.discord.com/attachments/123/screenshot.png',
          content_type: 'image/png',
          size: 1024,
        },
      ],
    };

    const result = buildPromptWithContext('Task', referencedMessage);
    expect(result).toContain('Attachments:');
    expect(result).toContain('screenshot.png');
    expect(result).toContain('image/png');
  });

  it('should note embed count', () => {
    const referencedMessage: ReferencedMessage = {
      id: '123',
      content: 'Message with embeds',
      author: {
        id: '456',
        username: 'testuser',
      },
      timestamp: '2024-01-01T00:00:00Z',
      embeds: [{ title: 'Embed 1' }, { title: 'Embed 2' }],
    };

    const result = buildPromptWithContext('Task', referencedMessage);
    expect(result).toContain('2 embed(s)');
  });
});

describe('extractReferencedMessage', () => {
  it('should return undefined when no message reference', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: { name: 'agent' },
    };

    expect(extractReferencedMessage(interaction)).toBeUndefined();
  });

  it('should return undefined when message exists but no referenced_message', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      message: {
        id: '123',
        content: 'Test',
        author: { id: '456', username: 'test' },
        timestamp: '2024-01-01T00:00:00Z',
      },
      data: { name: 'agent' },
    };

    expect(extractReferencedMessage(interaction)).toBeUndefined();
  });

  it('should extract referenced message when present', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      message: {
        id: '123',
        content: 'Reply',
        author: { id: '456', username: 'replier' },
        timestamp: '2024-01-01T00:00:00Z',
        referenced_message: {
          id: '100',
          content: 'Original message',
          author: {
            id: '789',
            username: 'originaluser',
            global_name: 'Original User',
            bot: false,
          },
          timestamp: '2024-01-01T00:00:00Z',
          attachments: [],
          embeds: [],
        },
      },
      data: { name: 'agent' },
    };

    const result = extractReferencedMessage(interaction);

    expect(result).toBeDefined();
    expect(result?.id).toBe('100');
    expect(result?.content).toBe('Original message');
    expect(result?.author.username).toBe('originaluser');
    expect(result?.author.global_name).toBe('Original User');
  });

  it('should handle empty content gracefully', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      message: {
        id: '123',
        content: '',
        author: { id: '456', username: 'test' },
        timestamp: '2024-01-01T00:00:00Z',
        referenced_message: {
          id: '100',
          content: '',
          author: { id: '789', username: 'original' },
          timestamp: '2024-01-01T00:00:00Z',
        },
      },
      data: { name: 'agent' },
    };

    const result = extractReferencedMessage(interaction);
    expect(result?.content).toBe('');
  });
});

describe('extractTargetMessage', () => {
  it('should return undefined when no target_id', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: { name: 'Ask Agent' },
    };

    expect(extractTargetMessage(interaction)).toBeUndefined();
  });

  it('should return undefined when no resolved messages', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: {
        name: 'Ask Agent',
        target_id: '123',
      },
    };

    expect(extractTargetMessage(interaction)).toBeUndefined();
  });

  it('should return undefined when target message not in resolved', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: {
        name: 'Ask Agent',
        target_id: '123',
        resolved: {
          messages: {
            '999': {
              id: '999',
              content: 'Different message',
              author: { id: '456', username: 'test' },
              timestamp: '2024-01-01T00:00:00Z',
            },
          },
        },
      },
    };

    expect(extractTargetMessage(interaction)).toBeUndefined();
  });

  it('should extract target message from context menu interaction', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: {
        name: 'Ask Agent',
        target_id: '123',
        resolved: {
          messages: {
            '123': {
              id: '123',
              content: 'This is the bug report from the user',
              author: {
                id: '456',
                username: 'reporter',
                global_name: 'Bug Reporter',
                bot: false,
              },
              timestamp: '2024-01-01T00:00:00Z',
              attachments: [],
              embeds: [],
            },
          },
        },
      },
    };

    const result = extractTargetMessage(interaction);

    expect(result).toBeDefined();
    expect(result?.id).toBe('123');
    expect(result?.content).toBe('This is the bug report from the user');
    expect(result?.author.username).toBe('reporter');
    expect(result?.author.global_name).toBe('Bug Reporter');
  });

  it('should include attachments from target message', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: {
        name: 'Ask Agent',
        target_id: '123',
        resolved: {
          messages: {
            '123': {
              id: '123',
              content: 'See attached screenshot',
              author: { id: '456', username: 'user' },
              timestamp: '2024-01-01T00:00:00Z',
              attachments: [
                {
                  id: 'att1',
                  filename: 'error.png',
                  url: 'https://cdn.discord.com/attachments/123/error.png',
                  content_type: 'image/png',
                  size: 2048,
                },
              ],
            },
          },
        },
      },
    };

    const result = extractTargetMessage(interaction);

    expect(result?.attachments).toHaveLength(1);
    expect(result?.attachments?.[0].filename).toBe('error.png');
  });

  it('should handle bot messages', () => {
    const interaction: DiscordInteraction = {
      type: 2,
      data: {
        name: 'Ask Agent',
        target_id: '123',
        resolved: {
          messages: {
            '123': {
              id: '123',
              content: 'Automated response',
              author: {
                id: '456',
                username: 'bot-user',
                bot: true,
              },
              timestamp: '2024-01-01T00:00:00Z',
            },
          },
        },
      },
    };

    const result = extractTargetMessage(interaction);
    expect(result?.author.bot).toBe(true);
  });
});
