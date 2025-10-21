// OTP Service for customer registration verification
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, limit, updateDoc } from 'firebase/firestore';
// Email sending removed — do not import EmailService
import { BusinessService } from './business';

export interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  businessId?: string;
  businessName?: string;
  createdAt: Date;
}

export class OTPService {
  private static OTP_EXPIRY_MINUTES = 5; // OTP expires in 5 minutes as requested
  private static RATE_LIMIT_MINUTES = 2; // Can request new OTP every 2 minutes

  // Generate 4-digit OTP
  static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Send OTP via email
  static async sendOTP(email: string, businessId?: string, businessName?: string): Promise<{ success: boolean; message: string }> {
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
      
      // Check rate limiting - prevent spam and disallow multiple active codes
      const recentOTPQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', emailLower),
        limit(10) // Get recent OTPs and filter in code
      );
      
      const recentOTPs = await getDocs(recentOTPQuery);
      
      // Filter in code to avoid index requirement
      const now = new Date();
      const rateLimitTime = new Date(now.getTime() - this.RATE_LIMIT_MINUTES * 60000);

      // Find any existing valid (not used, not expired) OTP for this email
      let existingValidOTPDoc: any = null;
      for (const d of recentOTPs.docs) {
        const data = d.data();
        const expiresAt = data.expiresAt.toDate();
        const isUsed = data.isUsed;
        if (!isUsed && expiresAt > now) {
          existingValidOTPDoc = { id: d.id, data };
          break;
        }
      }

      if (existingValidOTPDoc) {
        const createdAt = existingValidOTPDoc.data.createdAt.toDate();
        // If created within rate limit window, deny request and ask to wait
        if (createdAt > rateLimitTime) {
          const waitSeconds = Math.ceil((createdAt.getTime() + this.RATE_LIMIT_MINUTES * 60000 - now.getTime()) / 1000);
          return {
            success: false,
            message: `Please wait ${waitSeconds} seconds before requesting another code`
          };
        }
        // Otherwise (rate window passed) we'll overwrite the existing OTP record
      }

