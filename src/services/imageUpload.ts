import { storage } from '../config/firebase';
import { ref, deleteObject } from 'firebase/storage';
// We'll use signed URLs returned by the backend to upload files securely

export class ImageUploadService {
  // Upload single image
  static async uploadImage(
    file: File, 
    folder: string, 
    fileName?: string
  ): Promise<string> {
    const timestamp = Date.now();
    const finalFileName = fileName || `${timestamp}_${file.name}`;
    const path = `${folder}/${finalFileName}`;

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = base64Data.split(',')[1];

      // Call HTTP Cloud Function to upload directly
      const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
      const project = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
      const url = `https://${region}-${project}.cloudfunctions.net/generateUploadUrl`;

      // Get the current user's ID token to authorize the request
      const currentUser = (await import('firebase/auth')).getAuth().currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          path,
          contentType: file.type,
          fileData: base64String
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('generateUploadUrl failed', text);
        throw new Error('Failed to get upload URL (server error)');
      }

      const { publicUrl, uploaded } = await resp.json();

      if (!uploaded) {
        throw new Error('Upload was not completed by server');
      }

      return publicUrl;
    } catch (error) {
      console.error('Direct upload failed:', error);
      throw new Error('Failed to upload image. Please try again.');
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
  // If imageUrl is a public https URL, extract the path after the bucket name
  const path = imageUrl.replace(/^https:\/\/storage.googleapis.com\/[A-Za-z0-9-_.]+\//, '');
  const imageRef = ref(storage, path);
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