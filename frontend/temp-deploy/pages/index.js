import { Analytics } from '@vercel/analytics/react';

export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Deployment</h1>
      <p>This is a test deployment with Vercel Analytics.</p>
      <Analytics />
    </div>
  );
}
