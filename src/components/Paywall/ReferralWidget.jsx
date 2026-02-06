import React, { useState } from 'react';
import { Copy, Check, Users, Share2, Gift } from 'lucide-react';

export default function ReferralWidget({
  referralCode,
  referralCount,
  referralsNeeded,
  onReferralComplete
}) {
  const [copied, setCopied] = useState(false);

  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : null;

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MOTUS - AI-Powered Fitness',
          text: 'Check out MOTUS! Get a personalized training program powered by AI.',
          url: referralLink
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const progress = (referralCount / 3) * 100;

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-dark-700 rounded-xl p-5 border border-dark-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-accent-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Get 1 Month Free!</h3>
            <p className="text-sm text-gray-400">Refer 3 friends to unlock</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-white font-medium">{referralCount}/3 friends</span>
          </div>
          <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-secondary to-accent-primary transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          {referralsNeeded > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {referralsNeeded} more referral{referralsNeeded > 1 ? 's' : ''} to unlock your first month free!
            </p>
          )}
          {referralsNeeded === 0 && (
            <p className="text-xs text-accent-success mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Congratulations! Your first month is free!
            </p>
          )}
        </div>

        {/* Referral Code */}
        {referralCode && (
          <div className="space-y-3">
            <label className="text-sm text-gray-400">Your referral link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-dark-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono truncate">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                  copied
                    ? 'bg-accent-success/20 text-accent-success'
                    : 'bg-dark-600 hover:bg-dark-500 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-3 px-4 bg-accent-secondary/20 hover:bg-accent-secondary/30 text-accent-secondary rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
        <h4 className="text-sm font-medium text-white mb-3">How it works</h4>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-xs text-white flex-shrink-0">1</span>
            Share your unique link with friends
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-xs text-white flex-shrink-0">2</span>
            They sign up and create their program
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-xs text-white flex-shrink-0">3</span>
            After 3 sign-ups, your first month is unlocked!
          </li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          Note: Referral bonus applies to first month only. After that, subscribe to continue.
        </p>
      </div>
    </div>
  );
}
