import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';

export interface Debt {
    id?: string;
    contactName: string;
    amount: number;
    type: 'to_pay' | 'to_collect';
    status: 'pending' | 'paid';
    description: string;
    date: Timestamp;
    dueDate?: Timestamp | null;
    receiptUrl?: string | null;
    receiptName?: string | null;
    receiptType?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export class DebtService {
    private static getCollection(businessId: string) {
        return collection(db, 'businesses', businessId, 'debts');
    }

    static async createDebt(businessId: string, debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const now = Timestamp.now();
        const docRef = await addDoc(this.getCollection(businessId), {
            ...debtData,
            createdAt: now,
            updatedAt: now,
        });
        return docRef.id;
    }

    static async getDebtsByBusinessId(businessId: string): Promise<Debt[]> {
        const q = query(this.getCollection(businessId), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Debt));
    }

    static async updateDebt(businessId: string, debtId: string, updates: Partial<Debt>): Promise<void> {
        const debtDoc = doc(db, 'businesses', businessId, 'debts', debtId);
        await updateDoc(debtDoc, {
            ...updates,
            updatedAt: Timestamp.now()
        });
    }

    static async deleteDebt(businessId: string, debtId: string): Promise<void> {
        const debtDoc = doc(db, 'businesses', businessId, 'debts', debtId);
        await deleteDoc(debtDoc);
    }
}
