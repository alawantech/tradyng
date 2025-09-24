import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  firstOrderAt?: Timestamp;
  lastOrderAt?: Timestamp;
  createdAt: Timestamp;
  notes?: string;
  tags?: string[];
}

export class CustomerService {
  // Create a new customer
  static async createCustomer(businessId: string, customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'businesses', businessId, 'customers'), {
        ...customerData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Get all customers for a business
  static async getCustomersByBusinessId(businessId: string): Promise<Customer[]> {
    try {
      const q = query(
        collection(db, 'businesses', businessId, 'customers'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const customers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure totalSpent and totalOrders have default values if missing
        return {
          id: doc.id,
          ...data,
          totalSpent: data.totalSpent ?? 0,
          totalOrders: data.totalOrders ?? 0
        };
      }) as Customer[];
      
      return customers;
    } catch (error) {
      throw error;
    }
  }

  // Get customer by ID
  static async getCustomerById(businessId: string, customerId: string): Promise<Customer | null> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'customers', customerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure totalSpent and totalOrders have default values if missing
        return {
          id: docSnap.id,
          ...data,
          totalSpent: data.totalSpent ?? 0,
          totalOrders: data.totalOrders ?? 0
        } as Customer;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update customer
  static async updateCustomer(businessId: string, customerId: string, updates: Partial<Customer>): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'customers', customerId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      await updateDoc(docRef, updateData);
      console.log(`Customer ${customerId} successfully updated: totalSpent=${updateData.totalSpent}, totalOrders=${updateData.totalOrders}`);
    } catch (error) {
      console.error(`Error updating customer ${customerId}:`, error);
      throw error;
    }
  }

  // Delete customer
  static async deleteCustomer(businessId: string, customerId: string): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'customers', customerId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  // Update customer stats (usually called when orders are created/updated)
  static async updateCustomerStats(
    businessId: string, 
    customerId: string, 
    orderValue: number, 
    isNewOrder: boolean = true
  ): Promise<void> {
    try {
      const customer = await this.getCustomerById(businessId, customerId);
      if (!customer) {
        console.warn('Customer not found for stats update:', customerId);
        return;
      }

      const newTotalSpent = (customer.totalSpent || 0) + orderValue;
      const newTotalOrders = isNewOrder ? (customer.totalOrders || 0) + 1 : (customer.totalOrders || 0);

      console.log(`Updating customer ${customer.name}: totalSpent ${customer.totalSpent || 0} → ${newTotalSpent}, totalOrders ${customer.totalOrders || 0} → ${newTotalOrders}`);

      const updates: Partial<Customer> = {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        lastOrderAt: Timestamp.now()
      };

      // Set firstOrderAt if this is the first order
      if ((customer.totalOrders || 0) === 0) {
        updates.firstOrderAt = Timestamp.now();
      }

      console.log('About to update customer with:', updates);
      await this.updateCustomer(businessId, customerId, updates);
      console.log('Customer database update completed successfully');
    } catch (error) {
      console.error('Error updating customer stats:', error);
      throw error;
    }
  }

  // Search customers by name or email
  static async searchCustomers(businessId: string, searchTerm: string): Promise<Customer[]> {
    try {
      // Note: This is a simple implementation. For better search, consider using
      // Algolia or implementing proper text search with Cloud Functions
      const customers = await this.getCustomersByBusinessId(businessId);
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      throw error;
    }
  }

  // Get customer by email (useful for checking if customer exists)
  static async getCustomerByEmail(businessId: string, email: string): Promise<Customer | null> {
    try {
      const customers = await this.getCustomersByBusinessId(businessId);
      return customers.find(customer => customer.email === email) || null;
    } catch (error) {
      throw error;
    }
  }
}