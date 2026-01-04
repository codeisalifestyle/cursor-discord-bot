import { z } from 'zod';

// Full config schema for runtime (API endpoints)
const envSchema = z.object({
  DISCORD_PUBLIC_KEY: z.string().min(1, 'DISCORD_PUBLIC_KEY is required'),
  DISCORD_APPLICATION_ID: z.string().min(1, 'DISCORD_APPLICATION_ID is required'),
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required'),
  CURSOR_API_TOKEN: z.string().min(1, 'CURSOR_API_TOKEN is required'),
});

// Minimal config schema for command registration (only needs Discord bot credentials)
const registrationEnvSchema = z.object({
  DISCORD_APPLICATION_ID: z.string().min(1, 'DISCORD_APPLICATION_ID is required'),
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required'),
});

type Env = z.infer<typeof envSchema>;
type RegistrationEnv = z.infer<typeof registrationEnvSchema>;

let cachedConfig: Env | null = null;
let cachedRegistrationConfig: RegistrationEnv | null = null;

function loadConfig(): Env {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = {
    DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    CURSOR_API_TOKEN: process.env.CURSOR_API_TOKEN,
  };

  try {
    cachedConfig = envSchema.parse(config);
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

function loadRegistrationConfig(): RegistrationEnv {
  if (cachedRegistrationConfig) {
    return cachedRegistrationConfig;
  }

  const config = {
    DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  };

  try {
    cachedRegistrationConfig = registrationEnvSchema.parse(config);
    return cachedRegistrationConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

export function getConfig(): Env {
  return loadConfig();
}

export function getRegistrationConfig(): RegistrationEnv {
  return loadRegistrationConfig();
}

export const CURSOR_API_BASE_URL = 'https://api.cursor.com';
export const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';

