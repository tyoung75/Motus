// Garmin OAuth 1.0a Token Exchange
// POST /api/auth/garmin/token

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { oauthToken, oauthVerifier, tokenSecret } = req.body;

  if (!oauthToken || !oauthVerifier) {
    return res.status(400).json({ error: 'Missing OAuth parameters' });
  }

  const consumerKey = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: 'Garmin not configured on server' });
  }

  try {
    const accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';

    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_token: oauthToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
      oauth_verifier: oauthVerifier
    };

    // Create signature base string
    const sortedParams = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');

    const signatureBaseString = `POST&${encodeURIComponent(accessTokenUrl)}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;

    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    oauthParams.oauth_signature = signature;

    // Create Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Garmin access token error:', error);
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);

    // In production, store these tokens securely server-side
    return res.status(200).json({
      connected: true,
      userId: params.get('user_id')
    });
  } catch (error) {
    console.error('Garmin token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
