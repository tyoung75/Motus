import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, Button } from '../shared';

export function SignUpModal({ isOpen, onClose, onSuccess, onShowPrivacy, onShowTerms }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setFormattedPhone('');
      setError(null);
      setAgreedToTerms(false);
    }
  }, [isOpen]);

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);

    // Format for display: (XXX) XXX-XXXX
    if (value.length <= 3) {
      setFormattedPhone(value);
    } else if (value.length <= 6) {
      setFormattedPhone(`(${value.slice(0, 3)}) ${value.slice(3)}`);
    } else {
      setFormattedPhone(`(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`);
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Privacy Policy');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Store user info in localStorage for now
      // In production, this would create a user account
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: `+1${phone}`,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('motus_user_signup', JSON.stringify(userData));

      // Success - proceed to setup
      setTimeout(() => {
        setIsLoading(false);
        onSuccess?.(userData);
        onClose();
      }, 500);

    } catch (err) {
      setIsLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  const isFormValid = name.trim() && isValidEmail(email) && phone.length >= 10 && agreedToTerms;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-dark-950" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Create Your Account</h2>
          <p className="text-gray-400 text-sm">Start your fitness journey today</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-3.5 bg-dark-700 border border-dark-500 rounded-xl text-white focus:border-accent-primary focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-3.5 bg-dark-700 border border-dark-500 rounded-xl text-white focus:border-accent-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400">+1</span>
              <input
                type="tel"
                value={formattedPhone}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                className="w-full pl-20 pr-4 py-3.5 bg-dark-700 border border-dark-500 rounded-xl text-white focus:border-accent-primary focus:outline-none"
                maxLength={14}
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreedToTerms
                  ? 'bg-accent-primary border-accent-primary'
                  : 'border-dark-500 bg-dark-700'
              }`}>
                {agreedToTerms && <CheckCircle className="w-3.5 h-3.5 text-dark-950" />}
              </div>
            </div>
            <span className="text-sm text-gray-400">
              I agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onShowTerms?.(); }}
                className="text-accent-primary hover:underline"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onShowPrivacy?.(); }}
                className="text-accent-primary hover:underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            fullWidth
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Already have account */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button className="text-accent-primary hover:underline">Sign in</button>
        </p>
      </div>
    </Modal>
  );
}

export default SignUpModal;
