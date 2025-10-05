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
  where,
  limit,
  setDoc,
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

// Enhanced customer interfaces for storefront
export interface CustomerAddress {
  id?: string;
  customerId: string;
  label: string; // e.g., "Home", "Work", "Default"
  isDefault: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
  };
  defaultAddressId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface CustomerOrderHistory {
  orderId: string;
  businessId: string;
  businessName: string;
  total: number;
  status: string;
  orderDate: Date;
  itemCount: number;
}

export class CustomerService {
  // ENHANCED STOREFRONT CUSTOMER METHODS
  
  // Create or update customer profile for storefront users
  static async createOrUpdateProfile(profileData: Partial<CustomerProfile> & { uid: string; email: string }): Promise<void> {
    try {
      const customerRef = doc(db, 'customers', profileData.uid);
      const existingCustomer = await getDoc(customerRef);
      
      if (existingCustomer.exists()) {
        // Update existing profile
        await updateDoc(customerRef, {
          ...profileData,
          updatedAt: Timestamp.now(),
          lastLoginAt: Timestamp.now()
        });
      } else {
        // Create new profile
        const [firstName = '', lastName = ''] = (profileData.displayName || '').split(' ');
        const newCustomer: CustomerProfile = {
          id: profileData.uid,
          displayName: profileData.displayName || '',
          firstName: profileData.firstName || firstName,
          lastName: profileData.lastName || lastName,
          phone: profileData.phone || '',
          preferences: {
            emailNotifications: true,
            smsNotifications: true,
            promotionalEmails: true,
          },
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
          lastLoginAt: Timestamp.now() as any,
          isActive: true,
          ...profileData
        };
        
        await setDoc(customerRef, newCustomer);
      }
    } catch (error) {
      console.error('Error creating/updating customer profile:', error);
      throw error;
    }
  }

