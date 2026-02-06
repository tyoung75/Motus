// Garmin OAuth 1.0a Callback
// GET /api/auth/garmin/callback

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { oauth_token, oauth_verifier, state } = req.query;

  if (!oauth_token || !oauth_verifier) {
    return res.status(400).json({ error: 'Missing OAuth parameters' });
  }

  // Redirect back to app with the tokens
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const redirectUrl = `${baseUrl}/auth/garmin/complete?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}&state=${state || ''}`;

  res.redirect(redirectUrl);
}
