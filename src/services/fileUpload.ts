import { storage } from '../config/firebase';
import { ref, deleteObject } from 'firebase/storage';

export class FileUploadService {
    static async uploadFile(
        file: File,
        folder: string,
        fileName?: string
    ): Promise<string> {
        const timestamp = Date.now();
        const finalFileName = fileName || `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        const path = `${folder}/${finalFileName}`;

        try {
            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const base64String = base64Data.split(',')[1];

            // Call Cloud Function to upload directly
            const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';
            const project = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
            const url = `https://${region}-${project}.cloudfunctions.net/generateUploadUrl`;

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
                throw new Error('Failed to upload file (server error)');
            }

            const { publicUrl, uploaded } = await resp.json();

            if (!uploaded) {
                throw new Error('Upload was not completed');
            }

            return publicUrl;
        } catch (error) {
            console.error('File upload failed:', error);
            throw new Error('Failed to upload file. Please try again.');
        }
    }

    static async deleteFile(fileUrl: string): Promise<void> {
        try {
            const path = fileUrl.replace(/^https:\/\/storage.googleapis.com\/[A-Za-z0-9-_.]+\//, '');
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    static validateFile(file: File): { isValid: boolean; error?: string } {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: 'Only Images (JPG, PNG, WebP), PDF, and Word documents are allowed.'
            };
        }

        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'File size must be less than 10MB'
            };
        }

        return { isValid: true };
    }
}
