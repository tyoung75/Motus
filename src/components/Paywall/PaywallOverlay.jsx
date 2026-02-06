import React, { useState } from 'react';
import { Lock, Users, CreditCard, Gift, Check, Copy, Share2, Mail, Instagram, Send, Sparkles, X } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import SubscriptionModal from './SubscriptionModal';

export default function PaywallOverlay({ isVisible, onClose, onSuccess, program }) {
  const {
    referralCode,
    referralCount,
    referralsNeeded,
    activateTylersFriend,
    bypassPaywall
  } = useSubscription();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState(['', '', '']);
  const [emailsSent, setEmailsSent] = useState(false);
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [shareMethod, setShareMethod] = useState(null); // 'email', 'dm', 'story'

  if (!isVisible || bypassPaywall) return null;

  const handlePaymentSuccess = (stripeData) => {
    setShowPaymentModal(false);
    onSuccess?.(stripeData);
  };

  const handleTylersFriend = () => {
    activateTylersFriend();
    onClose?.();
  };

  const appUrl = window.location.origin;
  const referralLink = referralCode
    ? `${appUrl}?ref=${referralCode}`
    : appUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Email handling
  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validEmails = emails.filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSendEmails = async () => {
    if (validEmails.length === 0) return;

    // In production, this would call an API to send emails
    // For now, open mailto with all emails
    const subject = encodeURIComponent("Join me on MOTUS - Your AI Fitness Coach");
    const body = encodeURIComponent(
      `Hey! I've been using MOTUS to crush my fitness goals and thought you'd love it too.\n\n` +
      `It creates personalized workout and meal plans just for you.\n\n` +
      `Sign up here: ${referralLink}\n\n` +
      `Let's get after it! 💪`
    );
    window.open(`mailto:${validEmails.join(',')}?subject=${subject}&body=${body}`);
    setEmailsSent(true);
  };

  // Social sharing
  const handleInstagramDM = () => {
    // Instagram doesn't have a direct DM API, so we copy the link and open Instagram
    navigator.clipboard.writeText(
      `🏋️ Join me on MOTUS! Get your personalized AI fitness program: ${referralLink}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Open Instagram (will open app on mobile)
    window.open('https://instagram.com/direct/inbox/', '_blank');
  };

  const handleTikTokDM = () => {
    navigator.clipboard.writeText(
      `🔥 MOTUS is changing my fitness game! Get your free personalized program: ${referralLink}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open('https://www.tiktok.com/messages', '_blank');
  };

  const handleInstagramStory = () => {
    setShowStoryPreview(true);
  };

  // Generate program summary for story
  const getProgramSummary = () => {
    if (!program) return { goal: 'Fitness', duration: '12 weeks', type: 'Custom Program' };
    return {
      goal: program.goal?.primary || 'Build Strength',
      duration: `${program.duration || 12} weeks`,
      type: program.type === 'strength' ? 'Powerbuilding' :
            program.type === 'endurance' ? 'Endurance' : 'Hybrid Training',
      phase: program.phase || 'Base'
    };
  };

  const programSummary = getProgramSummary();

  const completedReferrals = referralCount || 0;
  const progress = (completedReferrals / 3) * 100;

  return (
    <>
      {/* Backdrop with blur */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="relative bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-5 text-center flex-shrink-0">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-accent-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Unlock Your Full Program</h2>
            <p className="text-gray-400 text-sm">
              Your personalized training program is ready!
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Option 1: Subscribe */}
            <div className="bg-dark-700 rounded-xl p-4 border border-dark-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent-primary" />
                  Subscribe
                </h3>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">$5</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>

              <ul className="space-y-1.5 mb-3 text-sm">
                {[
                  'Full access to your custom program',
                  'Personalized meal plans & recipes',
                  'Progress tracking & analytics'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-accent-success flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-2.5 px-4 bg-accent-primary hover:bg-accent-primary/90 text-dark-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Subscribe Now
              </button>
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

            {/* Option 2: Refer Friends - Enhanced */}
            <div className="bg-gradient-to-br from-dark-700 to-dark-700/50 rounded-xl p-4 border border-accent-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-secondary" />
                  Share With Friends
                </h3>
                <span className="bg-accent-success/20 text-accent-success text-xs font-bold px-2 py-1 rounded-full">
                  1st Month FREE
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-3">
                Share with 3 friends or post to your Story to unlock your first month free!
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">{completedReferrals}/3</span>
                </div>
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-secondary to-accent-success rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Share Method Selection */}
              {!shareMethod ? (
                <div className="space-y-2">
                  {/* Instagram Story - Most Prominent */}
                  <button
                    onClick={handleInstagramStory}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Instagram className="w-5 h-5" />
                    Share to Instagram Story
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-center text-accent-success font-medium">
                    ⭐ Instant unlock with Story post!
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => setShareMethod('email')}
                      className="py-2.5 px-3 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Email Friends
                    </button>
                    <button
                      onClick={handleInstagramDM}
                      className="py-2.5 px-3 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      Send DMs
                    </button>
                  </div>

                  {copied && (
                    <p className="text-xs text-center text-accent-success mt-2">
                      ✓ Message copied! Paste it in your DMs
                    </p>
                  )}
                </div>
              ) : shareMethod === 'email' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setShareMethod(null)}
                    className="text-xs text-gray-400 hover:text-white mb-1"
                  >
                    ← Back to options
                  </button>

                  {emails.map((email, i) => (
                    <input
                      key={i}
                      type="email"
                      placeholder={`Friend ${i + 1}'s email`}
                      value={email}
                      onChange={(e) => handleEmailChange(i, e.target.value)}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-accent-secondary"
                    />
                  ))}

                  <button
                    onClick={handleSendEmails}
                    disabled={validEmails.length === 0}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      validEmails.length > 0
                        ? 'bg-accent-secondary hover:bg-accent-secondary/90 text-dark-900'
                        : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {emailsSent ? 'Emails Sent!' : `Send to ${validEmails.length} friend${validEmails.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              ) : null}

              {/* Copy Link Fallback */}
              <button
                onClick={handleCopyLink}
                className="w-full mt-3 py-2 px-3 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Link Copied!' : 'Or copy referral link'}
              </button>
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
              className="w-full py-2.5 px-4 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 border border-dark-500 text-sm"
            >
              <Gift className="w-4 h-4 text-accent-secondary" />
              I'm Tyler's Friend
            </button>
          </div>
        </div>
      </div>

      {/* Instagram Story Preview Modal */}
      {showStoryPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
          <div className="relative w-full max-w-sm bg-dark-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowStoryPreview(false)}
              className="absolute top-3 right-3 z-10 p-1 bg-black/50 rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Story Preview */}
            <div className="aspect-[9/16] bg-gradient-to-br from-dark-900 via-accent-primary/20 to-accent-secondary/20 p-6 flex flex-col justify-between relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-accent-primary rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-secondary rounded-full blur-3xl"></div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-accent-primary font-bold text-lg mb-1">MOTUS</div>
                <p className="text-gray-400 text-xs">AI-Powered Fitness</p>
              </div>

              <div className="relative z-10 text-center py-8">
                <h3 className="text-white text-2xl font-bold mb-2">
                  Starting My
                </h3>
                <div className="text-accent-primary text-3xl font-black mb-4">
                  {programSummary.type}
                </div>
                <div className="text-white text-xl font-semibold mb-1">
                  Journey
                </div>
                <div className="flex items-center justify-center gap-4 mt-6 text-sm">
                  <div className="text-center">
                    <div className="text-accent-primary font-bold">{programSummary.duration}</div>
                    <div className="text-gray-400 text-xs">Program</div>
                  </div>
                  <div className="w-px h-8 bg-dark-600"></div>
                  <div className="text-center">
                    <div className="text-accent-secondary font-bold">{programSummary.goal}</div>
                    <div className="text-gray-400 text-xs">Goal</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center">
                <div className="inline-block bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-3">
                  <span className="text-white text-sm font-medium">Join me 👇</span>
                </div>
                <div className="text-accent-primary font-bold text-sm">
                  motus.fit
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <p className="text-gray-400 text-xs text-center mb-2">
                Screenshot this and share to your Instagram Story!
              </p>
              <button
                onClick={() => {
                  // In production, this would generate and download the image
                  // For now, we'll prompt the user to screenshot
                  alert('Take a screenshot of this preview and share it to your Instagram Story!\n\nOnce posted, your first month will be unlocked.');
                  setShowStoryPreview(false);
                  // Simulate completion for demo
                  // In production, we'd verify the post via Instagram API
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <Instagram className="w-5 h-5" />
                I've Posted to My Story
              </button>
              <button
                onClick={() => setShowStoryPreview(false)}
                className="w-full py-2 text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      <SubscriptionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
