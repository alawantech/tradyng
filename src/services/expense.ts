import { db } from '../config/firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';

export interface Expense {
    id?: string;
    description: string;
    amount: number;
    category: string;
    date: Timestamp;
    paymentMethod: string;
    receiptUrl?: string | null;
    receiptName?: string | null;
    receiptType?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export class ExpenseService {
    static async createExpense(businessId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const now = Timestamp.now();
            const docRef = await addDoc(collection(db, 'businesses', businessId, 'expenses'), {
                ...expenseData,
                createdAt: now,
                updatedAt: now
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    }

    static async getExpensesByBusinessId(businessId: string): Promise<Expense[]> {
        try {
            const q = query(
                collection(db, 'businesses', businessId, 'expenses'),
                orderBy('date', 'desc')
            );
            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date : new Timestamp(data.date.seconds, data.date.nanoseconds)
                };
            }) as Expense[];
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    }

    static async updateExpense(businessId: string, expenseId: string, updates: Partial<Expense>): Promise<void> {
        try {
            const docRef = doc(db, 'businesses', businessId, 'expenses', expenseId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    static async deleteExpense(businessId: string, expenseId: string): Promise<void> {
        try {
            const docRef = doc(db, 'businesses', businessId, 'expenses', expenseId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    static async getUniqueCategories(businessId: string): Promise<string[]> {
        try {
            const expenses = await this.getExpensesByBusinessId(businessId);
            const categories = expenses.map(e => e.category);
            return Array.from(new Set(categories)).filter(c => c && c.trim() !== '');
        } catch (error) {
            console.error('Error fetching unique categories:', error);
            return [];
        }
    }
}
