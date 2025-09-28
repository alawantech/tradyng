import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface Category {
  id?: string;
  name: string;
  businessId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class CategoryService {
  // Get categories for a specific business
  static async getCategoriesByBusinessId(businessId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'), 
        where('businessId', '==', businessId),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Create a new category
  static async createCategory(businessId: string, categoryName: string): Promise<string> {
    try {
      // Check if category already exists for this business
      const existing = await this.getCategoryByName(businessId, categoryName);
      if (existing) {
        return existing.id!; // Return existing category ID
      }

      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'categories'), {
        name: categoryName.trim(),
        businessId,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Get category by name for a business
  static async getCategoryByName(businessId: string, categoryName: string): Promise<Category | null> {
    try {
      const q = query(
        collection(db, 'categories'), 
        where('businessId', '==', businessId),
        where('name', '==', categoryName.trim())
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Category;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding category:', error);
      throw error;
    }
  }

  // Get default categories (common categories for new businesses)
  static getDefaultCategories(): string[] {
    return [
      'Fashion',
      'African Wear',
      'Electronics',
      'Home & Garden',
      'Beauty & Personal Care',
      'Sports & Outdoors',
      'Books & Media',
      'Food & Beverages',
      'Health & Wellness',
      'Toys & Games',
      'Automotive',
      'Arts & Crafts',
      'Jewelry & Accessories',
      'Bags & Shoes',
      'Office Supplies'
    ];
  }

  // Initialize default categories for a new business
  static async initializeDefaultCategories(businessId: string): Promise<void> {
    try {
      const defaultCategories = this.getDefaultCategories();
      const promises = defaultCategories.map(categoryName => 
        this.createCategory(businessId, categoryName)
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error initializing default categories:', error);
      // Don't throw - this is optional initialization
    }
  }
}