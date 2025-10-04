// OTP Service for customer registration verification

export interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  businessId?: string;
}

export class OTPService {
  private static otpStore: Map<string, OTPRecord> = new Map();

  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and store OTP (expires in 24 hours)
  static async createOTP(email: string, businessId?: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours from now

    const otpRecord: OTPRecord = {
      email: email.toLowerCase(),
      otp,
      expiresAt,
      isUsed: false,
      attempts: 0,
      businessId
    };

    // Store OTP with email as key
    this.otpStore.set(email.toLowerCase(), otpRecord);

    console.log(`OTP created for ${email}: ${otp} (expires: ${expiresAt})`);
    return otp;
  }

  // Verify OTP
  static async verifyOTP(email: string, inputOTP: string): Promise<{ valid: boolean; message: string }> {
    const emailKey = email.toLowerCase();
    const otpRecord = this.otpStore.get(emailKey);

    if (!otpRecord) {
      return { valid: false, message: 'No OTP found for this email' };
    }

    // Check if OTP is already used
    if (otpRecord.isUsed) {
      return { valid: false, message: 'OTP has already been used' };
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      this.otpStore.delete(emailKey); // Clean up expired OTP
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Increment attempts
    otpRecord.attempts++;

    // Check max attempts (prevent brute force)
    if (otpRecord.attempts > 5) {
      this.otpStore.delete(emailKey);
      return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    // Verify OTP
    if (otpRecord.otp === inputOTP) {
      otpRecord.isUsed = true;
      // Keep record for a short time for debugging, then clean up
      setTimeout(() => {
        this.otpStore.delete(emailKey);
      }, 5 * 60 * 1000); // Delete after 5 minutes
      
      return { valid: true, message: 'OTP verified successfully' };
    }

    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  // Resend OTP (create new one)
  static async resendOTP(email: string, businessId?: string): Promise<string> {
    // Delete old OTP if exists
    this.otpStore.delete(email.toLowerCase());
    
    // Create new OTP
    return this.createOTP(email, businessId);
  }

  // Check if OTP exists for email
  static hasValidOTP(email: string): boolean {
    const otpRecord = this.otpStore.get(email.toLowerCase());
    return !!(otpRecord && !otpRecord.isUsed && new Date() <= otpRecord.expiresAt);
  }

  // Get OTP expiry time
  static getOTPExpiry(email: string): Date | null {
    const otpRecord = this.otpStore.get(email.toLowerCase());
    return otpRecord ? otpRecord.expiresAt : null;
  }

  // Clean up expired OTPs (run periodically)
  static cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, record] of this.otpStore.entries()) {
      if (now > record.expiresAt || record.isUsed) {
        this.otpStore.delete(email);
      }
    }
  }
}

// Run cleanup every hour
setInterval(() => {
  OTPService.cleanupExpiredOTPs();
}, 60 * 60 * 1000);