export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
}

export interface PaymentData {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  txRef: string;
  redirectUrl?: string;
  paymentOptions?: string;
  meta?: any;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

class FlutterwaveService {
  private config: FlutterwaveConfig;

  constructor() {
    // Get from environment variables
    this.config = {
      publicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
      secretKey: '', // No longer needed in frontend
      encryptionKey: import.meta.env.VITE_FLUTTERWAVE_ENCRYPTION_KEY || ''
    };

    console.log('Flutterwave config:', {
      hasPublicKey: !!this.config.publicKey,
      hasEncryptionKey: !!this.config.encryptionKey,
      usingProductionFunctions: true
    });
  }

  async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      console.log('🚀 Initializing payment via Cloud Function:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        email: paymentData.customerEmail,
        name: paymentData.customerName,
        phone: paymentData.customerPhone,
        txRef: paymentData.txRef
      });

      const payload = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        customerPhone: paymentData.customerPhone,
        txRef: paymentData.txRef,
        redirectUrl: paymentData.redirectUrl || `${window.location.origin}/payment/callback`,
        meta: paymentData.meta || {}
      };

      const initPaymentUrl = 'https://initializepayment-rv5lqk7lxa-uc.a.run.app';

      console.log('📦 Sending to Cloud Function:', initPaymentUrl);

      const response = await fetch(initPaymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      let data;
      try {
        const text = await response.text();
        console.log('📄 Raw response:', text.substring(0, 500));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Failed to parse payment response. Please try again or contact support.');
      }

      console.log('📊 Parsed response data:', data);

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || data.error || `Payment initialization failed with status ${response.status}`);
      }

      return {
        status: 'success',
        message: 'Payment initialized successfully',
        data: data.data
      };
    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to initialize payment. Please try again.'
      };
    }
  }

  async verifyPayment(txRef: string): Promise<PaymentResponse> {
    try {
      console.log('🔍 Verifying payment via Cloud Function:', txRef);

      const verifyPaymentUrl = 'https://verifypaymentandawardcommission-rv5lqk7lxa-uc.a.run.app';

      const response = await fetch(verifyPaymentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txRef })
      });

      console.log('📡 Verification response status:', response.status);

      let data;
      try {
        const text = await response.text();
        console.log('📄 Raw verification response:', text.substring(0, 500));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Failed to parse verification response.');
      }

      console.log('📊 Verification data:', data);

      if (!response.ok || data.status === 'error') {
        if (response.status === 400 && data.message?.includes('No transaction was found')) {
          console.warn('⚠️ Transaction not found:', txRef);
          return {
            status: 'error',
            message: 'Transaction not found. Please wait a moment and try again, or contact support.'
          };
        }
        throw new Error(data.message || data.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified and commission awarded (if applicable)');

      return {
        status: 'success',
        message: 'Payment verified successfully',
        data: data.data
      };
    } catch (error: any) {
      console.error('❌ Payment verification error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to verify payment'
      };
    }
  }

  // Generate unique transaction reference
  generateTxRef(prefix: string = 'TX'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  // Check if Flutterwave is properly configured
  isConfigured(): boolean {
    return !!(this.config.publicKey && this.config.encryptionKey);
  }

  // Get public key for frontend use
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

export const flutterwaveService = new FlutterwaveService();