import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class ImageUploadService {
  // Upload single image
  static async uploadImage(
    file: File, 
    folder: string, 
    fileName?: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const finalFileName = fileName || `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${finalFileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(
    files: File[], 
    folder: string
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) => {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${index}_${file.name}`;
        return this.uploadImage(file, folder, fileName);
      });
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  // Delete image
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Validate file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB'
      };
    }
    
    return { isValid: true };
  }

  // Generate thumbnail URL (you can implement this with a cloud function later)
  static generateThumbnailUrl(originalUrl: string): string {
    // For now, return original URL
    // In production, you might want to generate thumbnails using Cloud Functions
    return originalUrl;
  }
}