import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface ContactMessage {
  id?: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ContactMessageService {
  private static collection = 'contactMessages';

  /**
   * Submit a new contact message
   */
  static async submitMessage(messageData: Omit<ContactMessage, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, this.collection), {
        ...messageData,
        status: 'new',
        createdAt: now,
        updatedAt: now
      });

      console.log('Contact message submitted successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting contact message:', error);
      throw new Error('Failed to submit message. Please try again.');
    }
  }

  /**
   * Get all contact messages for a specific business
   */
  static async getMessagesByBusinessId(businessId: string): Promise<ContactMessage[]> {
    try {
      console.log('🔍 Querying messages for business ID:', businessId);
      
      // Temporary: Remove orderBy to avoid index requirement
      const q = query(
        collection(db, this.collection),
        where('businessId', '==', businessId)
        // orderBy('createdAt', 'desc') // Commented out temporarily
      );

      console.log('📡 Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      const messages: ContactMessage[] = [];

      console.log('📥 Query completed. Document count:', querySnapshot.size);

      querySnapshot.forEach((doc) => {
        console.log('📄 Processing document:', doc.id, doc.data());
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ContactMessage);
      });

      // Sort manually in JavaScript instead
      messages.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

      console.log('✅ Successfully processed', messages.length, 'messages');
      return messages;
    } catch (error) {
      console.error('❌ Error fetching contact messages:', error);
      console.error('❌ Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        businessId
      });
      throw new Error('Failed to load messages: ' + (error as any)?.message || 'Unknown error');
    }
  }

  /**
   * Update message status (mark as read, responded, etc.)
   */
  static async updateMessageStatus(messageId: string, status: ContactMessage['status']): Promise<void> {
    try {
      const messageRef = doc(db, this.collection, messageId);
      await updateDoc(messageRef, {
        status,
        updatedAt: Timestamp.now()
      });

      console.log('Message status updated:', messageId, status);
    } catch (error) {
      console.error('Error updating message status:', error);
      throw new Error('Failed to update message status');
    }
  }

  /**
   * Delete a contact message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, messageId));
      console.log('Message deleted:', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Get message statistics for a business
   */
  static async getMessageStats(businessId: string): Promise<{
    total: number;
    new: number;
    read: number;
    responded: number;
  }> {
    try {
      const messages = await this.getMessagesByBusinessId(businessId);
      
      const stats = {
        total: messages.length,
        new: messages.filter(m => m.status === 'new').length,
        read: messages.filter(m => m.status === 'read').length,
        responded: messages.filter(m => m.status === 'responded').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting message stats:', error);
      throw new Error('Failed to load message statistics');
    }
  }
}