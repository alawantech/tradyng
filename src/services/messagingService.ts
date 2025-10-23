// Messaging Service for admin-customer communication
import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface Message {
  id?: string;
  businessId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  sender: 'admin' | 'customer';
  senderName: string;
  senderEmail?: string;
  message: string;
  status: 'sent' | 'delivered' | 'read';
  messageType: 'text' | 'system';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isReadByAdmin?: boolean;
  isReadByCustomer?: boolean;
}

export interface Conversation {
  businessId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  lastMessage: Message;
  unreadCount: number;
  totalMessages: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class MessagingService {
  // Send a message from admin to customer
  static async sendMessageToCustomer(
    businessId: string,
    customerId: string,
    message: string,
    sender: 'admin' | 'customer',
    senderName: string,
    senderEmail?: string
  ): Promise<string> {
    try {
      // Get customer details
      const customerRef = doc(db, 'businesses', businessId, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);

      if (!customerSnap.exists()) {
        throw new Error('Customer not found');
      }

      const customerData = customerSnap.data();
      const customerEmail = customerData.email;
      const customerName = customerData.name || 'Customer';

      const messageData: Omit<Message, 'id'> = {
        businessId,
        customerId,
        customerEmail,
        customerName,
        sender,
        senderName,
        senderEmail: senderEmail || null,
        message: message.trim(),
        status: 'sent',
        messageType: 'text',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isReadByAdmin: sender === 'admin',
        isReadByCustomer: sender === 'customer'
      };

      const docRef = await addDoc(
        collection(db, 'businesses', businessId, 'customers', customerId, 'messages'),
        messageData
      );

      // Send email notification
      try {
        await this.sendMessageNotification(messageData);
      } catch (emailError) {
        console.error('Failed to send message notification email:', emailError);
        // Don't fail the message sending if email fails
      }

      return docRef.id;
    } catch (error) {
      console.error('Error sending message to customer:', error);
      throw error;
    }
  }

  // Get all messages for a customer conversation
  static async getCustomerMessages(
    businessId: string,
    customerId: string,
    limitCount: number = 50
  ): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);

      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Reverse to show oldest first
      return messages.reverse();
    } catch (error) {
      console.error('Error getting customer messages:', error);
      throw error;
    }
  }

  // Get all conversations for a business (admin view)
  static async getBusinessConversations(businessId: string): Promise<Conversation[]> {
    try {
      // Get all customers for this business
      const customersRef = collection(db, 'businesses', businessId, 'customers');
      const customersSnapshot = await getDocs(customersRef);

      const conversations: Conversation[] = [];

      for (const customerDoc of customersSnapshot.docs) {
        const customerId = customerDoc.id;
        const customerData = customerDoc.data();

        // Get the latest message for this customer
        const messagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
        const messagesSnapshot = await getDocs(q);

        if (!messagesSnapshot.empty) {
          const lastMessage = {
            id: messagesSnapshot.docs[0].id,
            ...messagesSnapshot.docs[0].data()
          } as Message;

          // Count unread messages for admin
          const allMessagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
          const unreadQuery = query(allMessagesRef, where('isReadByAdmin', '==', false));
          const unreadSnapshot = await getDocs(unreadQuery);

          conversations.push({
            businessId,
            customerId,
            customerEmail: customerData.email,
            customerName: customerData.name || 'Customer',
            lastMessage,
            unreadCount: unreadSnapshot.size,
            totalMessages: messagesSnapshot.size,
            createdAt: lastMessage.createdAt,
            updatedAt: lastMessage.updatedAt
          });
        }
      }

      // Sort by last message date (newest first)
      return conversations.sort((a, b) =>
        b.lastMessage.createdAt.toMillis() - a.lastMessage.createdAt.toMillis()
      );
    } catch (error) {
      console.error('Error getting business conversations:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(
    businessId: string,
    customerId: string,
    reader: 'admin' | 'customer'
  ): Promise<void> {
    try {
      const messagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
      const q = query(messagesRef, where(`isReadBy${reader === 'admin' ? 'Admin' : 'Customer'}`, '==', false));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          [`isReadBy${reader === 'admin' ? 'Admin' : 'Customer'}`]: true,
          updatedAt: Timestamp.now()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread message count for admin
  static async getUnreadMessageCount(businessId: string): Promise<number> {
    try {
      // Get all customers
      const customersRef = collection(db, 'businesses', businessId, 'customers');
      const customersSnapshot = await getDocs(customersRef);

      let totalUnread = 0;

      for (const customerDoc of customersSnapshot.docs) {
        const customerId = customerDoc.id;
        const messagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
        const q = query(messagesRef, where('isReadByAdmin', '==', false));
        const unreadSnapshot = await getDocs(q);
        totalUnread += unreadSnapshot.size;
      }

      return totalUnread;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  // Listen to real-time message updates for a customer conversation
  static subscribeToCustomerMessages(
    businessId: string,
    customerId: string,
    callback: (messages: Message[]) => void
  ) {
    const messagesRef = collection(db, 'businesses', businessId, 'customers', customerId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      callback(messages);
    });
  }

  // Listen to real-time conversation updates for admin
  static subscribeToConversations(
    businessId: string,
    callback: (conversations: Conversation[]) => void
  ) {
    const customersRef = collection(db, 'businesses', businessId, 'customers');

    return onSnapshot(customersRef, async () => {
      // Re-fetch conversations when customers change
      const conversations = await this.getBusinessConversations(businessId);
      callback(conversations);
    });
  }

  // Send email notification for new message
  private static async sendMessageNotification(messageData: Message): Promise<void> {
    try {
      // Get business details
      const businessRef = doc(db, 'businesses', messageData.businessId);
      const businessSnap = await getDoc(businessRef);

      let businessName = 'Your Store';
      let businessEmail = '';

      if (businessSnap.exists()) {
        const businessData = businessSnap.data();
        businessName = businessData.name || 'Your Store';
        businessEmail = businessData.email || '';
      }

      const notificationData = {
        businessId: messageData.businessId,
        customerId: messageData.customerId,
        message: messageData.message,
        sender: messageData.sender,
        senderName: messageData.senderName,
        customerEmail: messageData.customerEmail,
        customerName: messageData.customerName,
        businessName,
        businessEmail
      };

      // Call the Cloud Function to send email notification
      const response = await fetch('https://us-central1-tradyng-51655.cloudfunctions.net/sendMessageNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.status}`);
      }

      console.log('Message notification email sent successfully');
    } catch (error) {
      console.error('Error sending message notification:', error);
      throw error;
    }
  }

  // Send system message (for automated notifications)
  static async sendSystemMessage(
    businessId: string,
    customerId: string,
    message: string
  ): Promise<string> {
    try {
      const messageData: Omit<Message, 'id'> = {
        businessId,
        customerId,
        customerEmail: '', // Will be filled by the function
        customerName: '', // Will be filled by the function
        sender: 'admin',
        senderName: 'System',
        message: message.trim(),
        status: 'sent',
        messageType: 'system',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isReadByAdmin: true,
        isReadByCustomer: false
      };

      const docRef = await addDoc(
        collection(db, 'businesses', businessId, 'customers', customerId, 'messages'),
        messageData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }
}