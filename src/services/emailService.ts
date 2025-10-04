import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';

// Real email service using Firebase Cloud Functions and SendGrid

export interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
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

export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Date;
  businessName?: string;
}

interface OTPEmailRequest {
  email: string;
  otp: string;
  storeName: string;
  storeColor?: string;
  supportEmail?: string;
}

interface GenericEmailRequest {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static functions = getFunctions(app);
  private static sendOTPEmailFunction = httpsCallable(EmailService.functions, 'sendOTPEmail');
  private static sendEmailFunction = httpsCallable(EmailService.functions, 'sendEmail');

  // Real email sending via Firebase Cloud Functions
  static async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      console.log('📧 Sending email via Firebase Functions...');
      
      const emailRequest: GenericEmailRequest = {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await EmailService.sendEmailFunction(emailRequest);
      console.log('✅ Email sent successfully:', result.data);
      
      // Show success notification
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10B981;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="font-size: 14px; margin-bottom: 8px;">✅ Email Sent Successfully!</div>
          <div style="font-size: 12px; opacity: 0.9;">Email delivered to ${emailData.to}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 5000);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to send email. Please try again.';
      
      if (error?.code === 'functions/invalid-argument') {
        errorMessage = 'Invalid email address or parameters.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required to send email.';
      } else if (error?.code === 'functions/deadline-exceeded') {
        errorMessage = 'Email service timeout. Please try again.';
      } else if (error?.code === 'functions/unavailable') {
        errorMessage = 'Email service temporarily unavailable.';
      }
      
      // Show error notification
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #EF4444;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="font-size: 14px; margin-bottom: 8px;">❌ Email Failed</div>
          <div style="font-size: 12px; opacity: 0.9;">${errorMessage}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 8000);
      }
      
      throw new Error(errorMessage);
    }
  }

  // Send OTP email for customer registration (using specialized function)
  static async sendRegistrationOTP(
    email: string, 
    otp: string, 
    storeBranding: StoreBranding
  ): Promise<boolean> {
    try {
      console.log('📧 Sending OTP email via Firebase Functions...');
      
      const otpRequest: OTPEmailRequest = {
        email: email,
        otp: otp,
        storeName: storeBranding.storeName,
        storeColor: storeBranding.primaryColor || '#3B82F6',
        supportEmail: storeBranding.supportEmail || 'support@rady.ng'
      };

      const result = await EmailService.sendOTPEmailFunction(otpRequest);
      console.log('✅ OTP email sent successfully:', result.data);
      
      // Show success notification with OTP for development visibility
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10B981;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="font-size: 14px; margin-bottom: 8px;">✅ OTP Email Sent!</div>
          <div style="font-size: 12px; opacity: 0.9;">Check ${email} for verification code</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 12000);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ OTP email sending failed:', error);
      
      // Show error notification
      if (typeof window !== 'undefined') {
        const errorMessage = error?.message || 'Failed to send OTP email';
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #EF4444;
          color: white;
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <div style="font-size: 14px; margin-bottom: 8px;">❌ OTP Email Failed</div>
          <div style="font-size: 12px; opacity: 0.9;">${errorMessage}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 8000);
      }
      
      return false;
    }
  }

  // Test email connection
  static async testEmailConnection(): Promise<boolean> {
    try {
      const testRequest: OTPEmailRequest = {
        email: 'test@example.com',
        otp: '123456',
        storeName: 'Test Store'
      };

      await EmailService.sendOTPEmailFunction(testRequest);
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}