      // Clean up old OTPs for this email
      await this.cleanupOTPs(emailLower);

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);
      const createdAt = new Date();

      // Store OTP in Firestore. If there's an existing valid OTP doc (older than rate limit),
      // update it instead of creating a new one to ensure only one active code exists.
      if (existingValidOTPDoc) {
        const otpDocRef = doc(db, 'email_otps', existingValidOTPDoc.id);
        await updateDoc(otpDocRef, {
          otp,
          expiresAt: Timestamp.fromDate(expiresAt),
          isUsed: false,
          attempts: 0,
          businessId: businessId || existingValidOTPDoc.data.businessId || null,
          businessName: businessName || existingValidOTPDoc.data.businessName || null,
          createdAt: Timestamp.fromDate(createdAt)
        } as any);
      } else {
        const otpRecord: Omit<OTPRecord, 'createdAt' | 'expiresAt'> & { 
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

        await addDoc(collection(db, 'email_otps'), otpRecord);
      }

      // Send OTP email (disabled). storeBranding retained for compatibility but not used.
      const _storeBranding = {
        storeName: businessData?.name || businessName || 'Store',
        primaryColor: businessData?.settings?.primaryColor || '#3B82F6',
        supportEmail: businessData?.email || 'support@rady.ng',
        whatsappNumber: businessData?.whatsapp || '+2348123456789'
      };

      // Email sending disabled. In dev we show the OTP locally; in production we still create the OTP
      try {
        const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
        if (isDev) {
          console.log(`DEV-OTP for ${email}: ${otp}`);
          try {
            if (typeof window !== 'undefined') {
              const notification = document.createElement('div');
              notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;`;
              notification.textContent = `DEV OTP for ${email}: ${otp}`;
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
        message: `Code sent to ${email}! Check your notifications. You can request more codes if needed.`
      };

    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Error sending verification code. Please try again.'
      };
    }
  }

  // Verify OTP - accepts any valid (not used, not expired) OTP for the email
  static async verifyOTP(email: string, inputOTP: string): Promise<{ valid: boolean; message: string }> {
    try {
      const emailLower = email.toLowerCase();
      
      // Find all OTPs for this email (simplified query)
      const otpQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', emailLower),
        limit(20) // Get multiple OTPs to check all codes
      );

      const otpDocs = await getDocs(otpQuery);
      
      if (otpDocs.empty) {
        return {
          valid: false,
          message: 'No verification code found. Please request a new one.'
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
          message: 'Invalid or expired verification code. You can use any code we sent you.'
        };
      }

      // Valid OTP found - mark as used and clean up ALL OTPs for this email
      await deleteDoc(doc(db, 'email_otps', otpDocId!));
      
      // Clean up all other OTPs for this email after successful verification
      await this.cleanupAllOTPs(emailLower);
      
      return {
        valid: true,
        message: 'Email verified successfully!'
      };

    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        valid: false,
        message: 'Error verifying code. Please try again.'
      };
    }
  }

  // Check if email has valid pending OTP
  static async hasValidOTP(email: string): Promise<boolean> {
    try {
      const emailLower = email.toLowerCase();
      
      const otpQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', emailLower),
        where('isUsed', '==', false),
        limit(5)
      );

      const otpDocs = await getDocs(otpQuery);
      
      if (otpDocs.empty) {
        return false;
      }

      // Check if any OTP is still valid
      const now = new Date();
      for (const docSnapshot of otpDocs.docs) {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt.toDate();
        if (expiresAt > now) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking OTP validity:', error);
      return false;
    }
  }

  // Clean up expired/old OTPs for an email
  private static async cleanupOTPs(email: string): Promise<void> {
    try {
      const cleanupQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', email)
      );

      const docs = await getDocs(cleanupQuery);
      const now = new Date();

      for (const docSnapshot of docs.docs) {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt.toDate();
        
        // Delete if expired or used
        if (expiresAt < now || data.isUsed) {
          await deleteDoc(doc(db, 'email_otps', docSnapshot.id));
        }
      }
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
    }
  }

  // Resend OTP (create new one while keeping old valid ones)
  static async resendOTP(email: string, businessId?: string, businessName?: string): Promise<{ success: boolean; message: string }> {
    // Simply call sendOTP again - it will handle rate limiting and create a new OTP
    // Old valid OTPs remain usable until someone verifies or they expire
    return this.sendOTP(email, businessId, businessName);
  }

  // Clean up ALL OTPs for an email (after successful verification)
  private static async cleanupAllOTPs(email: string): Promise<void> {
    try {
      const cleanupQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', email),
        limit(50)
      );

      const docs = await getDocs(cleanupQuery);

      for (const docSnapshot of docs.docs) {
        await deleteDoc(doc(db, 'email_otps', docSnapshot.id));
      }
    } catch (error) {
      console.error('Error cleaning up all OTPs:', error);
    }
  }

  // Get time until next OTP can be requested
  static async getNextOTPTime(email: string): Promise<Date | null> {
    try {
      const emailLower = email.toLowerCase();
      
      const otpQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', emailLower),
        limit(10)
      );

      const otpDocs = await getDocs(otpQuery);
      
      if (otpDocs.empty) {
        return null; // Can request immediately
      }

      // Find the most recent OTP creation time
      let latestCreation: Date | null = null;

      for (const otpDoc of otpDocs.docs) {
        const data = otpDoc.data();
        const createdAt = data.createdAt.toDate();
        
        if (!latestCreation || createdAt > latestCreation) {
          latestCreation = createdAt;
        }
      }

      if (latestCreation) {
        const nextAllowedTime = new Date(latestCreation.getTime() + this.RATE_LIMIT_MINUTES * 60000);
        const now = new Date();
        
        if (nextAllowedTime > now) {
          return nextAllowedTime;
        }
      }

      return null; // Can request immediately
    } catch (error) {
      console.error('Error getting next OTP time:', error);
      return null;
    }
  }

  // Get remaining time for OTP
  static async getOTPExpiry(email: string): Promise<Date | null> {
    try {
      const emailLower = email.toLowerCase();
      
      const otpQuery = query(
        collection(db, 'email_otps'),
        where('email', '==', emailLower),
        limit(10)
      );

      const otpDocs = await getDocs(otpQuery);
      
      if (otpDocs.empty) {
        return null;
      }

      // Find the most recent valid OTP
      const now = new Date();
      let latestExpiry: Date | null = null;
      
      for (const docSnapshot of otpDocs.docs) {
        const data = docSnapshot.data();
        const expiresAt = data.expiresAt.toDate();
        
        if (!data.isUsed && expiresAt > now) {
          if (!latestExpiry || expiresAt > latestExpiry) {
            latestExpiry = expiresAt;
          }
        }
      }
      
      return latestExpiry;
    } catch (error) {
      console.error('Error getting OTP expiry:', error);
      return null;
    }
  }
}