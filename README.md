# Cursor Discord Bot

A self-hostable Discord bot for managing Cursor Cloud Agents directly from Discord. Control your AI coding agents with slash commands.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodeisalifestyle%2Fcursor-discord-bot&env=DISCORD_PUBLIC_KEY,DISCORD_APPLICATION_ID,DISCORD_BOT_TOKEN,CURSOR_API_TOKEN&envDescription=Required%20API%20keys%20for%20Discord%20and%20Cursor&envLink=https%3A%2F%2Fgithub.com%2Fcodeisalifestyle%2Fcursor-discord-bot%2Fblob%2Fmain%2Fdocs%2FSETUP_GUIDE.md&project-name=cursor-discord-bot&repository-name=cursor-discord-bot)

## Features

- 🤖 **Launch Agents** - Create new Cursor Cloud Agents with custom prompts
- 📋 **Manage Agents** - List, view status, and monitor your agents
- 💬 **Conversation History** - View full agent conversation logs
- 🔄 **Follow-up Instructions** - Add additional tasks to running agents
- ⏸️ **Control** - Stop or delete agents as needed
- 🔍 **Discover** - List available models and accessible repositories
- 🔐 **Secure** - Discord native permissions, self-hosted on your infrastructure
- 👻 **Privacy Mode** - Optional private deployment mode (404 homepage, no indexing)

## Quick Start

### Prerequisites

