import React, { useState, useRef, useEffect } from 'react';
import { Phone, ArrowRight, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Modal, Button } from '../shared';
import { useAuth } from '../../context/AuthContext';

export function PhoneAuthModal({ isOpen, onClose, onSuccess }) {
  const { sendPhoneOTP, verifyPhoneOTP } = useAuth();

  // Steps: 'phone' | 'verify'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputRefs = useRef([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setFormattedPhone('');
      setOtp(['', '', '', '', '', '']);
      setError(null);
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  // Handle sending OTP
  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: otpError } = await sendPhoneOTP(phone);

    setIsLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setStep('verify');
    setCountdown(60); // 60 second countdown for resend

    // Focus first OTP input
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numValue = value.replace(/\D/g, '');

    if (numValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);

      // Auto-focus next input
      if (numValue && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else if (numValue.length === 6) {
      // Pasted full code
      setOtp(numValue.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: verifyError } = await verifyPhoneOTP(phone, code);

    setIsLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      return;
    }

    // Success!
    onSuccess?.();
    onClose();
  };

  // Handle resend
  const handleResend = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError(null);
    setOtp(['', '', '', '', '', '']);

    const { error: otpError } = await sendPhoneOTP(phone);

    setIsLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setCountdown(60);
    otpInputRefs.current[0]?.focus();
  };

  // Auto-verify when all digits entered
  useEffect(() => {
    if (step === 'verify' && otp.every(d => d !== '')) {
      handleVerifyOTP();
    }
  }, [otp, step]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center space-y-6">
        {/* Logo/Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
          <Phone className="w-8 h-8 text-white" />
        </div>

        {step === 'phone' ? (
          <>
            {/* Phone number entry */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Enter your phone number</h2>
              <p className="text-gray-400 text-sm">We'll send you a verification code</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+1</span>
                <input
                  type="tel"
                  value={formattedPhone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 555-5555"
                  className="w-full pl-12 pr-4 py-4 bg-dark-700 border border-dark-500 rounded-xl text-white text-lg text-center tracking-wide focus:border-accent-primary focus:outline-none"
                  maxLength={14}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleSendOTP}
                disabled={phone.length < 10 || isLoading}
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

            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <button className="text-accent-primary hover:underline">Terms</button>
              {' '}and{' '}
              <button className="text-accent-primary hover:underline">Privacy Policy</button>
            </p>
          </>
        ) : (
          <>
            {/* OTP verification */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Verify your number</h2>
              <p className="text-gray-400 text-sm">
                Enter the 6-digit code sent to{' '}
                <span className="text-white">+1 {formattedPhone}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* OTP Input boxes */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-dark-700 border border-dark-500 rounded-lg text-white text-xl text-center focus:border-accent-primary focus:outline-none"
                    maxLength={1}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={handleVerifyOTP}
                disabled={otp.some(d => !d) || isLoading}
                fullWidth
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={() => setStep('phone')}
                  className="text-gray-400 hover:text-white"
                >
                  Change number
                </button>
                <span className="text-dark-500">|</span>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className={`${
                    countdown > 0 ? 'text-gray-600' : 'text-accent-primary hover:underline'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default PhoneAuthModal;
