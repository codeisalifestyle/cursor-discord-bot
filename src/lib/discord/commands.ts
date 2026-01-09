// Discord API types and command definitions

export const ApplicationCommandType = {
  CHAT_INPUT: 1,
  USER: 2,
  MESSAGE: 3,
} as const;

export const ApplicationCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
} as const;

export interface ApplicationCommandOption {
  type: number;
  name: string;
  description: string;
  required?: boolean;
  choices?: Array<{ name: string; value: string }>;
  options?: ApplicationCommandOption[];
}

export interface ApplicationCommand {
  name: string;
  description: string;
  type?: number;
  options?: ApplicationCommandOption[];
  default_member_permissions?: string | null;
}

// Permission: Manage Server (1 << 3)
const MANAGE_SERVER_PERMISSION = String(1 << 3);

export const agentCommand: ApplicationCommand = {
  name: 'agent',
  description: 'Manage Cursor Cloud Agents',
  type: ApplicationCommandType.CHAT_INPUT,
  default_member_permissions: MANAGE_SERVER_PERMISSION,
  options: [
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'create',
      description: 'Launch a new Cursor Cloud Agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'prompt',
          description: 'The task or prompt for the agent',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'repository',
          description: 'GitHub repository URL',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'model',
          description: 'AI model to use (optional, defaults to auto)',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'ref',
          description: 'Git branch or ref (optional, defaults to main)',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'branch_name',
          description: 'Target branch name for changes (optional)',
          required: false,
        },
        {
          type: ApplicationCommandOptionType.BOOLEAN,
          name: 'auto_create_pr',
          description: 'Automatically create a PR when finished (default: false)',
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'list',
      description: 'List all your Cursor Cloud Agents',
      options: [
        {
          type: ApplicationCommandOptionType.INTEGER,
          name: 'limit',
          description: 'Number of agents to return (max 100)',
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'status',
      description: 'Get the status of a specific agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'agent_id',
          description: 'Agent ID (e.g., bc_abc123)',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'conversation',
      description: 'View the conversation history of an agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'agent_id',
          description: 'Agent ID (e.g., bc_abc123)',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'followup',
      description: 'Add a follow-up instruction to an agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'agent_id',
          description: 'Agent ID (e.g., bc_abc123)',
          required: true,
        },
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'prompt',
          description: 'Follow-up instruction',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'stop',
      description: 'Stop a running agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'agent_id',
          description: 'Agent ID (e.g., bc_abc123)',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'delete',
      description: 'Permanently delete an agent',
      options: [
        {
          type: ApplicationCommandOptionType.STRING,
          name: 'agent_id',
          description: 'Agent ID (e.g., bc_abc123)',
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'models',
      description: 'List available AI models for agents',
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'repos',
      description: 'List accessible GitHub repositories (rate limited)',
    },
    {
      type: ApplicationCommandOptionType.SUB_COMMAND,
      name: 'apikey',
      description: 'Show information about your Cursor API key',
    },
  ],
};

// Message context menu command - right-click a message to ask an agent about it
export const askAgentCommand: ApplicationCommand = {
  name: 'Ask Agent',
  description: '', // Context menu commands don't use descriptions
  type: ApplicationCommandType.MESSAGE,
  default_member_permissions: MANAGE_SERVER_PERMISSION,
};

export const commands: ApplicationCommand[] = [agentCommand, askAgentCommand];