- **Cursor Account** with API access ([cursor.com](https://cursor.com))
- **Discord Server** with admin permissions
- **Vercel Account** (free tier works)
- **GitHub Account** (for deployment)

### Cursor Preparation

Before getting your API token, ensure your Cursor settings are configured correctly for Cloud Agents:

1. Open Cursor Settings → **Integration** tab
2. Configure the following:
   - **Private Mode**: Must NOT be set to "legacy" (use "normal")
   - **On-demand Usage**: Turn this ON
   - **GitHub Connection**: Connect your GitHub account to Cursor

These settings are required for Cloud Agents to function properly.

### Setup Time

⏱️ **~10 minutes** from zero to working bot

### Step 1: Get API Keys

1. **Cursor API Token**
   - Go to [cursor.com/dashboard?tab=integrations](https://cursor.com/dashboard?tab=integrations)
   - Click "Generate New API Token"
   - Copy and save it securely
   - ⚠️ Keep secret - it has full access to your Cursor account

2. **Discord Application**
   - Visit [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" → Name it (e.g., "Cursor Agent Bot")
   - **General Information** tab: Copy **Application ID** and **Public Key**
   - **Bot** tab: 
     - Click "Add Bot" → Copy **Bot Token**
     - ⚠️ Bot token is shown only once!
   - **To make bot private** (optional):
     - First: **Installation** tab → Uncheck "Install Link"
     - Then: **Bot** tab → Turn off "Public Bot"
     - 💡 Private bots can only be added to servers you manage

### Step 2: Deploy to Vercel

Click the "Deploy with Vercel" button above, then:

1. Sign in with GitHub
2. Fork this repository
3. Enter your API keys as environment variables:
   - `CURSOR_API_TOKEN`
   - `DISCORD_APPLICATION_ID`
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_PUBLIC_KEY`
   - `PRIVATE_MODE` (optional - set to `true` for private deployment, `false` or omit for public)
4. Click "Deploy"
5. Copy your deployment URL (e.g., `https://your-bot.vercel.app`)

### Step 3: Configure Discord Interactions

1. Go back to Discord Developer Portal → Your App → **General Information**
2. Set **Interactions Endpoint URL**:
   ```
   https://your-bot.vercel.app/api/discord
   ```
3. Click "Save Changes"
4. ✅ Discord will verify with a green checkmark
   - ❌ If error: check URL is correct (with api/discord endpoint) and Vercel deployment succeeded

### Step 4: Register Commands

Commands must be registered once with Discord (runs locally):

```bash
# Clone your forked repository
git clone https://github.com/YOUR_USERNAME/cursor-discord-bot
cd cursor-discord-bot

# Install dependencies
npm install

# Create .env.local with Discord credentials only
cp .env.local.example .env.local

# Register commands
npm run register-commands
```
⚠️ This command is for Discord. Only `DISCORD_APPLICATION_ID` and `DISCORD_BOT_TOKEN` from .env.local are passed for registration. Other env vars (`DISCORD_PUBLIC_KEY`, `CURSOR_API_TOKEN`) are only used in Vercel.

**Expected output:**
```
✅ Successfully registered commands:
   - /agent (ID: 987654321...)
```


### Step 5: Invite Bot to Server

1. Discord Developer Portal → **OAuth2** → **URL Generator**
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Embed Links`, `Read Message History`
4. Copy and open the generated URL
5. Select your server and authorize

### Step 6: Configure Permissions (Optional)

By default, commands require "Manage Server" permission. To customize:

1. Discord Server → **Server Settings** → **Integrations**
2. Click your bot name
3. Configure per command:
   - **Roles**: Which roles can use it
   - **Channels**: Restrict to specific channels
   - **Users**: Grant to specific users
4. Changes apply instantly

💡 Commands won't appear in slash menu for unauthorized users.

### Step 7: Test

In Discord, type:
```
/agent models
```

You should see a list of available AI models! 🎉

## Available Commands

All commands are under `/agent`:

| Command | Description |
|---------|-------------|
| `/agent create` | Launch a new agent with a prompt |
| `/agent list` | List all your agents |
| `/agent status <agent_id>` | View agent status and details |
| `/agent conversation <agent_id>` | View conversation history |
| `/agent followup <agent_id>` | Add follow-up instruction |
| `/agent stop <agent_id>` | Stop a running agent |
| `/agent delete <agent_id>` | Permanently delete an agent |
| `/agent models` | List available AI models |
| `/agent repos` | List accessible GitHub repos |
| `/agent apikey` | View API key information |

## Channel Context Support

The bot automatically includes context from Discord messages when you reply to a message and use a command. This helps agents understand the full conversation context.

### How to Use Context

1. **Reply to a message** in your Discord channel (right-click → Reply, or hover and click reply icon)
2. **Use `/agent create`** or `/agent followup` in your reply
3. The bot will automatically include the referenced message as context

### What Gets Included

When you reply to a message, the agent receives:
- The original message content
- Author information
- Any attachments (URLs and filenames)
- Embed information

### Example

```
User A: "The login button isn't working on mobile devices"
      ↓
User B: [Replies to User A's message]
        /agent create prompt: "Fix the login button issue"
        repository: https://github.com/org/repo
```

The agent will see:
```
=== CHANNEL CONTEXT ===

Message from @UserA:
The login button isn't working on mobile devices

=== USER TASK ===

Fix the login button issue
```

💡 **Tip:** This works for both `/agent create` and `/agent followup` commands!

## Privacy Mode

For personal/private deployments, you can enable **Privacy Mode** to make your bot deployment completely hidden:

### What is Privacy Mode?

When `PRIVATE_MODE=true` is set:
- ✅ Homepage returns **404** (no landing page visible)
- ✅ **robots.txt** blocks all search engine crawlers
- ✅ **Security headers** prevent embedding and indexing
- ✅ **Referrer policy** prevents URL leaking
- ✅ Deployment is **not discoverable** via search engines

### How to Enable

**In Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add: `PRIVATE_MODE` = `true`
3. Redeploy your project

**In .env.local (for local testing):**
```bash
PRIVATE_MODE=true
```

### Public vs Private Mode

| Feature | Public Mode (default) | Private Mode |
|---------|----------------------|--------------|
| Homepage | ✅ Shows landing page | ❌ Returns 404 |
| Search Engines | ✅ Can index | ❌ Blocked |
| Discovery | ✅ Findable | ❌ Hidden |
| Security Headers | ⚠️ Basic | ✅ Strict |
| Use Case | Demo/public bots | Personal deployments |

**💡 Tip:** Use Private Mode if you want your deployment URL to remain completely hidden and undiscoverable.

## Architecture

This is a **self-hosted** solution:

- Each Discord server admin deploys their own instance
- Uses their own Cursor API token
- Independent rate limits and quotas
- Full control over data and configuration

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- Discord Interactions API
- Cursor Cloud Agents API
- Vercel Serverless Functions

## Resources

- 🔧 [Cursor API Documentation](https://cursor.com/docs/cloud-agent/api/endpoints)
- 🤖 [Discord Bot Guide](https://discord.com/developers/docs)

## Security

- Discord native permission system
- Ed25519 signature verification
- Environment variable secrets
- No data persistence (stateless)

## Troubleshooting

### "Application did not respond"
**Cause:** Vercel function timeout or crash
- Check Vercel Dashboard → Your Project → Logs for errors
- Verify all 4 environment variables are set in Vercel
- Confirm endpoint URL: `https://your-project.vercel.app/api/discord`

### Commands not showing in Discord
**Cause:** Not registered or missing permissions
- Re-run: `npm run register-commands`
- Verify bot has `applications.commands` scope
- Try removing and re-inviting bot with correct OAuth2 scopes

### 401 Unauthorized errors
**Cause:** Invalid Discord Public Key
- Verify `DISCORD_PUBLIC_KEY` in Vercel matches Discord Portal exactly
- No extra spaces or characters
- Redeploy after fixing

### 404 Agent not found
- Run `/agent list` to verify agent IDs
- Agent IDs start with `bc_` (e.g., `bc_abc123`)

### Rate limit errors (429)
- `/agent repos`: Limited to 1/min, 30/hour - wait before retry
- Other commands: Retry after short delay

### Environment variables not loading
**Local:** Create `.env.local` from `.env.local.example`
**Vercel:** Set via Dashboard → Settings → Environment Variables

### Cursor API errors
Check preparation steps above. No available requests or funds in your Cursor account, enable on-demand usage in Cursor settings.

## Contributing

This is an open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- 🐛 [Report Issues](https://github.com/codeisalifestyle/cursor-discord-bot/issues)
- 💬 [Discussions](https://github.com/codeisalifestyle/cursor-discord-bot/discussions)

---

**Built for the Cursor community** 🚀

