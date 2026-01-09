// Discord context building utilities

import type {
  DiscordInteraction,
  ReferencedMessage,
} from './types';

/**
 * Builds a prompt with context from a referenced Discord message
 * @param userPrompt - The user's actual prompt/task
 * @param referencedMessage - The message that was replied to
 * @returns Enhanced prompt with context
 */
export function buildPromptWithContext(
  userPrompt: string,
  referencedMessage?: ReferencedMessage
): string {
  // If no referenced message, return the prompt as-is
  if (!referencedMessage) {
    return userPrompt;
  }

  const contextParts: string[] = [];

  // Add section header for context
  contextParts.push('=== CHANNEL CONTEXT ===');
  contextParts.push('');

  // Add the referenced message content
  const authorName = referencedMessage.author.global_name || 
                     referencedMessage.author.username;
  const isBot = referencedMessage.author.bot ? ' [BOT]' : '';
  
  contextParts.push(`Message from @${authorName}${isBot}:`);
  
  if (referencedMessage.content) {
    contextParts.push(referencedMessage.content);
  }

  // Include attachment information if present
  if (referencedMessage.attachments && referencedMessage.attachments.length > 0) {
    contextParts.push('');
    contextParts.push('Attachments:');
    referencedMessage.attachments.forEach(attachment => {
      contextParts.push(`- ${attachment.filename} (${attachment.content_type || 'unknown'}): ${attachment.url}`);
    });
  }

  // Include embed information if present
  if (referencedMessage.embeds && referencedMessage.embeds.length > 0) {
    contextParts.push('');
    contextParts.push(`[Message contains ${referencedMessage.embeds.length} embed(s)]`);
  }

  // Add separator and user's actual task
  contextParts.push('');
  contextParts.push('=== USER TASK ===');
  contextParts.push('');
  contextParts.push(userPrompt);

  return contextParts.join('\n');
}

/**
 * Extracts referenced message from Discord interaction
 * @param interaction - The Discord interaction object
 * @returns The referenced message if present
 */
export function extractReferencedMessage(
  interaction: DiscordInteraction
): ReferencedMessage | undefined {
  // Check for message reference in the interaction
  // This happens when a user replies to a message and then uses a slash command
  const referencedMessage = interaction.message?.referenced_message;

  if (!referencedMessage) {
    return undefined;
  }

  return {
    id: referencedMessage.id,
    content: referencedMessage.content || '',
    author: {
      id: referencedMessage.author.id,
      username: referencedMessage.author.username,
      discriminator: referencedMessage.author.discriminator,
      global_name: referencedMessage.author.global_name,
      bot: referencedMessage.author.bot,
    },
    timestamp: referencedMessage.timestamp,
    attachments: referencedMessage.attachments,
    embeds: referencedMessage.embeds,
  };
}


/**
 * Extracts target message from a message context menu interaction
 * @param interaction - The Discord interaction object from a context menu command
 * @returns The target message if present
 */
export function extractTargetMessage(
  interaction: DiscordInteraction
): ReferencedMessage | undefined {
  // For message context menu commands, the target message is in resolved.messages
  const targetId = interaction.data?.target_id;
  if (!targetId) {
    return undefined;
  }

  const targetMessage = interaction.data?.resolved?.messages?.[targetId];
  if (!targetMessage) {
    return undefined;
  }

  return {
    id: targetMessage.id,
    content: targetMessage.content || '',
    author: {
      id: targetMessage.author.id,
      username: targetMessage.author.username,
      discriminator: targetMessage.author.discriminator,
      global_name: targetMessage.author.global_name,
      bot: targetMessage.author.bot,
    },
    timestamp: targetMessage.timestamp,
    attachments: targetMessage.attachments,
    embeds: targetMessage.embeds,
  };
}
