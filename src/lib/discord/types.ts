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

export interface DiscordInteractionData {
  name: string;
  options?: DiscordCommandOption[];
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
