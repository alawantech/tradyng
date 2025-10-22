// OTP Service for customer registration verification

export class OTPService {
  // Send OTP via email using Firebase Cloud Function
  static async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Call the sendOtp Cloud Function
      const response = await fetch('https://sendotp-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send verification code';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        return {
          success: false,
          message: errorMessage
        };
      }

      // Also show in browser for development convenience
      try {
        const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
        if (isDev) {
          console.log(`DEV-OTP sent to ${email}`);
          try {
            if (typeof window !== 'undefined') {
              const notification = document.createElement('div');
              notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;`;
              notification.textContent = `DEV: OTP sent to ${email}`;
              document.body.appendChild(notification);
              setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 12000);
            }
          } catch (e) {}
        }
      } catch (e) {
        // ignore
      }

      return {
        success: true,
        message: `Code sent to ${email}! Check your email.`
      };

    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Error sending verification code. Please try again.'
      };
    }
  }

  // Verify OTP via Firebase Cloud Function
  static async verifyOTP(email: string, inputOTP: string): Promise<{ valid: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Call the verifyOtp Cloud Function
      const response = await fetch('https://verifyotp-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower, code: inputOTP })
      });

      if (response.ok) {
        return {
          valid: true,
          message: 'Email verified successfully!'
        };
      } else {
        let errorMessage = 'Invalid or expired verification code';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        return {
          valid: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        valid: false,
        message: 'Error verifying code. Please try again.'
      };
    }
  }
}