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
  private baseUrl: string;

  constructor() {
    // Get from environment variables
    this.config = {
      publicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
      secretKey: import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY || '',
      encryptionKey: import.meta.env.VITE_FLUTTERWAVE_ENCRYPTION_KEY || ''
    };

    // Use proxy in development to avoid CORS issues
    this.baseUrl = import.meta.env.DEV ? '/api/flutterwave/v3' : 'https://api.flutterwave.com/v3';

    console.log('Flutterwave config:', {
      hasPublicKey: !!this.config.publicKey,
      hasSecretKey: !!this.config.secretKey,
      hasEncryptionKey: !!this.config.encryptionKey,
      publicKeyPrefix: this.config.publicKey.substring(0, 10) + '...',
      secretKeyPrefix: this.config.secretKey.substring(0, 10) + '...',
      baseUrl: this.baseUrl,
      isDev: import.meta.env.DEV
    });
  }

  async initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const payload = {
        tx_ref: paymentData.txRef,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: paymentData.redirectUrl || `${window.location.origin}/payment/callback`,
        payment_options: paymentData.paymentOptions || 'card,mobilemoney,ussd',
        customer: {
          email: paymentData.customerEmail,
          name: paymentData.customerName,
          phone_number: paymentData.customerPhone
        },
        meta: paymentData.meta || {},
        customizations: {
          title: 'Programmers College',
          description: 'Payment for Rady.ng services',
          logo: `${window.location.origin}/logo.png`
        }
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      return {
        status: 'success',
        message: 'Payment initialized successfully',
        data: data
      };
    } catch (error: any) {
      console.error('Flutterwave initialization error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to initialize payment'
      };
    }
  }

  async verifyPayment(txRef: string): Promise<PaymentResponse> {
    try {
      console.log('Verifying payment with txRef:', txRef);
      console.log('Using baseUrl:', this.baseUrl);

      const url = `${this.baseUrl}/transactions/${encodeURIComponent(txRef)}/verify`;
      console.log('Verification URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Verification response status:', response.status);

      const data = await response.json();
      console.log('Verification response data:', data);

      if (!response.ok) {
      // If transaction not found, it might be a timing issue or environment mismatch
        if (response.status === 400 && data.message?.includes('No transaction was found')) {
          console.warn('Transaction not found details:', {
            txRef,
            responseStatus: response.status,
            responseData: data,
            baseUrl: this.baseUrl,
            isDev: import.meta.env.DEV
          });
          return {
            status: 'error',
            message: 'Transaction not found. This might be a timing issue or environment mismatch - please wait a moment and try again, or contact support with your transaction reference.'
          };
        }
        throw new Error(data.message || 'Payment verification failed');
      }

      return {
        status: 'success',
        message: 'Payment verified successfully',
        data: data
      };
    } catch (error: any) {
      console.error('Flutterwave verification error:', error);
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
    return !!(this.config.publicKey && this.config.secretKey && this.config.encryptionKey);
  }

  // Get public key for frontend use
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

export const flutterwaveService = new FlutterwaveService();