import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setStatus('sending');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || null,
          category,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      setStatus('sent');
      setTimeout(() => {
        setIsOpen(false);
        setFeedback('');
        setEmail('');
        setCategory('general');
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Feedback error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <>
      {/* Floating side tab - minimal, rotated text */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40
            bg-accent-primary/90 hover:bg-accent-primary
            text-dark-900 font-semibold text-xs
            px-2 py-3 rounded-l-lg
            shadow-lg shadow-black/30
            transition-all duration-200 hover:px-3
            flex items-center gap-1"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          aria-label="Send feedback"
        >
          <MessageSquare className="w-3 h-3 rotate-90" />
          Feedback
        </button>
      )}

      {/* Feedback modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
            onClick={() => { if (status !== 'sending') setIsOpen(false); }}
          />

          <div className="relative w-full max-w-md bg-dark-800 rounded-2xl border border-dark-600 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600">
              <h2 className="text-lg font-semibold text-white">Send Feedback</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success state */}
            {status === 'sent' ? (
              <div className="px-5 py-10 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">Thanks for your feedback!</p>
                <p className="text-sm text-gray-400 mt-1">We'll review it shortly.</p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {/* Category */}
                <div className="flex gap-2">
                  {[
                    { id: 'bug', label: 'Bug' },
                    { id: 'feature', label: 'Feature' },
                    { id: 'general', label: 'General' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        category === cat.id
                          ? 'bg-accent-primary text-dark-900'
                          : 'bg-dark-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Feedback text */}
                <div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What's on your mind? Found a bug, have an idea, or just want to say hi?"
                    rows={4}
                    className="w-full px-3 py-2.5 bg-dark-700 border border-dark-600 rounded-xl
                      text-white text-sm placeholder-gray-500
                      focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/30
                      resize-none"
                    autoFocus
                    required
                  />
                </div>

                {/* Optional email */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (optional, for follow-up)"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-xl
                      text-white text-sm placeholder-gray-500
                      focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/30"
                  />
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <p className="text-xs text-red-400">Something went wrong. Please try again.</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!feedback.trim() || status === 'sending'}
                  className="w-full flex items-center justify-center gap-2
                    px-4 py-2.5 bg-accent-primary text-dark-900 font-semibold text-sm
                    rounded-xl transition-all
                    hover:bg-accent-primary/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FeedbackWidget;
