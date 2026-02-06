// Vercel Serverless Function: Create Stripe Checkout Session
// Endpoint: POST /api/stripe/create-checkout-session

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for Stripe secret key
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({
      error: 'Stripe not configured. Add STRIPE_SECRET_KEY to environment variables.'
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16'
  });

  try {
    const { priceId, successUrl, cancelUrl, userId, email } = req.body;

    // Use default price ID if not provided
    const stripePriceId = priceId || process.env.STRIPE_PRICE_ID;
    if (!stripePriceId) {
      return res.status(400).json({
        error: 'Price ID not configured. Create a $5/month product in Stripe and add STRIPE_PRICE_ID.'
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}`,
      customer_email: email,
      metadata: {
        userId: userId || 'anonymous'
      },
      // Enable additional payment methods
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session'
        }
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: 'required',
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session'
    });
  }
}
