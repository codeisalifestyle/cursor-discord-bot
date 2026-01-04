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
} from '@/src/lib/discord/context';

interface DiscordInteraction {
  type: number;
  channel_id?: string;
  message?: {
    id: string;
    content?: string;
    referenced_message?: any;
  };
  data?: {
    name: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string | number | boolean;
      options?: Array<{
        name: string;
        value: string | number | boolean;
      }>;
    }>;
  };
}

function getOptionValue(options: any[] | undefined, name: string): any {
  if (!options) return undefined;
  const option = options.find((opt) => opt.name === name);
  return option?.value;
}

function getSubcommandOptions(options: any[] | undefined): any[] | undefined {
  if (!options) return undefined;
  const subcommand = options[0];
  return subcommand?.options;
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

      if (!data || data.name !== 'agent') {
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
            const prompt = getOptionValue(options, 'prompt');
            const repository = getOptionValue(options, 'repository');
            const model = getOptionValue(options, 'model');
            const ref = getOptionValue(options, 'ref');
            const branchName = getOptionValue(options, 'branch_name');
            const autoCreatePr = getOptionValue(options, 'auto_create_pr');

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
            const limit = getOptionValue(options, 'limit') || 10;
            const result = await cursorApi.listAgents(limit);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatAgentList(result.agents),
              },
            });
          }

          case 'status': {
            const agentId = getOptionValue(options, 'agent_id');
            const agent = await cursorApi.getAgentStatus(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: formatAgentStatus(agent),
            });
          }

          case 'conversation': {
            const agentId = getOptionValue(options, 'agent_id');
            const conversation = await cursorApi.getAgentConversation(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatConversation(conversation.messages),
              },
            });
          }

          case 'followup': {
            const agentId = getOptionValue(options, 'agent_id');
            const prompt = getOptionValue(options, 'prompt');

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
            const agentId = getOptionValue(options, 'agent_id');
            await cursorApi.stopAgent(agentId);

            return NextResponse.json({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: formatSuccess(`Agent \`${agentId}\` stopped.`),
              },
            });
          }

          case 'delete': {
            const agentId = getOptionValue(options, 'agent_id');
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

