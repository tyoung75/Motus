// Strava OAuth Token Exchange
// POST /api/auth/strava/token

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Strava not configured on server' });
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Strava token error:', error);
      return res.status(400).json({ error: 'Failed to exchange token', details: error });
    }

    const data = await response.json();

    // Return athlete info and tokens
    // Note: In production, you'd store tokens securely server-side
    return res.status(200).json({
      athlete: data.athlete,
      expires_at: data.expires_at,
      // Don't send actual tokens to client - store them server-side
      connected: true
    });
  } catch (error) {
    console.error('Strava token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
