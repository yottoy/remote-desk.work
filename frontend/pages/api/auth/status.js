// Authentication System (Task 5A) - Status endpoint
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (req.method === 'GET') {
      // Check if user is authenticated
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'No authentication token provided',
          message: 'Please provide a valid authentication token',
          loginUrl: '/api/auth/login'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // In production, this would validate the JWT token
      // For now, we'll mock a response
      if (token === 'demo-token') {
        res.status(200).json({
          success: true,
          authenticated: true,
          user: {
            id: '1',
            email: 'admin@clickclickjob.com',
            role: 'admin',
            name: 'Admin User',
            permissions: ['content:read', 'content:write', 'analytics:read', 'users:manage']
          },
          tokenValid: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          message: 'User authenticated successfully'
        });
      } else {
        res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Invalid token',
          message: 'Authentication token is invalid or expired',
          loginUrl: '/api/auth/login'
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'OPTIONS']);
      res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`,
        allowedMethods: ['GET', 'OPTIONS']
      });
    }
  } catch (error) {
    console.error('Auth Status API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check authentication status',
      timestamp: new Date().toISOString()
    });
  }
} 