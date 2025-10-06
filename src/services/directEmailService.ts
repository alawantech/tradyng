import sgMail from '@sendgrid/mail';

// Direct SendGrid email service (backup solution)
class DirectEmailService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;
    
    const apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    if (apiKey && apiKey.startsWith('SG.')) {
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      console.log('✅ Direct SendGrid service initialized');
    } else {
      console.error('❌ SendGrid API key not found or invalid');
    }
  }

  static async sendOTPEmail(email: string, otp: string, storeName: string): Promise<boolean> {
    try {
      this.initialize();
      
      if (!this.initialized) {
        throw new Error('SendGrid not initialized');
      }

      const msg = {
        to: email,
        from: 'noreply@rady.ng', // This should be verified in SendGrid
        subject: `${otp} - ${storeName} verification code`,
        html: `
          <div style="max-width: 500px; margin: 0 auto; font-family: Arial, sans-serif; background: white; border-radius: 10px; padding: 30px; text-align: center;">
            
            <!-- Store Name -->
            <h1 style="margin: 0 0 20px; color: #3B82F6; font-size: 24px; font-weight: bold;">${storeName}</h1>
            
            <!-- OTP Code - Large and Prominent -->
            <div style="background: #3B82F6; color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px; font-size: 14px;">Your verification code:</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            
            <!-- Simple Instructions -->
            <p style="margin: 20px 0 0; color: #666; font-size: 14px;">
              Enter this code to complete registration. Expires in 3 minutes.
            </p>
            
          </div>
        `,
        text: `${storeName}\n\nYour verification code: ${otp}\n\nExpires in 3 minutes.`
      };

      await sgMail.send(msg);
      console.log('✅ Email sent successfully via direct SendGrid');
      return true;
    } catch (error: any) {
      console.error('❌ Direct SendGrid error:', error);
      return false;
    }
  }
}

export default DirectEmailService;