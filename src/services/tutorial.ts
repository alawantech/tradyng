import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    Timestamp
} from 'firebase/firestore';
import { FileUploadService } from './fileUpload';

export interface Tutorial {
    id?: string;
    title: string;
    description: string;
    videoUrl: string;
    videoName: string;
    videoType: string;
    language: 'hausa' | 'english';
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export class TutorialService {
    private static tutorialsCollection = collection(db, 'tutorials');

    static async createTutorial(tutorialData: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const now = Timestamp.now();
        const docRef = await addDoc(this.tutorialsCollection, {
            ...tutorialData,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    }

    static async getTutorials(language?: 'hausa' | 'english'): Promise<Tutorial[]> {
        const querySnapshot = await getDocs(this.tutorialsCollection);
        let tutorials = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // We omit the heavy videoUrl here to keep the initial fetch lightweight
            // as per the requirement: "only fetch title and description"
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                language: data.language,
                order: data.order,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                // videoUrl is specifically NOT included here
                videoUrl: ''
            } as Tutorial;
        });

        if (language) {
            tutorials = tutorials.filter(t => t.language === language);
        }

        // Sort by order (asc), then by createdAt (desc)
        return tutorials.sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
    }

    static async updateTutorial(tutorialId: string, updates: Partial<Tutorial>): Promise<void> {
        const tutorialDoc = doc(db, 'tutorials', tutorialId);
        await updateDoc(tutorialDoc, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    }

    static async deleteTutorial(tutorialId: string, videoUrl?: string): Promise<void> {
        if (videoUrl) {
            try {
                await FileUploadService.deleteFile(videoUrl);
            } catch (error) {
                console.error('Error deleting tutorial video from storage:', error);
            }
        }
        const tutorialDoc = doc(db, 'tutorials', tutorialId);
        await deleteDoc(tutorialDoc);
    }

    static async getTutorialById(tutorialId: string): Promise<Tutorial> {
        const tutorialDoc = doc(db, 'tutorials', tutorialId);
        const snap = await getDoc(tutorialDoc);
        return {
            id: snap.id,
            ...snap.data()
        } as Tutorial;
    }
}
