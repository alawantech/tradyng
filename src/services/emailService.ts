// Stub EmailService: email-sending backend was removed. This stub keeps
// the public API so frontend imports continue to work, but it does not
// perform any network calls. In dev it still shows OTPs locally for testing.

type StoreBranding = {
  storeName: string;
  primaryColor?: string;
  supportEmail?: string;
  whatsappNumber?: string;
};

export class EmailService {
  static async sendRegistrationOTP(
    email: string,
    otp: string,
    _storeBranding: StoreBranding
  ): Promise<{ success: boolean; message: string }> {
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
      } catch (e) {
        // ignore
      }
      return { success: true, message: `DEV: OTP for ${email} is ${otp}` };
    }

    // In production, email sending is disabled. Return a clear error.
    return { success: false, message: 'Email sending disabled in this build. Contact the administrator.' };
  }

  static async sendPasswordResetOTP(
    email: string,
    otp: string,
    _storeBranding: StoreBranding
  ): Promise<{ success: boolean; message: string }> {
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;
    if (isDev) {
      console.log(`DEV-PW-OTP for ${email}: ${otp}`);
      try {
        if (typeof window !== 'undefined') {
          const notification = document.createElement('div');
          notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #3B82F6; color: white; padding: 12px 16px; border-radius: 8px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;`;
          notification.textContent = `DEV password OTP for ${email}: ${otp}`;
          document.body.appendChild(notification);
          setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 12000);
        }
      } catch (e) {}
      return { success: true, message: `DEV: password OTP for ${email} is ${otp}` };
    }

    return { success: false, message: 'Email sending disabled in this build. Contact the administrator.' };
  }

  static async testEmailConnection(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Email sending disabled in this build.' };
  }
}

export default EmailService;