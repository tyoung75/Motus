import React, { useState } from 'react';
import { X, CreditCard, Loader2, AlertCircle, Check } from 'lucide-react';

// Note: Stripe integration requires these packages and environment variables:
// npm install @stripe/react-stripe-js @stripe/stripe-js
// VITE_STRIPE_PUBLIC_KEY=pk_test_...
// STRIPE_PRICE_ID=price_... (create in Stripe dashboard)

export default function SubscriptionModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  const isStripeConfigured = !!stripePublicKey;

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isStripeConfigured) {
        // Demo mode - simulate successful subscription
        setTimeout(() => {
          onSuccess?.({
            customerId: 'demo_customer_' + Date.now(),
            subscriptionId: 'demo_sub_' + Date.now(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          setLoading(false);
        }, 1500);
        return;
      }

      // Real Stripe flow - redirect to Checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          successUrl: `${window.location.origin}/subscription-success`,
          cancelUrl: window.location.href
        })
      });

      const { url, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to process subscription');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-md bg-dark-800 rounded-xl shadow-2xl border border-dark-600 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <h3 className="text-lg font-semibold text-white">Subscribe to MOTUS</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Details */}
          <div className="bg-dark-700 rounded-xl p-4 mb-6 border border-dark-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">MOTUS Premium</span>
              <span className="text-accent-primary font-bold">$5/month</span>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent-success" />
                Personalized training program
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent-success" />
                Custom meal plans & recipes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent-success" />
                Progress tracking & analytics
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Accepted payment methods</p>
            <div className="flex gap-2">
              {/* Apple Pay */}
              <div className="flex-1 bg-dark-700 rounded-lg p-3 flex items-center justify-center border border-dark-500">
                <svg className="h-6" viewBox="0 0 50 20" fill="white">
                  <path d="M9.5 5.3c-.5.6-1.3 1.1-2.1 1-.1-.8.3-1.6.7-2.1.5-.6 1.4-1 2-1 .1.8-.2 1.6-.6 2.1zm.6 1.1c-1.2-.1-2.2.7-2.7.7-.6 0-1.4-.6-2.4-.6-1.2 0-2.3.7-2.9 1.8-1.3 2.2-.3 5.4.9 7.2.6.9 1.3 1.8 2.3 1.8.9 0 1.3-.6 2.4-.6 1.1 0 1.4.6 2.4.6 1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2-.1 0-1.9-.7-1.9-2.9 0-1.8 1.5-2.7 1.6-2.8-.9-1.3-2.3-1.4-2.9-1.4z"/>
                </svg>
                <span className="ml-1 text-white text-sm font-medium">Pay</span>
              </div>

              {/* Google Pay */}
              <div className="flex-1 bg-dark-700 rounded-lg p-3 flex items-center justify-center border border-dark-500">
                <svg className="h-5" viewBox="0 0 40 16" fill="white">
                  <path d="M19.6 7.8v4.5h-1.4V3h3.7c.9 0 1.7.3 2.3.9.6.6.9 1.3.9 2.2 0 .9-.3 1.6-.9 2.2-.6.6-1.4.9-2.3.9h-2.3zm0-3.5v2.3h2.4c.5 0 .9-.2 1.2-.5.3-.3.5-.7.5-1.2s-.2-.9-.5-1.2c-.3-.3-.7-.5-1.2-.5h-2.4z"/>
                </svg>
              </div>

              {/* Card */}
              <div className="flex-1 bg-dark-700 rounded-lg p-3 flex items-center justify-center border border-dark-500">
                <CreditCard className="w-5 h-5 text-white" />
                <span className="ml-1 text-white text-sm">Card</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-dark-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Subscribe - $5/month
              </>
            )}
          </button>

          {/* Demo Mode Notice */}
          {!isStripeConfigured && (
            <p className="text-xs text-amber-400 text-center mt-3">
              ⚠️ Demo mode: Stripe not configured. Add VITE_STRIPE_PUBLIC_KEY to enable real payments.
            </p>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            You can cancel anytime from your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
}
