import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { OTPService } from '../../services/otpService';
import toast from 'react-hot-toast';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
  businessName?: string;
  businessId?: string;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  email,
  businessName,
  businessId
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for existing OTP and setup timers
  useEffect(() => {
    if (isOpen && email) {
      checkOTPStatus();
    }
  }, [isOpen, email]);

  // Timer for expiry countdown
  useEffect(() => {
    if (!expiryTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiryTime.getTime() - now.getTime()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setCanResend(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  const checkOTPStatus = async () => {
    try {
      const expiry = await OTPService.getOTPExpiry(email);
      if (expiry) {
        setExpiryTime(expiry);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
        setTimeLeft(remaining);
        setCanResend(remaining === 0);
      } else {
        setCanResend(true);
      }
    } catch (error) {
      console.error('Error checking OTP status:', error);
      setCanResend(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 4 digits are entered
    if (newOtp.every(digit => digit) && newOtp.join('').length === 4) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('');
    if (codeToVerify.length !== 4) {
      toast.error('Please enter the complete 4-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await OTPService.verifyOTP(email, codeToVerify);
      
      if (result.valid) {
        toast.success(result.message);
        onVerified();
      } else {
        toast.error(result.message);
        // Clear OTP inputs on error
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Error verifying code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const result = await OTPService.resendOTP(email, businessId, businessName);
      
      if (result.success) {
        toast.success('New code sent! You can use this code or any previous valid code.');
        setOtp(['', '', '', '']);
        setCanResend(false);
        
        // Reset timer for 5 minutes
        const newExpiryTime = new Date(Date.now() + 5 * 60000); // 5 minutes
        setExpiryTime(newExpiryTime);
        setTimeLeft(300); // 5 minutes in seconds
        
        otpRefs.current[0]?.focus();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Error resending code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify Email</h2>
                <p className="text-sm text-gray-600">Check your inbox</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Email Info */}
          <div className="mb-6">
            <p className="text-gray-700 text-center">
              We sent a verification code to
            </p>
            <p className="text-blue-600 font-medium text-center break-all mt-1">
              {email}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter 4-digit verification code
            </label>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          {/* Timer */}
          {timeLeft > 0 && (
            <div className="flex items-center justify-center space-x-2 mb-4 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Code expires in {formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={() => handleVerifyOTP()}
            disabled={otp.some(digit => !digit) || isVerifying}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive a code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canResend && !isResending
                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200'
                  : 'text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Sending new code...
                </>
              ) : canResend ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Get another code
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New code in {formatTime(timeLeft)}
                </>
              )}
            </button>
            
            {/* Multiple codes info */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <p className="text-xs text-green-800 text-center">
                ✅ <strong>Multiple codes allowed!</strong> You can request several codes and use any valid one.
              </p>
            </div>
          </div>

          {/* Enhanced Help Text */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-blue-800 font-medium mb-2">📱 How it works:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Each code works for 5 minutes</p>
                <p>• You can use any code we send you</p>
                <p>• Request more codes if needed</p>
                <p>• Check your email notifications</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};