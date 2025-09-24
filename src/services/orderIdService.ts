import { db } from '../config/firebase';
import { doc, runTransaction } from 'firebase/firestore';

interface OrderCounter {
  currentNumber: number;
  lastUpdated: Date;
}

export class OrderIdService {
  // Generate a professional order ID
  static async generateOrderId(businessId: string): Promise<string> {
    try {
      const orderNumber = await this.getNextOrderNumber(businessId);
      
      // Format: TRD-YYMMDD-XXX
      // TRD = Tradyng prefix
      // YYMMDD = Year Month Day
      // XXX = Sequential number (padded to 3 digits)
      
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const sequence = orderNumber.toString().padStart(3, '0');
      
      return `TRD-${year}${month}${day}-${sequence}`;
    } catch (error) {
      console.error('Error generating order ID:', error);
      // Fallback to timestamp-based ID
      const timestamp = Date.now().toString().slice(-8);
      return `TRD-${timestamp}`;
    }
  }

  // Get and increment the order counter
  private static async getNextOrderNumber(businessId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const counterDocRef = doc(db, 'businesses', businessId, 'counters', `orders-${today}`);

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      
      if (!counterDoc.exists()) {
        // First order of the day
        const newCounter = {
          currentNumber: 1,
          lastUpdated: new Date(),
          date: today
        };
        transaction.set(counterDocRef, newCounter);
        return 1;
      } else {
        // Increment existing counter
        const currentData = counterDoc.data() as OrderCounter;
        const newNumber = currentData.currentNumber + 1;
        
        transaction.update(counterDocRef, {
          currentNumber: newNumber,
          lastUpdated: new Date()
        });
        
        return newNumber;
      }
    });
  }

  // Alternative format generators
  static async generateShortOrderId(businessId: string): Promise<string> {
    const orderNumber = await this.getNextOrderNumber(businessId);
    // Format: ORD-001
    return `ORD-${orderNumber.toString().padStart(3, '0')}`;
  }

  static async generateYearlyOrderId(businessId: string): Promise<string> {
    const orderNumber = await this.getNextOrderNumber(businessId);
    const year = new Date().getFullYear();
    // Format: 2025-001
    return `${year}-${orderNumber.toString().padStart(3, '0')}`;
  }

  // Validate if an order ID follows our format
  static isValidOrderId(orderId: string): boolean {
    const patterns = [
      /^TRD-\d{6}-\d{3}$/, // TRD-YYMMDD-XXX
      /^ORD-\d{3}$/, // ORD-XXX
      /^\d{4}-\d{3}$/ // YYYY-XXX
    ];
    
    return patterns.some(pattern => pattern.test(orderId));
  }
}