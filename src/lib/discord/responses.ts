import type { Agent, ConversationMessage, Repository } from '../cursor/types';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMBED_DESCRIPTION_LENGTH = 4096;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 15) + '... (truncated)';
}

export function formatAgentList(agents: Agent[]): string {
  if (agents.length === 0) {
    return '📋 No agents found.';
  }

  let message = `📋 **Your Agents** (${agents.length})\n\n`;

  for (const agent of agents) {
    const statusEmoji = {
      RUNNING: '🔄',
      FINISHED: '✅',
      STOPPED: '⏸️',
      FAILED: '❌',
    }[agent.status] || '❓';

    const line = `${statusEmoji} **${agent.name || agent.id}**\n`;
    const details = `   ID: \`${agent.id}\` | Status: ${agent.status}\n`;
    const created = `   Created: ${new Date(agent.createdAt).toLocaleString()}\n\n`;

    message += line + details + created;
  }

  return truncate(message, MAX_MESSAGE_LENGTH);
}

export function formatAgentStatus(agent: Agent) {
  const statusEmoji = {
    RUNNING: '🔄',
    FINISHED: '✅',
    STOPPED: '⏸️',
    FAILED: '❌',
  }[agent.status] || '❓';

  const fields = [
    {
      name: 'Status',
      value: `${statusEmoji} ${agent.status}`,
      inline: true,
    },
    {
      name: 'Repository',
      value: agent.source.repository,
      inline: true,
    },
  ];

  if (agent.source.ref) {
    fields.push({
      name: 'Branch/Ref',
      value: agent.source.ref,
      inline: true,
    });
  }

  if (agent.target.branchName) {
    fields.push({
      name: 'Target Branch',
      value: agent.target.branchName,
      inline: true,
    });
  }

  if (agent.target.prUrl) {
    fields.push({
      name: 'Pull Request',
      value: `[View PR](${agent.target.prUrl})`,
      inline: true,
    });
  }

  const description = agent.summary
    ? truncate(agent.summary, MAX_EMBED_DESCRIPTION_LENGTH)
    : 'No summary available yet.';

  return {
    embeds: [
      {
        title: `${statusEmoji} ${agent.name || agent.id}`,
        description,
        url: agent.target.url,
        color: agent.status === 'FINISHED' ? 0x00ff00 : agent.status === 'FAILED' ? 0xff0000 : 0x0099ff,
        fields,
        footer: {
          text: `Agent ID: ${agent.id}`,
        },
        timestamp: agent.createdAt,
      },
    ],
  };
}

export function formatConversation(messages: ConversationMessage[]): string {
  if (messages.length === 0) {
    return '💬 No conversation history yet.';
  }

  let message = '💬 **Conversation History**\n\n';

  for (const msg of messages) {
    const icon = msg.type === 'user_message' ? '👤' : '🤖';
    const role = msg.type === 'user_message' ? 'You' : 'Agent';
    
    message += `${icon} **${role}:**\n${msg.text}\n\n`;
  }

  return truncate(message, MAX_MESSAGE_LENGTH);
}

export function formatModels(models: string[]): string {
  if (models.length === 0) {
    return '🤖 No models available.';
  }

  let message = '🤖 **Available Models**\n\n';

  for (const model of models) {
    message += `• ${model}\n`;
  }

  message += '\n💡 *Tip: Use model name in `/agent create` or leave empty for auto-selection*';

  return truncate(message, MAX_MESSAGE_LENGTH);
}

export function formatRepositories(repos: Repository[]): string {
  if (repos.length === 0) {
    return '📦 No repositories found.';
  }

  let message = '📦 **Accessible Repositories**\n\n';
  message += '⚠️ *This endpoint is rate-limited: 1 request/minute, 30/hour*\n\n';

  for (const repo of repos) {
    message += `• **${repo.owner}/${repo.name}**\n  ${repo.repository}\n\n`;
  }

  return truncate(message, MAX_MESSAGE_LENGTH);
}

export function formatApiKeyInfo(info: { apiKeyName: string; createdAt: string; userEmail: string }): string {
  return `🔑 **API Key Information**

**Name:** ${info.apiKeyName}
**Email:** ${info.userEmail}
**Created:** ${new Date(info.createdAt).toLocaleString()}

✅ Your API key is valid and working!`;
}

export function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';

  return `❌ **Error**\n\n\`\`\`\n${truncate(message, 1900)}\n\`\`\``;
}

export function formatSuccess(message: string): string {
  return `✅ ${message}`;
}

