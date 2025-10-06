import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { PasswordResetService } from '../../services/passwordResetService';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useStore } from '../../pages/storefront/StorefrontLayout';
import toast from 'react-hot-toast';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  email
}) => {
  const { updatePassword } = useCustomerAuth();
  const { business } = useStore();
  const [step, setStep] = useState<'verify' | 'newPassword'>('verify');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  // Auto-focus and handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const codeToVerify = otp.join('');
    if (codeToVerify.length !== 4) {
      toast.error('Please enter all 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const result = await PasswordResetService.verifyPasswordResetOTP(email, codeToVerify);
      
      if (result.valid) {
        toast.success(result.message);
        setStep('newPassword');
      } else {
        toast.error(result.message);
        // Clear OTP inputs on error
        setOtp(['', '', '', '']);
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        firstInput?.focus();
      }
    } catch (error) {
      toast.error('Error verifying code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const result = await PasswordResetService.sendPasswordResetOTP(
        email,
        business?.id,
        business?.name
      );
      
      if (result.success) {
        toast.success('New password reset code sent!');
        setTimer(300); // Reset timer
        setOtp(['', '', '', '']); // Clear OTP inputs
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        firstInput?.focus();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error sending new code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const success = await updatePassword(newPassword);
      if (success) {
        toast.success('Password updated successfully!');
        onClose();
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } catch (error) {
      toast.error('Error updating password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {step === 'verify' ? 'Reset Password' : 'New Password'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {step === 'verify' ? 'Enter verification code' : 'Create your new password'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {step === 'verify' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    We sent a 4-digit code to <span className="font-medium">{email}</span>
                  </p>
                  
                  <div className="flex justify-center gap-3 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Code expires in {formatTime(timer)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.join('').length !== 4}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <button
                    onClick={handleResendOTP}
                    disabled={isResending || timer > 270} // Allow resend after 30 seconds
                    className="w-full flex items-center justify-center gap-2 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Send New Code'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>

                <button
                  onClick={handlePasswordReset}
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};