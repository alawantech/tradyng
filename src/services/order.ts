import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { OrderIdService } from './orderIdService';

export interface Order {
  id?: string; // Firebase document ID (internal)
  orderId: string; // Professional order ID (customer-facing)
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: {
    street: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    image?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'manual' | 'automatic';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  trackingNumber?: string;
}

export class OrderService {
  // Create a new order for a business
  static async createOrder(businessId: string, orderData: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      
      // Generate professional order ID
      const professionalOrderId = await OrderIdService.generateOrderId(businessId);
      
      await addDoc(collection(db, 'businesses', businessId, 'orders'), {
        ...orderData,
        orderId: professionalOrderId,
        createdAt: now,
        updatedAt: now
      });
      
      return professionalOrderId; // Return the professional ID instead of Firebase ID
    } catch (error) {
      throw error;
    }
  }

  // Get all orders for a business
  static async getOrdersByBusinessId(businessId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      throw error;
    }
  }

  // Get order by ID
  static async getOrderById(businessId: string, orderId: string): Promise<Order | null> {
    try {
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
        where('orderId', '==', orderId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(businessId: string, orderId: string, status: Order['status']): Promise<void> {
    try {
      // Try to find the document by professional orderId field first
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
        where('orderId', '==', orderId)
      );
      const querySnapshot = await getDocs(q);

      let docRefPath: string | null = null;
      if (!querySnapshot.empty) {
        docRefPath = querySnapshot.docs[0].id;
      } else {
        // Fallback: maybe caller passed a Firestore document ID instead of professional orderId
        // Verify the document exists using the passed ID
        const possibleDoc = await getDoc(doc(db, 'businesses', businessId, 'orders', orderId));
        if (possibleDoc.exists()) {
          docRefPath = orderId; // it's a document ID
        }
      }

      if (!docRefPath) {
        throw new Error('No document to update');
      }

      const docRef = doc(db, 'businesses', businessId, 'orders', docRefPath);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }

  // Update order
  static async updateOrder(businessId: string, orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      // Try to find the document by professional orderId field first
      const q = query(
        collection(db, 'businesses', businessId, 'orders'),
        where('orderId', '==', orderId)
      );
      const querySnapshot = await getDocs(q);

      let docRefPath: string | null = null;
      if (!querySnapshot.empty) {
        docRefPath = querySnapshot.docs[0].id;
      } else {
        // Fallback: maybe caller passed a Firestore document ID instead of professional orderId
        const possibleDoc = await getDoc(doc(db, 'businesses', businessId, 'orders', orderId));
        if (possibleDoc.exists()) {
          docRefPath = orderId; // it's a document ID
        }
      }

      if (!docRefPath) {
        throw new Error('No document to update');
      }

      const docRef = doc(db, 'businesses', businessId, 'orders', docRefPath);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }
}