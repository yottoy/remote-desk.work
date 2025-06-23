// Job Alert System (Task 5B) - Subscription endpoint
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
    switch (req.method) {
      case 'POST':
        const { email, preferences } = req.body;

        // Validate required fields
        if (!email || !preferences) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'Email and preferences are required',
            required: ['email', 'preferences']
          });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email format',
            message: 'Please provide a valid email address'
          });
        }

        // Mock subscription creation
        const subscription = {
          id: Date.now().toString(),
          email,
          preferences: {
            keywords: preferences.keywords || [],
            categories: preferences.categories || [],
            salaryRange: preferences.salaryRange || null,
            frequency: preferences.frequency || 'weekly',
            location: preferences.location || null
          },
          status: 'pending_verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          verificationToken: Math.random().toString(36).substring(2, 15),
          lastEmailSent: null,
          totalEmailsSent: 0
        };

        // In production, this would:
        // 1. Save to database
        // 2. Send verification email
        // 3. Set up alert scheduling

        res.status(201).json({
          success: true,
          data: {
            subscriptionId: subscription.id,
            email: subscription.email,
            status: subscription.status,
            preferences: subscription.preferences
          },
          message: 'Subscription created successfully. Please check your email for verification.',
          timestamp: new Date().toISOString()
        });
        break;

      case 'GET':
        // Get subscription status (would require auth token in production)
        const { email: queryEmail, token } = req.query;
        
        if (!queryEmail) {
          return res.status(400).json({
            success: false,
            error: 'Email parameter required',
            message: 'Please provide email parameter'
          });
        }

        // Mock subscription lookup
        res.status(200).json({
          success: true,
          data: {
            email: queryEmail,
            status: 'active',
            preferences: {
              keywords: ['remote', 'admin'],
              categories: ['administrative-assistant'],
              frequency: 'weekly'
            },
            totalEmailsSent: 12,
            lastEmailSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          message: 'Subscription status retrieved successfully'
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
        res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
          allowedMethods: ['GET', 'POST', 'OPTIONS']
        });
    }
  } catch (error) {
    console.error('Job Alerts API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process subscription request',
      timestamp: new Date().toISOString()
    });
  }
} 