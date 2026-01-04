import { notFound } from 'next/navigation';

// Force dynamic rendering to check env variables
export const dynamic = 'force-dynamic';

export default function Home() {
  // Privacy mode: If PRIVATE_MODE is enabled, return 404
  if (process.env.PRIVATE_MODE === 'true') {
    notFound();
  }

  // Default: Show landing page
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🤖 Cursor Discord Bot
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          Manage Cursor Cloud Agents directly from Discord
        </p>
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: 0 }}>
            ✅ Bot is running and ready to receive Discord interactions
          </p>
        </div>
        <div style={{ marginTop: '2rem', opacity: 0.8 }}>
          <a 
            href="https://github.com/codeisalifestyle/cursor-discord-bot" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'white', textDecoration: 'underline' }}
          >
            View Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
