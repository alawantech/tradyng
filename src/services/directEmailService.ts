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
        subject: `Verify your email - ${storeName}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 40px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">🛍️ ${storeName}</h1>
              <p style="margin: 10px 0 0; font-size: 16px;">Verify Your Email Address</p>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #1F2937; margin: 0 0 20px;">Welcome to ${storeName}! 🎉</h2>
              
              <p style="color: #6B7280; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! To complete your registration, please verify your email with this code:
              </p>

              <div style="background: #F3F4F6; border: 2px dashed #3B82F6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 15px; color: #6B7280; font-size: 14px; font-weight: 500;">Your Verification Code</p>
                <div style="font-size: 28px; font-weight: bold; color: #3B82F6; letter-spacing: 6px; font-family: monospace;">
                  ${otp}
                </div>
                <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">This code expires in 10 minutes</p>
              </div>

              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>Security tip:</strong> Never share this code with anyone.
                </p>
              </div>
            </div>

            <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                Questions? Contact our support team at support@rady.ng
              </p>
              <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">
                © 2025 ${storeName}. All rights reserved.
              </p>
            </div>
          </div>
        `,
        text: `Welcome to ${storeName}! Your verification code is: ${otp}. This code expires in 10 minutes.`
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