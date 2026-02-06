import React, { useState } from 'react';
import { X, Lock, Users, CreditCard, Gift, Check, Copy, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import SubscriptionModal from './SubscriptionModal';
import ReferralWidget from './ReferralWidget';

export default function PaywallOverlay({ isVisible, onClose, onSuccess }) {
  const {
    referralCode,
    referralCount,
    referralsNeeded,
    activateTylersFriend,
    bypassPaywall
  } = useSubscription();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('subscribe'); // 'subscribe' or 'refer'

  if (!isVisible || bypassPaywall) return null;

  const handlePaymentSuccess = (stripeData) => {
    setShowPaymentModal(false);
    onSuccess?.(stripeData);
  };

  const handleTylersFriend = () => {
    activateTylersFriend();
    onClose?.();
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-accent-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Unlock Your Full Program</h2>
            <p className="text-gray-400">
              Your personalized training program is ready! Subscribe to access all features.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-dark-600">
            <button
              onClick={() => setActiveTab('subscribe')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'subscribe'
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-dark-700/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Subscribe
            </button>
            <button
              onClick={() => setActiveTab('refer')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'refer'
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-dark-700/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Refer Friends
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'subscribe' ? (
              <div className="space-y-4">
                {/* Price Card */}
                <div className="bg-dark-700 rounded-xl p-6 text-center border border-dark-500">
                  <div className="text-4xl font-bold text-white mb-1">
                    $5<span className="text-lg font-normal text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Cancel anytime</p>

                  <ul className="text-left space-y-2 mb-6">
                    {[
                      'Full access to your custom program',
                      'Personalized meal plans & recipes',
                      'Progress tracking & analytics',
                      'Workout logging with weight recommendations',
                      'Shopping list with Instacart integration'
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

                  <p className="text-xs text-gray-500 mt-3">
                    Secure payment via Stripe. Supports Apple Pay, Google Pay & cards.
                  </p>
                </div>
              </div>
            ) : (
              <ReferralWidget
                referralCode={referralCode}
                referralCount={referralCount}
                referralsNeeded={referralsNeeded}
                onReferralComplete={onSuccess}
              />
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-800 text-gray-500">or</span>
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
            <p className="text-xs text-gray-500 text-center mt-2">
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
