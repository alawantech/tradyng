import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  doc,
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
        where('businessId', '==', businessId)
      );
      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      // Filter out default categories that may have been created previously
      const defaultCategories = [
        'Perfume', 'Body Mist', 'Body Spray', 'Beauty', 'Fashion', 'Electronics',
        'Home & Garden', 'Health & Wellness', 'Sports & Outdoors', 'Food & Beverages',
        'Books & Media', 'Toys & Games', 'Automotive', 'Arts & Crafts', 'Jewelry & Accessories'
      ];

      const filteredCategories = categories.filter(cat => !defaultCategories.includes(cat.name));

      // If we filtered out any categories, clean them up in the background
      if (filteredCategories.length < categories.length) {
        const categoriesToDelete = categories.filter(cat => defaultCategories.includes(cat.name));
        categoriesToDelete.forEach(async (cat) => {
          try {
            if (cat.id) {
              await deleteDoc(doc(db, 'categories', cat.id));
              console.log(`Cleaned up default category: ${cat.name}`);
            }
          } catch (error) {
            console.warn(`Failed to delete default category ${cat.name}:`, error);
          }
        });
      }

      return filteredCategories;
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
}