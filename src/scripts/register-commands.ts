#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import { getRegistrationConfig, DISCORD_API_BASE_URL } from '../lib/config';
import { commands } from '../lib/discord/commands';

// Load .env.local file
loadEnv({ path: '.env.local' });

async function registerCommands() {
  const config = getRegistrationConfig();
  const url = `${DISCORD_API_BASE_URL}/applications/${config.DISCORD_APPLICATION_ID}/commands`;

  console.log('🔄 Registering Discord commands...');
  console.log(`   Application ID: ${config.DISCORD_APPLICATION_ID}`);
  console.log(`   Commands to register: ${commands.length}`);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord API error: ${JSON.stringify(errorData, null, 2)}`);
    }

    const registeredCommands = await response.json();

    console.log('\n✅ Successfully registered commands:');
    for (const command of registeredCommands) {
      console.log(`   - /${command.name} (ID: ${command.id})`);
    }

    console.log('\n✨ Done! Commands are now available in Discord.');
    console.log('   Go to your Discord server and type / to see them.');
  } catch (error) {
    console.error('\n❌ Failed to register commands:');
    console.error(error);
    process.exit(1);
  }
}

registerCommands();