  // Get customer profile
  static async getProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        const data = customerSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastLoginAt: data.lastLoginAt?.toDate(),
        } as CustomerProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting customer profile:', error);
      throw error;
    }
  }

  // Update customer profile
  static async updateProfile(customerId: string, updates: Partial<CustomerProfile>): Promise<void> {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }

  // Add customer address
  static async addAddress(addressData: Omit<CustomerAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // If this is being set as default, update the previous default
      if (addressData.isDefault) {
        await this.unsetDefaultAddress(addressData.customerId);
      }

      const addressesRef = collection(db, 'customer_addresses');
      const newAddress: Omit<CustomerAddress, 'id'> = {
        ...addressData,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      };
      
      const docRef = await addDoc(addressesRef, newAddress);
      
      // Update customer's default address if this is marked as default
      if (addressData.isDefault) {
        await this.updateProfile(addressData.customerId, { defaultAddressId: docRef.id });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer address:', error);
      throw error;
    }
  }

  // Get customer addresses
  static async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    try {
      const addressesRef = collection(db, 'customer_addresses');
      const q = query(
        addressesRef, 
        where('customerId', '==', customerId)
      );
      
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CustomerAddress[];
      
      // Sort in memory - default addresses first, then by creation date
      return addresses.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Error getting customer addresses:', error);
      throw error;
    }
  }

  // Get default address
  static async getDefaultAddress(customerId: string): Promise<CustomerAddress | null> {
    try {
      const addresses = await this.getAddresses(customerId);
      return addresses.find(addr => addr.isDefault) || addresses[0] || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      throw error;
    }
  }

  // Update address
  static async updateAddress(addressId: string, updates: Partial<CustomerAddress>): Promise<void> {
    try {
      const addressRef = doc(db, 'customer_addresses', addressId);
      
      // If setting as default, unset previous default
      if (updates.isDefault && updates.customerId) {
        await this.unsetDefaultAddress(updates.customerId);
        await this.updateProfile(updates.customerId, { defaultAddressId: addressId });
      }
      
      await updateDoc(addressRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating customer address:', error);
      throw error;
    }
  }

  // Delete address
  static async deleteAddress(addressId: string, customerId: string): Promise<void> {
    try {
      const addressRef = doc(db, 'customer_addresses', addressId);
      await deleteDoc(addressRef);
      
      // If this was the default address, unset it from customer profile
      const profile = await this.getProfile(customerId);
      if (profile?.defaultAddressId === addressId) {
        await this.updateProfile(customerId, { defaultAddressId: undefined });
      }
    } catch (error) {
      console.error('Error deleting customer address:', error);
      throw error;
    }
  }

  // Set address as default
  static async setDefaultAddress(customerId: string, addressId: string): Promise<void> {
    try {
      // Unset previous default
      await this.unsetDefaultAddress(customerId);
      
      // Set new default
      await this.updateAddress(addressId, { isDefault: true });
      await this.updateProfile(customerId, { defaultAddressId: addressId });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }

  // Unset default address (private helper)
  private static async unsetDefaultAddress(customerId: string): Promise<void> {
    try {
      const addresses = await this.getAddresses(customerId);
      const currentDefault = addresses.find(addr => addr.isDefault);
      
      if (currentDefault?.id) {
        const addressRef = doc(db, 'customer_addresses', currentDefault.id);
        await updateDoc(addressRef, { 
          isDefault: false,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error unsetting default address:', error);
      // Don't throw - this is a helper function
    }
  }

  // Create customer from checkout data (for guest checkout -> account creation)
  static async createFromCheckoutData(
    uid: string,
    email: string,
    checkoutData: {
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zipCode?: string;
      country?: string;
    }
  ): Promise<void> {
    try {
      // Create customer profile
      await this.createOrUpdateProfile({
        uid,
        email,
        displayName: `${checkoutData.firstName} ${checkoutData.lastName}`,
        firstName: checkoutData.firstName,
        lastName: checkoutData.lastName,
        phone: checkoutData.phone
      });

      // Add address as default
      await this.addAddress({
        customerId: uid,
        label: 'Default',
        isDefault: true,
        firstName: checkoutData.firstName,
        lastName: checkoutData.lastName,
        phone: checkoutData.phone,
        street: checkoutData.address,
        city: checkoutData.city,
        state: checkoutData.state,
        zipCode: checkoutData.zipCode || '',
        country: checkoutData.country || 'Nigeria'
      });
    } catch (error) {
      console.error('Error creating customer from checkout data:', error);
      throw error;
    }
  }

  // Check if customer exists by email
  static async customerExistsByEmail(email: string): Promise<CustomerProfile | null> {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
      } as CustomerProfile;
    } catch (error) {
      console.error('Error checking customer by email:', error);
      throw error;
    }
  }

  // Get customer order history for a specific business
  static async getOrderHistory(customerId: string, businessId?: string): Promise<CustomerOrderHistory[]> {
    try {
      let ordersQuery;
      
      if (businessId) {
        // Query with both customerId and businessId - this might need a simple index
        ordersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', customerId),
          where('businessId', '==', businessId)
        );
      } else {
        // Query only by customerId - single field query, no index needed
        ordersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', customerId)
        );
      }
      
      const querySnapshot = await getDocs(ordersQuery);
      
      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          orderId: data.orderId || doc.id,
          orderDate: data.createdAt?.toDate() || new Date(),
          status: data.status || 'pending',
          total: data.total || 0,
          itemCount: data.items?.length || 0,
          businessId: data.businessId,
          businessName: data.businessName
        };
      });
      
      // Sort in memory by date descending (newest first)
      return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  }

  // EXISTING ADMIN METHODS FOR BUSINESS CUSTOMER MANAGEMENT
  // Send a message to a customer (admin or customer)
  static async sendMessageToCustomer(businessId: string, customerId: string, message: string, sender: 'admin' | 'customer', senderName: string, senderEmail?: string): Promise<string> {
    try {
      const messageData = {
        message,
        sender,
        senderName,
        senderEmail: senderEmail || null,
        status: 'sent',
        createdAt: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, 'businesses', businessId, 'customers', customerId, 'messages'), messageData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }
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