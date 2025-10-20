// Browser-friendly stub for DirectEmailService. The actual SendGrid-based
// implementation is server-side only. This file ensures the frontend build
// does not attempt to bundle `@sendgrid/mail`.

class DirectEmailService {
  static async sendOTPEmail(_email: string, _otp: string, _storeName: string, _whatsappNumber?: string): Promise<boolean> {
    // No-op in browser build; return false to indicate not sent
    console.warn('DirectEmailService.sendOTPEmail called in browser - no-op');
    return false;
  }

  static async sendPasswordResetOTP(_email: string, _otp: string, _storeName: string, _whatsappNumber?: string): Promise<boolean> {
    console.warn('DirectEmailService.sendPasswordResetOTP called in browser - no-op');
    return false;
  }
}

export default DirectEmailService;