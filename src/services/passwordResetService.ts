// Password Reset Service for customer password recovery
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, limit } from 'firebase/firestore';
import { EmailService } from './emailService';
import DirectEmailService from './directEmailService';
import { BusinessService } from './business';

export interface PasswordResetRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  businessId?: string;
  businessName?: string;
  createdAt: Date;
}

export class PasswordResetService {
  private static OTP_EXPIRY_MINUTES = 5; // Password reset OTP expires in 5 minutes
  private static RATE_LIMIT_MINUTES = 1; // Can request new password reset OTP every 1 minute

  // Generate 4-digit OTP
  static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Send password reset OTP via email
  static async sendPasswordResetOTP(email: string, businessId?: string, businessName?: string): Promise<{ success: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Get business data if businessId is provided
      let businessData = null;
      if (businessId) {
        try {
          businessData = await BusinessService.getBusinessById(businessId);
        } catch (error) {
          console.log('Could not fetch business data:', error);
        }
      }
      
      // Check rate limiting - prevent spam
      const recentOTPQuery = query(
        collection(db, 'password_reset_otps'),
        where('email', '==', emailLower),
        limit(10)
      );
      
      const recentOTPs = await getDocs(recentOTPQuery);
      
      // Filter in code to avoid index requirement
      const now = new Date();
      const rateLimitTime = new Date(now.getTime() - this.RATE_LIMIT_MINUTES * 60000);
      
      const recentOTP = recentOTPs.docs.find(doc => {
        const data = doc.data();
        const createdAt = data.createdAt.toDate();
        return createdAt > rateLimitTime;
      });
      
      if (recentOTP) {
        const waitSeconds = Math.ceil(this.RATE_LIMIT_MINUTES * 60);
        return {
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting another password reset code`
        };
      }

      // Clean up old OTPs for this email
      await this.cleanupOTPs(emailLower);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);
      const createdAt = new Date();

      // Store OTP in Firestore
      const otpRecord: Omit<PasswordResetRecord, 'createdAt' | 'expiresAt'> & { 
        createdAt: Timestamp; 
        expiresAt: Timestamp;
      } = {
        email: emailLower,
        otp,
        expiresAt: Timestamp.fromDate(expiresAt),
        isUsed: false,
        attempts: 0,
        businessId,
        businessName,
        createdAt: Timestamp.fromDate(createdAt)
      };

      await addDoc(collection(db, 'password_reset_otps'), otpRecord);

      // Send password reset OTP email
      const storeBranding = {
        storeName: businessData?.name || businessName || 'Store',
        primaryColor: businessData?.settings?.primaryColor || '#3B82F6',
        supportEmail: businessData?.email || 'support@rady.ng',
        whatsappNumber: businessData?.whatsapp || undefined
      };

      const emailSent = await EmailService.sendPasswordResetOTP(
        email,
        otp,
        storeBranding
      );

      // If Firebase Functions fails, try direct SendGrid
      if (!emailSent) {
        console.log('🔄 Firebase Functions failed, trying direct SendGrid...');
        const directEmailSent = await DirectEmailService.sendPasswordResetOTP(
          email,
          otp,
          businessData?.name || businessName || 'Store',
          businessData?.whatsapp
        );
        
        if (directEmailSent) {
          console.log('✅ Password reset email sent via direct SendGrid');
        } else {
          console.error('❌ Both email services failed');
        }
      }

      if (emailSent) {
        return {
          success: true,
          message: `Password reset code sent to ${email}! Check your email.`
        };
      } else {
        return {
          success: false,
          message: 'Failed to send password reset email. Please try again.'
        };
      }

    } catch (error) {
      console.error('Error sending password reset OTP:', error);
      return {
        success: false,
        message: 'Error sending password reset code. Please try again.'
      };
    }
  }

  // Verify password reset OTP
  static async verifyPasswordResetOTP(email: string, inputOTP: string): Promise<{ valid: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Find all OTPs for this email
      const otpQuery = query(
        collection(db, 'password_reset_otps'),
        where('email', '==', emailLower),
        limit(20)
      );

      const otpDocs = await getDocs(otpQuery);
      
      if (otpDocs.empty) {
        return {
          valid: false,
          message: 'No password reset code found. Please request a new one.'
        };
      }

      const now = new Date();
      let matchingOTP = null;
      let otpDocId = null;

      // Check all OTPs to find a matching, valid one
      for (const otpDoc of otpDocs.docs) {
        const data = otpDoc.data();
        const expiresAt = data.expiresAt.toDate();
        
        // Skip if expired or used
        if (expiresAt < now || data.isUsed) {
          continue;
        }

        // Check if this OTP matches the input
        if (data.otp === inputOTP) {
          matchingOTP = data;
          otpDocId = otpDoc.id;
          break;
        }
      }

      if (!matchingOTP) {
        return {
          valid: false,
          message: 'Invalid or expired password reset code.'
        };
      }

      // Valid OTP found - mark as used and clean up ALL OTPs for this email
      await deleteDoc(doc(db, 'password_reset_otps', otpDocId!));
      
      // Clean up all other OTPs for this email after successful verification
      await this.cleanupAllOTPs(emailLower);
      
      return {
        valid: true,
        message: 'Password reset code verified successfully!'
      };

    } catch (error) {
      console.error('Error verifying password reset OTP:', error);
      return {
        valid: false,
        message: 'Error verifying code. Please try again.'
      };
    }
  }

  // Clean up expired/old OTPs for an email
  private static async cleanupOTPs(email: string): Promise<void> {
    try {
      const cleanupQuery = query(
        collection(db, 'password_reset_otps'),
        where('email', '==', email)
      );

      const docs = await getDocs(cleanupQuery);
      const now = new Date();

      for (const docSnapshot of docs.docs) {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt.toDate();
        
        // Delete if expired or used
        if (expiresAt < now || data.isUsed) {
          await deleteDoc(doc(db, 'password_reset_otps', docSnapshot.id));
        }
      }
    } catch (error) {
      console.error('Error cleaning up password reset OTPs:', error);
    }
  }

  // Clean up ALL OTPs for an email (after successful verification)
  private static async cleanupAllOTPs(email: string): Promise<void> {
    try {
      const cleanupQuery = query(
        collection(db, 'password_reset_otps'),
        where('email', '==', email),
        limit(50)
      );

      const docs = await getDocs(cleanupQuery);

      for (const docSnapshot of docs.docs) {
        await deleteDoc(doc(db, 'password_reset_otps', docSnapshot.id));
      }
    } catch (error) {
      console.error('Error cleaning up all password reset OTPs:', error);
    }
  }
}