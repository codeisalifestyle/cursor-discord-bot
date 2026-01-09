import { NextRequest, NextResponse } from 'next/server';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import { verifyDiscordRequest, extractSignatureData } from '@/src/lib/discord/verify';
import { cursorApi } from '@/src/lib/cursor/client';
import {
  formatAgentList,
  formatAgentStatus,
  formatConversation,
  formatModels,
  formatRepositories,
  formatApiKeyInfo,
  formatError,
  formatSuccess,
} from '@/src/lib/discord/responses';
import {
  buildPromptWithContext,
  extractReferencedMessage,
  extractTargetMessage,
} from '@/src/lib/discord/context';
import type {
  DiscordInteraction,
  DiscordCommandOption,
  OptionValue,
} from '@/src/lib/discord/types';
import {
  validateAgentId,
  validateLimit,
  validatePrompt,
  validateRepository,
  validateBranchName,
} from '@/src/lib/validation';

function getOptionValue(
  options: DiscordCommandOption[] | undefined,
  name: string
): OptionValue {
  if (!options) return undefined;
  const option = options.find((opt) => opt.name === name);
  return option?.value;
}

function getStringOption(
  options: DiscordCommandOption[] | undefined,
  name: string
): string | undefined {
  const value = getOptionValue(options, name);
  return typeof value === 'string' ? value : undefined;
}

function getNumberOption(
  options: DiscordCommandOption[] | undefined,
  name: string
): number | undefined {
  const value = getOptionValue(options, name);
  return typeof value === 'number' ? value : undefined;
}

function getBooleanOption(
  options: DiscordCommandOption[] | undefined,
  name: string
): boolean | undefined {
  const value = getOptionValue(options, name);
  return typeof value === 'boolean' ? value : undefined;
}

