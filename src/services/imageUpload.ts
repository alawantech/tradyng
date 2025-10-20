import { storage } from '../config/firebase';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
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

      // Call HTTP Cloud Function to get signed upload URL
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
        body: JSON.stringify({ path, contentType: file.type })
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('generateUploadUrl failed', text);
        throw new Error('Failed to get upload URL (server error)');
      }

      const { uploadUrl, publicUrl } = await resp.json();

      // Upload file directly to the signed URL via PUT
      const putResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!putResp.ok) {
        const text = await putResp.text();
        console.error('Signed upload failed', text);
        throw new Error('Signed upload failed');
      }

      return publicUrl;
    } catch (error) {
      console.error('Signed upload path failed:', error);
      throw new Error('Failed to upload image via signed URL. Ensure the upload function is reachable and returns a signed URL.');
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