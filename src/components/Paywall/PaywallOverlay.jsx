import React, { useState } from 'react';
import { Lock, Users, CreditCard, Gift, Check, Copy, Share2 } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import SubscriptionModal from './SubscriptionModal';

export default function PaywallOverlay({ isVisible, onClose, onSuccess }) {
  const {
    referralCode,
    referralCount,
    referralsNeeded,
    activateTylersFriend,
    bypassPaywall
  } = useSubscription();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isVisible || bypassPaywall) return null;

  const handlePaymentSuccess = (stripeData) => {
    setShowPaymentModal(false);
    onSuccess?.(stripeData);
  };

  const handleTylersFriend = () => {
    activateTylersFriend();
    onClose?.();
  };

  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : null;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Join MOTUS',
          text: 'Get your personalized fitness program!',
          url: referralLink
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const completedReferrals = referralCount || 0;
  const progress = (completedReferrals / 3) * 100;

  return (
    <>
      {/* Backdrop with blur */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="relative bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-6 text-center flex-shrink-0">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-accent-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Unlock Your Full Program</h2>
            <p className="text-gray-400 text-sm">
              Your personalized training program is ready!
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Option 1: Subscribe */}
            <div className="bg-dark-700 rounded-xl p-5 border border-dark-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent-primary" />
                  Subscribe
                </h3>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">$5</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {[
                  'Full access to your custom program',
                  'Personalized meal plans & recipes',
                  'Progress tracking & analytics',
                  'Workout logging with weight recommendations'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-accent-success flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 px-6 bg-accent-primary hover:bg-accent-primary/90 text-dark-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Subscribe Now
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Apple Pay, Google Pay & cards accepted
              </p>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-dark-800 text-gray-500">or</span>
              </div>
            </div>

            {/* Option 2: Refer Friends */}
            <div className="bg-dark-700 rounded-xl p-5 border border-dark-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-secondary" />
                  Refer 3 Friends
                </h3>
                <span className="bg-accent-success/20 text-accent-success text-xs font-semibold px-2 py-1 rounded-full">
                  1st Month FREE
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Invite 3 friends to sign up and get your first month completely free!
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">{completedReferrals}/3 friends</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-secondary to-accent-success rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Share Buttons */}
              {referralCode ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 px-4 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-2.5 px-4 bg-accent-secondary hover:bg-accent-secondary/90 text-dark-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  Sign in to get your referral link
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-dark-800 text-gray-500">or</span>
              </div>
            </div>

            {/* Tyler's Friend Bypass */}
            <button
              onClick={handleTylersFriend}
              className="w-full py-3 px-4 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 border border-dark-500"
            >
              <Gift className="w-5 h-5 text-accent-secondary" />
              I'm Tyler's Friend
            </button>
            <p className="text-xs text-gray-500 text-center">
              Special access for friends & family
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      <SubscriptionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
