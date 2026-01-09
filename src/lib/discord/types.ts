// Discord API Types for Interactions

export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  global_name?: string;
  bot?: boolean;
  avatar?: string;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  content_type?: string;
  size: number;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
  attachments?: DiscordAttachment[];
  embeds?: DiscordEmbed[];
  referenced_message?: DiscordMessage;
}

export interface DiscordCommandOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  options?: DiscordCommandOption[];
}

// Resolved data for context menu commands
export interface DiscordResolvedData {
  messages?: Record<string, DiscordMessage>;
  users?: Record<string, DiscordUser>;
}

// Modal text input component
export interface DiscordModalComponent {
  type: number; // 4 = text input
  custom_id: string;
  style?: number; // 1 = short, 2 = paragraph
  label: string;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

// Action row containing components
export interface DiscordActionRow {
  type: 1; // Action row
  components: DiscordModalComponent[];
}

export interface DiscordInteractionData {
  name?: string;
  custom_id?: string; // For modals
  options?: DiscordCommandOption[];
  target_id?: string; // For context menu commands
  resolved?: DiscordResolvedData;
  components?: DiscordActionRow[]; // For modal submissions
}

export interface DiscordInteraction {
  type: number;
  channel_id?: string;
  message?: DiscordMessage;
  data?: DiscordInteractionData;
}

export interface ReferencedMessage {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
  attachments?: DiscordAttachment[];
  embeds?: DiscordEmbed[];
}

// Utility type for extracting option values
export type OptionValue = string | number | boolean | undefined;
