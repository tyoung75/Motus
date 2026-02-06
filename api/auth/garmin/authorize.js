// Garmin OAuth 1.0a Authorization
// GET /api/auth/garmin/authorize

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state } = req.query;
  const consumerKey = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: 'Garmin not configured on server' });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/api/auth/garmin/callback`;

  try {
    // Step 1: Get request token from Garmin
    const requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';

    const oauthParams = {
      oauth_consumer_key: consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
      oauth_callback: callbackUrl
    };

    // Create signature base string
    const sortedParams = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');

    const signatureBaseString = `POST&${encodeURIComponent(requestTokenUrl)}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&`;

    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');

    oauthParams.oauth_signature = signature;

    // Create Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    const response = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Garmin request token error:', error);
      return res.status(400).json({ error: 'Failed to get request token' });
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    // Store token secret for later (in production, use a proper session store)
    // For now, we'll encode it in the state
    const encodedState = Buffer.from(JSON.stringify({
      originalState: state,
      tokenSecret: oauthTokenSecret
    })).toString('base64');

    // Step 2: Redirect user to Garmin authorization
    const authorizeUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${oauthToken}&oauth_callback=${encodeURIComponent(callbackUrl)}&state=${encodedState}`;

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Garmin authorize error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
