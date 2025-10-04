// Production EmailService that calls backend API
// This replaces the mock implementation when you have a backend deployed

export interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export interface StoreBranding {
  storeName: string;
  storeUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  customFromName?: string;
}

export class ProductionEmailService {
  private static API_BASE_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

  static async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      console.log('Email sent successfully:', result.message);
      return true;

    } catch (error) {
      console.error('Error sending email via API:', error);
      return false;
    }
  }

  // Registration OTP email with beautiful template
  static async sendRegistrationOTP(
    email: string,
    otp: string,
    storeBranding: StoreBranding,
    customSubject?: string
  ): Promise<boolean> {
    const subject = customSubject || `Verify your email - ${storeBranding.storeName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${storeBranding.primaryColor || '#3B82F6'} 0%, ${storeBranding.accentColor || '#1E40AF'} 100%); padding: 40px 30px; text-align: center;">
            ${storeBranding.logoUrl ? 
              `<img src="${storeBranding.logoUrl}" alt="${storeBranding.storeName}" style="height: 50px; margin-bottom: 20px;">` : 
              `<div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 15px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🛍️</div>`
            }
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">${storeBranding.storeName}</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Verify Your Email Address</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 24px; font-weight: bold;">Welcome to ${storeBranding.storeName}! 🎉</h2>
            
            <p style="margin: 0 0 25px; color: #6B7280; font-size: 16px; line-height: 1.6;">
              Thanks for signing up! To complete your registration and start shopping, please verify your email address with the code below:
            </p>

            <!-- OTP Code -->
            <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; border: 2px dashed ${storeBranding.primaryColor || '#3B82F6'};">
              <p style="margin: 0 0 15px; color: #6B7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <div style="font-size: 36px; font-weight: bold; color: ${storeBranding.primaryColor || '#3B82F6'}; letter-spacing: 8px; font-family: 'Courier New', monospace; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${otp}
              </div>
              <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">This code expires in 10 minutes</p>
            </div>

            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">
                <strong>Security tip:</strong> Never share this code with anyone. We'll never ask for it over the phone or email.
              </p>
            </div>

            <p style="margin: 25px 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with ${storeBranding.storeName}, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0 0 15px; color: #6B7280; font-size: 14px;">
              Questions? Contact our support team
            </p>
            <div style="margin: 15px 0;">
              ${storeBranding.supportEmail ? `<a href="mailto:${storeBranding.supportEmail}" style="color: ${storeBranding.primaryColor || '#3B82F6'}; text-decoration: none; margin: 0 15px;">📧 ${storeBranding.supportEmail}</a>` : ''}
              ${storeBranding.whatsappNumber ? `<a href="https://wa.me/${storeBranding.whatsappNumber.replace(/[^0-9]/g, '')}" style="color: #25D366; text-decoration: none; margin: 0 15px;">💬 WhatsApp</a>` : ''}
            </div>
            <p style="margin: 15px 0 0; color: #9CA3AF; font-size: 12px;">
              © 2025 ${storeBranding.storeName}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${storeBranding.storeName}!
      
      Your verification code is: ${otp}
      
      This code expires in 10 minutes.
      
      If you didn't create an account, you can safely ignore this email.
      
      Contact us: ${storeBranding.supportEmail || 'support@example.com'}
    `;

    return this.sendEmail({
      to: email,
      from: storeBranding.supportEmail || 'noreply@example.com',
      subject,
      html,
      text
    });
  }
}