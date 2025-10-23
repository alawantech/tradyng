// OTP Service for customer registration verification

export class OTPService {
  // Send OTP via email using Firebase Cloud Function
  static async sendOTP(email: string, businessName?: string): Promise<{ success: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Call the sendOtp Cloud Function
      const response = await fetch('https://sendotp-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLower, businessName: businessName || 'Rady.ng' })
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