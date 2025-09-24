import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class VideoUploadService {
  // Upload single video
  static async uploadVideo(
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
      console.error('Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  // Delete video
  static async deleteVideo(videoUrl: string): Promise<void> {
    try {
      const videoRef = ref(storage, videoUrl);
      await deleteObject(videoRef);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error('Failed to delete video');
    }
  }

  // Validate video file
  static validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB for videos
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only MP4, WebM, AVI, and MOV video formats are allowed'
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Video size must be less than 50MB'
      };
    }
    
    // Note: Duration validation would require loading the video
    // For now, we'll just validate file type and size
    // Duration will be checked on the client side after file selection
    
    return { isValid: true };
  }

  // Get video duration from file
  static getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  // Generate video thumbnail
  static generateVideoThumbnail(file: File, timeOffset: number = 1): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
        
        window.URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
      
      video.src = URL.createObjectURL(file);
      video.currentTime = timeOffset;
    });
  }
}