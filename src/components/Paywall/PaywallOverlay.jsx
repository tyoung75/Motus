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
  const [shareMethod, setShareMethod] = useState(null);

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

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validEmails = emails.filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSendEmails = async () => {
    if (validEmails.length === 0) return;
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

  const handleInstagramDM = () => {
    navigator.clipboard.writeText(
      `🏋️ Join me on MOTUS! Get your personalized AI fitness program: ${referralLink}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open('https://instagram.com/direct/inbox/', '_blank');
  };

  const handleInstagramStory = () => {
    setShowStoryPreview(true);
  };

  // Generate program summary for story - use actual program data
  const getProgramSummary = () => {
    if (!program) {
      return {
        name: 'Fitness Program',
        duration: '12 weeks',
        description: 'Personalized fitness and nutrition program'
      };
    }

    // Use actual program name if available
    const programName = program.name || program.title ||
      (program.goal?.primary === 'endurance' ? 'Running Program' :
       program.goal?.primary === 'strength' ? 'Strength Program' :
       'Fitness Program');

    const duration = program.duration ? `${program.duration} week` : '12 week';

    // Generate description based on primary goal - NO PII
    let description = '';
    const goal = program.goal?.primary?.toLowerCase() || '';

    if (goal.includes('endurance') || goal.includes('running') || goal.includes('cardio')) {
      description = 'Personalized endurance and cardio program';
    } else if (goal.includes('strength') || goal.includes('muscle') || goal.includes('power')) {
      description = 'Personalized strength and muscle building program';
    } else if (goal.includes('weight') || goal.includes('fat') || goal.includes('lean')) {
      description = 'Personalized body composition program';
    } else if (goal.includes('hybrid') || goal.includes('general')) {
      description = 'Personalized hybrid training program';
    } else {
      description = 'Personalized fitness and nutrition program';
    }

    return {
      name: programName,
      duration,
      description
    };
  };

  const programSummary = getProgramSummary();
  const completedReferrals = referralCount || 0;
  const progress = (completedReferrals / 3) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-600 overflow-hidden max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-4 text-center flex-shrink-0">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent-primary" />
            </div>
            <h2 className="text-lg font-bold text-white">Unlock Your Full Program</h2>
            <p className="text-gray-400 text-xs">Your personalized training program is ready!</p>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3 pb-6">
            {/* Subscribe Option */}
            <div className="bg-dark-700 rounded-xl p-3 border border-dark-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent-primary" />
                  Subscribe
                </h3>
                <div>
                  <span className="text-lg font-bold text-white">$5</span>
                  <span className="text-gray-400 text-xs">/mo</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-2 px-4 bg-accent-primary hover:bg-accent-primary/90 text-dark-900 font-semibold rounded-lg text-sm"
              >
                Subscribe Now
              </button>
            </div>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-dark-800 text-gray-500 text-xs">or</span>
              </div>
            </div>

            {/* Share Option */}
            <div className="bg-dark-700/50 rounded-xl p-3 border border-accent-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-secondary" />
                  Share With Friends
                </h3>
                <span className="bg-accent-success/20 text-accent-success text-[10px] font-bold px-2 py-0.5 rounded-full">
                  FREE MONTH
                </span>
              </div>

              <p className="text-gray-400 text-xs mb-2">
                Share with 3 friends or post to your Story!
              </p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{completedReferrals}/3</span>
                </div>
                <div className="h-1 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-secondary to-accent-success rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {!shareMethod ? (
                <div className="space-y-2">
                  <button
                    onClick={handleInstagramStory}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    <Instagram className="w-4 h-4" />
                    Share to Story
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <p className="text-[10px] text-center text-accent-success">⭐ Instant unlock!</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShareMethod('email')}
                      className="py-2 px-2 bg-dark-600 text-white rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </button>
                    <button
                      onClick={handleInstagramDM}
                      className="py-2 px-2 bg-dark-600 text-white rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      DMs
                    </button>
                  </div>
                  {copied && <p className="text-[10px] text-center text-accent-success">✓ Copied!</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => setShareMethod(null)} className="text-[10px] text-gray-400">
                    ← Back
                  </button>
                  {emails.map((email, i) => (
                    <input
                      key={i}
                      type="email"
                      placeholder={`Friend ${i + 1}'s email`}
                      value={email}
                      onChange={(e) => handleEmailChange(i, e.target.value)}
                      className="w-full px-2 py-1.5 bg-dark-600 border border-dark-500 rounded text-white placeholder-gray-500 text-xs"
                    />
                  ))}
                  <button
                    onClick={handleSendEmails}
                    disabled={validEmails.length === 0}
                    className={`w-full py-2 rounded text-xs font-medium ${
                      validEmails.length > 0
                        ? 'bg-accent-secondary text-dark-900'
                        : 'bg-dark-600 text-gray-500'
                    }`}
                  >
                    {emailsSent ? 'Sent!' : `Send to ${validEmails.length}`}
                  </button>
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="w-full mt-2 py-1 text-gray-400 text-[10px] flex items-center justify-center gap-1"
              >
                <Copy className="w-2.5 h-2.5" />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-dark-800 text-gray-500 text-xs">or</span>
              </div>
            </div>

            {/* Tyler's Friend */}
            <button
              onClick={handleTylersFriend}
              className="w-full py-2.5 px-4 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg flex items-center justify-center gap-2 border border-dark-500 text-sm"
            >
              <Gift className="w-4 h-4 text-accent-secondary" />
              I'm Tyler's Friend
            </button>
          </div>
        </div>
      </div>

      {/* Instagram Story Preview */}
      {showStoryPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
          <div className="relative w-full max-w-xs bg-dark-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowStoryPreview(false)}
              className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Story Content */}
            <div className="aspect-[9/16] bg-gradient-to-br from-dark-900 via-accent-primary/10 to-accent-secondary/10 p-5 flex flex-col justify-between relative">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-5 w-24 h-24 bg-accent-primary rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-5 w-32 h-32 bg-accent-secondary rounded-full blur-3xl"></div>
              </div>

              {/* Top */}
              <div className="relative z-10">
                <div className="text-accent-primary font-bold text-base">MOTUS</div>
                <p className="text-gray-500 text-[10px]">AI-Powered Fitness</p>
              </div>

              {/* Center */}
              <div className="relative z-10 text-center">
                <p className="text-gray-400 text-xs mb-1">Starting my</p>
                <h3 className="text-white text-xl font-bold mb-1">
                  {programSummary.duration}
                </h3>
                <div className="text-accent-primary text-2xl font-black mb-3">
                  {programSummary.name}
                </div>
                <p className="text-gray-400 text-xs px-4">
                  {programSummary.description}
                </p>
              </div>

              {/* Bottom */}
              <div className="relative z-10 text-center">
                <div className="inline-block bg-white/10 px-3 py-1.5 rounded-full mb-2">
                  <span className="text-white text-xs">Join me 👇</span>
                </div>
                <div className="text-accent-primary font-bold text-sm">motus.fit</div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-2">
              <p className="text-gray-400 text-[10px] text-center">
                Screenshot and share to your Story!
              </p>
              <button
                onClick={() => {
                  alert('Screenshot this and share to Instagram Story!\nYour free month will be unlocked.');
                  setShowStoryPreview(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2"
              >
                <Instagram className="w-4 h-4" />
                I've Posted to My Story
              </button>
              <button
                onClick={() => setShowStoryPreview(false)}
                className="w-full py-1.5 text-gray-400 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
