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
import { generateProductRating } from '../utils/productRatings';

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
  // Auto-generated rating fields
  averageRating?: number;
  totalReviews?: number;
}

export class ProductService {
  // Create a new product for a business
  static async createProduct(businessId: string, productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalReviews'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'businesses', businessId, 'products'), {
        ...productData,
        createdAt: now,
        updatedAt: now
      });
      
      // Generate automatic rating for the new product using its ID
      const productId = docRef.id;
      const rating = generateProductRating(productId);
      
      // Update the product with the generated rating
      await updateDoc(docRef, {
        averageRating: rating.averageRating,
        totalReviews: rating.totalReviews,
        updatedAt: now
      });
      
      return productId;
    } catch (error) {
      throw error;
    }
  }

  // Utility method to backfill ratings for existing products
  static async backfillProductRatings(businessId: string): Promise<void> {
    try {
      const products = await this.getProductsByBusinessId(businessId);
      const updatePromises = products
        .filter(product => !product.averageRating || !product.totalReviews)
        .map(async (product) => {
          if (product.id) {
            const rating = generateProductRating(product.id);
            await updateDoc(doc(db, 'businesses', businessId, 'products', product.id), {
              averageRating: rating.averageRating,
              totalReviews: rating.totalReviews,
              updatedAt: Timestamp.now()
            });
          }
        });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error backfilling product ratings:', error);
      throw error;
    }
  }

  // Get all products for a business
  static async getProductsByBusinessId(businessId: string): Promise<Product[]> {
    // For demo business, return mock products
    if (businessId === 'demo-business-id') {
      return [
        {
          id: 'demo-product-1',
          name: 'Luxury Rose Perfume',
          price: 89.99,
          description: 'An exquisite floral fragrance with hints of rose petals and vanilla. Perfect for special occasions.',
          images: [
            'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg?auto=compress&cs=tinysrgb&w=500',
            'https://images.pexels.com/photos/1377034/pexels-photo-1377034.jpeg?auto=compress&cs=tinysrgb&w=500'
          ],
          category: 'Perfumes',
          stock: 25,
          sku: 'ROSE-001',
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tags: ['luxury', 'floral', 'rose']
        },
        {
          id: 'demo-product-2',
          name: 'Vanilla Body Mist',
          price: 24.99,
          description: 'A light and refreshing body mist with warm vanilla notes. Perfect for daily wear.',
          images: [
            'https://images.pexels.com/photos/3997994/pexels-photo-3997994.jpeg?auto=compress&cs=tinysrgb&w=500',
            'https://images.pexels.com/photos/6621374/pexels-photo-6621374.jpeg?auto=compress&cs=tinysrgb&w=500'
          ],
          category: 'Body Mists',
          stock: 40,
          sku: 'VANILLA-001',
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tags: ['vanilla', 'sweet', 'light']
        },
        {
          id: 'demo-product-3',
          name: 'Citrus Burst Cologne',
          price: 45.99,
          description: 'A fresh and energizing cologne with citrus notes. Ideal for everyday confidence.',
          images: [
            'https://images.pexels.com/photos/1553948/pexels-photo-1553948.jpeg?auto=compress&cs=tinysrgb&w=500',
            'https://images.pexels.com/photos/2180975/pexels-photo-2180975.jpeg?auto=compress&cs=tinysrgb&w=500'
          ],
          category: 'Colognes',
          stock: 30,
          sku: 'CITRUS-001',
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tags: ['citrus', 'fresh', 'energizing']
        },
        {
          id: 'demo-product-4',
          name: 'Premium Moisturizing Cream',
          price: 34.99,
          description: 'Rich moisturizing cream with natural ingredients. Leaves skin feeling soft and smooth.',
          images: [
            'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=500',
            'https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=500'
          ],
          category: 'Skincare',
          stock: 20,
          sku: 'MOIST-001',
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tags: ['moisturizer', 'skincare', 'natural']
        }
      ];
    }

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
    // For demo business, return specific demo product
    if (businessId === 'demo-business-id') {
      const demoProducts = await this.getProductsByBusinessId(businessId);
      return demoProducts.find(product => product.id === productId) || null;
    }

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