export async function POST(req: NextRequest) {
  try {
    // Verify Discord signature
    const { signature, timestamp } = extractSignatureData(req.headers);

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
    }

    const body = await req.text();

    const isValid = await verifyDiscordRequest(signature, timestamp, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction: DiscordInteraction = JSON.parse(body);

    // Handle Discord PING
    if (interaction.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle application commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const { data } = interaction;

      if (!data) {
        return NextResponse.json(
          { error: 'Missing command data' },
          { status: 400 }
        );
      }

      // Handle "Ask Agent" context menu command
      if (data.name === 'Ask Agent') {
        const targetMessage = extractTargetMessage(interaction);
        
        if (!targetMessage) {
          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: formatError(new Error('Could not retrieve the target message')),
              flags: 64, // Ephemeral
            },
          });
        }

        // Truncate message content for the modal (Discord limit)
        const truncatedContent = targetMessage.content.length > 500
          ? targetMessage.content.slice(0, 497) + '...'
          : targetMessage.content;

        // Return a modal for the user to fill in the prompt and repository
        return NextResponse.json({
          type: InteractionResponseType.MODAL,
          data: {
            custom_id: `ask_agent_modal:${targetMessage.id}`,
            title: 'Ask Agent About Message',
            components: [
              {
                type: 1, // Action Row
                components: [
                  {
                    type: 4, // Text Input
                    custom_id: 'message_context',
                    label: 'Message Context (for reference)',
                    style: 2, // Paragraph
                    value: truncatedContent,
                    required: true,
                    max_length: 1000,
                  },
                ],
              },
              {
                type: 1, // Action Row
                components: [
                  {
                    type: 4, // Text Input
                    custom_id: 'prompt',
                    label: 'Your Task/Instruction',
                    style: 2, // Paragraph
                    placeholder: 'e.g., Fix this bug, Implement this feature...',
                    required: true,
                    min_length: 10,
                    max_length: 2000,
                  },
                ],
              },
              {
                type: 1, // Action Row
                components: [
                  {
                    type: 4, // Text Input
                    custom_id: 'repository',
                    label: 'GitHub Repository URL',
                    style: 1, // Short
                    placeholder: 'https://github.com/owner/repo',
                    required: true,
                  },
                ],
              },
            ],
          },
        });
      }

      if (data.name !== 'agent') {
        return NextResponse.json(
          { error: 'Unknown command' },
          { status: 400 }
        );
      }

      const subcommandOption = data.options?.[0];
      if (!subcommandOption) {
        return NextResponse.json(
          { error: 'Missing subcommand' },
          { status: 400 }
        );
      }

      const subcommand = subcommandOption.name;
      const options = subcommandOption.options;

      try {
        // Route to appropriate handler
        switch (subcommand) {
          case 'create': {
            const prompt = validatePrompt(getStringOption(options, 'prompt'));
            const repository = validateRepository(getStringOption(options, 'repository'));
            const model = getStringOption(options, 'model');
            const ref = getStringOption(options, 'ref');
            const branchName = validateBranchName(getStringOption(options, 'branch_name'));
            const autoCreatePr = getBooleanOption(options, 'auto_create_pr');

            // Extract referenced message if user replied to a message
            const referencedMessage = extractReferencedMessage(interaction);

            // Build prompt with context from referenced message
            const fullPrompt = buildPromptWithContext(prompt, referencedMessage);

            const result = await cursorApi.launchAgent({
              prompt: { text: fullPrompt },
              source: { repository, ref },
              model,
              target: {
                branchName,
                autoCreatePr,
              },
            });

            const agent = await cursorApi.getAgentStatus(result.id);

            // Add note about context if it was included
            const contextNote = referencedMessage 
              ? '\n\n💬 *Context from referenced message included*' 
              : '';

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatSuccess(
                  `Agent launched!\n\n**ID:** \`${agent.id}\`\n**Branch:** ${agent.target.branchName || 'auto-generated'}\n**URL:** ${agent.target.url}${contextNote}`
                ),
              },
            });
          }

          case 'list': {
            const limit = validateLimit(getNumberOption(options, 'limit'));
            const result = await cursorApi.listAgents(limit);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatAgentList(result.agents),
              },
            });
          }

          case 'status': {
            const agentId = validateAgentId(getStringOption(options, 'agent_id'));
            const agent = await cursorApi.getAgentStatus(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: formatAgentStatus(agent),
            });
          }

          case 'conversation': {
            const agentId = validateAgentId(getStringOption(options, 'agent_id'));
            const conversation = await cursorApi.getAgentConversation(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatConversation(conversation.messages),
              },
            });
          }

          case 'followup': {
            const agentId = validateAgentId(getStringOption(options, 'agent_id'));
            const prompt = validatePrompt(getStringOption(options, 'prompt'));

            // Extract referenced message if user replied to a message
            const referencedMessage = extractReferencedMessage(interaction);

            // Build prompt with context from referenced message
            const fullPrompt = buildPromptWithContext(prompt, referencedMessage);

            await cursorApi.followUpAgent(agentId, {
              prompt: { text: fullPrompt },
            });

            // Add note about context if it was included
            const contextNote = referencedMessage 
              ? '\n\n💬 *Context from referenced message included*' 
              : '';

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatSuccess(
                  `Follow-up added to agent \`${agentId}\`\n\nThe agent will continue working on your instruction.${contextNote}`
                ),
              },
            });
          }

          case 'stop': {
            const agentId = validateAgentId(getStringOption(options, 'agent_id'));
            await cursorApi.stopAgent(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatSuccess(`Agent \`${agentId}\` stopped.`),
              },
            });
          }

          case 'delete': {
            const agentId = validateAgentId(getStringOption(options, 'agent_id'));
            await cursorApi.deleteAgent(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatSuccess(
                  `Agent \`${agentId}\` permanently deleted.`
                ),
              },
            });
          }

          case 'models': {
            const result = await cursorApi.listModels();

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatModels(result.models),
              },
            });
          }

          case 'repos': {
            // Defer response for slow endpoint
            const result = await cursorApi.listRepositories();

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatRepositories(result.repositories),
              },
            });
          }

          case 'apikey': {
            const info = await cursorApi.getApiKeyInfo();

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatApiKeyInfo(info),
                flags: 64, // EPHEMERAL - only visible to the user who invoked the command
              },
            });
          }

          default:
            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatError(new Error(`Unknown subcommand: ${subcommand}`)),
              },
            });
        }
      } catch (error) {
        console.error('Command execution error:', error);

        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: formatError(error),
          },
        });
      }
    }

    // Handle modal submissions
    if (interaction.type === 5) { // MODAL_SUBMIT
      const { data } = interaction;
      const customId = data?.custom_id;

      if (customId?.startsWith('ask_agent_modal:')) {
        try {
          // Extract values from modal components
          const components = data?.components || [];
          let messageContext = '';
          let prompt = '';
          let repository = '';

          for (const row of components) {
            for (const component of row.components || []) {
              if (component.custom_id === 'message_context') {
                messageContext = component.value || '';
              } else if (component.custom_id === 'prompt') {
                prompt = component.value || '';
              } else if (component.custom_id === 'repository') {
                repository = component.value || '';
              }
            }
          }

          // Validate inputs
          const validatedPrompt = validatePrompt(prompt);
          const validatedRepository = validateRepository(repository);

          // Build the full prompt with the message context
          const fullPrompt = `=== DISCORD MESSAGE CONTEXT ===

${messageContext}

=== USER TASK ===

${validatedPrompt}`;

          // Launch the agent
          const result = await cursorApi.launchAgent({
            prompt: { text: fullPrompt },
            source: { repository: validatedRepository },
          });

          const agent = await cursorApi.getAgentStatus(result.id);

          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: formatSuccess(
                `Agent launched from message context!\n\n**ID:** \`${agent.id}\`\n**Branch:** ${agent.target.branchName || 'auto-generated'}\n**URL:** ${agent.target.url}\n\n💬 *Context from Discord message included*`
              ),
            },
          });
        } catch (error) {
          console.error('Modal submission error:', error);

          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: formatError(error),
            },
          });
        }
      }
    }

    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
  } catch (error) {
    console.error('Request handling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing for signature verification
export const runtime = 'nodejs';

