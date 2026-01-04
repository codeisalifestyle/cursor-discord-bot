import { verifyKey } from 'discord-interactions';
import { getConfig } from '../config';

export async function verifyDiscordRequest(
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const config = getConfig();
    const isValid = await verifyKey(body, signature, timestamp, config.DISCORD_PUBLIC_KEY);
    return isValid;
  } catch (error) {
    console.error('Discord signature verification failed:', error);
    return false;
  }
}

export function extractSignatureData(headers: Headers): {
  signature: string | null;
  timestamp: string | null;
} {
  return {
    signature: headers.get('x-signature-ed25519'),
    timestamp: headers.get('x-signature-timestamp'),
  };
}

