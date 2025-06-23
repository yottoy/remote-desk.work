import { Analytics } from '@vercel/analytics/react';

export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>ClickClickJob - Vercel Analytics Test</h1>
      <p>This is a successful test deployment with Vercel Analytics integration.</p>
      
      <h2>Deployment Status</h2>
      <ul>
        <li>✅ Vercel Analytics successfully integrated</li>
        <li>✅ Simple test deployment working</li>
        <li>✅ Ready for full app deployment</li>
      </ul>
      
      <h2>Next Steps</h2>
      <ol>
        <li>Configure MongoDB environment variables in Vercel project settings</li>
        <li>Deploy main application</li>
        <li>Verify analytics data collection</li>
      </ol>
      
      <p style={{ marginTop: '40px', color: '#666', fontSize: '14px' }}>
        Deployed on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </p>
      
      <Analytics />
    </div>
  );
} 