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

export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  video?: string;
  category: string;
  stock: number;
  sku?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  sizes?: string[];
  colors?: string[];
}

export class ProductService {
  // Create a new product for a business
  static async createProduct(businessId: string, productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'businesses', businessId, 'products'), {
        ...productData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Get all products for a business
  static async getProductsByBusinessId(businessId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'businesses', businessId, 'products'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      throw error;
    }
  }

  // Get product by ID
  static async getProductById(businessId: string, productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update product
  static async updateProduct(businessId: string, productId: string, updates: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'products', productId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw error;
    }
  }

  // Delete product
  static async deleteProduct(businessId: string, productId: string): Promise<void> {
    try {
      const docRef = doc(db, 'businesses', businessId, 'products', productId);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }
}