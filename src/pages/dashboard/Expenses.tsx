import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Receipt,
    DollarSign,
    Pencil,
    X,
    Loader,
    Hash,
    Paperclip,
    FileText,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ExpenseService, Expense } from '../../services/expense';
import { FileUploadService } from '../../services/fileUpload';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const Expenses: React.FC = () => {
    const { business, loading: authLoading } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        receiptUrl: '',
        receiptName: '',
        receiptType: ''
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && business?.id) {
            loadExpenses();
            loadCategories();
        }
    }, [business, authLoading]);

    const loadExpenses = async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            const data = await ExpenseService.getExpensesByBusinessId(business.id);
            setExpenses(data);
        } catch (error) {
            console.error('Error loading expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        if (!business?.id) return;
        const categories = await ExpenseService.getUniqueCategories(business.id);
        setExistingCategories(categories);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business?.id) return;

        if (!form.description.trim() || !form.amount || !form.category.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setSaving(true);

            let uploadedUrl = form.receiptUrl;
            let uploadedName = form.receiptName;
            let uploadedType = form.receiptType;

            if (receiptFile) {
                setUploading(true);
                try {
                    uploadedUrl = await FileUploadService.uploadFile(
                        receiptFile,
                        `businesses/${business.id}/receipts`
                    );
                    uploadedName = receiptFile.name;
                    uploadedType = receiptFile.type;
                } catch (error: any) {
                    toast.error(error.message || 'Failed to upload receipt');
                    setUploading(false);
                    setSaving(false);
                    return;
                }
                setUploading(false);
            }

            const expenseData = {
                description: form.description.trim(),
                amount: amount,
                category: form.category.trim(),
                date: Timestamp.fromDate(new Date(form.date)),
                paymentMethod: form.paymentMethod,
                receiptUrl: uploadedUrl || null,
                receiptName: uploadedName || null,
                receiptType: uploadedType || null
            };

            if (editingExpense?.id) {
                await ExpenseService.updateExpense(business.id, editingExpense.id, expenseData);
                toast.success('Expense updated');
            } else {
                await ExpenseService.createExpense(business.id, expenseData);
                toast.success('Expense added');
            }

            setShowModal(false);
            resetForm();
            loadExpenses();
            loadCategories();
        } catch (error) {
            console.error('Error saving expense:', error);
            toast.error('Failed to save expense');
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const resetForm = () => {
        setForm({
            description: '',
            amount: '',
            category: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cash',
            receiptUrl: '',
            receiptName: '',
            receiptType: ''
        });
        setEditingExpense(null);
        setReceiptFile(null);
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setForm({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.date.toDate().toISOString().split('T')[0],
            paymentMethod: expense.paymentMethod,
            receiptUrl: expense.receiptUrl || '',
            receiptName: expense.receiptName || '',
            receiptType: expense.receiptType || ''
        });
        setReceiptFile(null);
        setShowModal(true);
    };

    const handleDelete = async (expense: Expense) => {
        if (!business?.id || !window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            if (expense.receiptUrl) {
                await FileUploadService.deleteFile(expense.receiptUrl);
            }
            await ExpenseService.deleteExpense(business.id, expense.id!);
            toast.success('Expense removed');
            loadExpenses();
            loadCategories();
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = FileUploadService.validateFile(file);
            if (!validation.isValid) {
                toast.error(validation.error || 'Invalid file');
                return;
            }
            setReceiptFile(file);
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const date = e.date.toDate();
        const matchesCategory = !selectedCategory || e.category === selectedCategory;
        const matchesYear = !selectedYear || date.getFullYear().toString() === selectedYear;
        const matchesMonth = !selectedMonth || (date.getMonth() + 1).toString() === selectedMonth;
        const matchesDay = !selectedDay || date.getDate().toString() === selectedDay;

        return matchesCategory && matchesYear && matchesMonth && matchesDay;
    });

    const getPeriodLabel = () => {
        if (!selectedYear && !selectedMonth && !selectedDay) return 'Total Expenses';

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let label = '';

        if (selectedDay) label += `${selectedDay} `;
        if (selectedMonth) label += `${monthNames[parseInt(selectedMonth) - 1]} `;
        if (selectedYear) label += selectedYear;

        return `${label.trim()} Expenses`;
    };

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (authLoading || loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 pt-20">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-600">Track and manage your business expenditures</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-gradient-to-r from-red-500 to-orange-400 shadow-lg rounded-xl px-6 py-4 flex items-center min-w-[200px]">
                        <DollarSign className="h-8 w-8 text-white mr-4" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(totalAmount, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </div>
                            <div className="text-sm text-red-100 font-medium">{getPeriodLabel()}</div>
                        </div>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Button>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="min-w-[120px]">
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">All Years</option>
                        {[...new Set(expenses.map(exp => exp.date.toDate().getFullYear()))]
                            .sort((a, b) => b - a)
                            .map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="min-w-[120px]">
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[100px]">
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                    >
                        <option value="">All Days</option>
                        {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <div className="min-w-[140px]">
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {existingCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {(selectedYear || selectedMonth || selectedDay || selectedCategory) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedYear('');
                            setSelectedMonth('');
                            setSelectedDay('');
                            setSelectedCategory('');
                        }}
                        className="text-gray-500 hover:text-red-600"
                    >
                        <X className="mr-1 h-4 w-4" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Description</th>
                            <th className="px-6 py-4 font-semibold">Category</th>
                            <th className="px-6 py-4 font-semibold">Method</th>
                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            <th className="px-6 py-4 font-semibold text-center">Receipt</th>
                            <th className="px-6 py-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <Receipt className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p>No expenses found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        {expense.date.toDate().toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {expense.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100 italic">
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {expense.paymentMethod}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatCurrency(expense.amount, business?.settings?.currency || DEFAULT_CURRENCY)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                                title={expense.receiptName || 'View Receipt'}
                                            >
                                                {expense.receiptType?.startsWith('image/') ? (
                                                    <ImageIcon className="h-4 w-4" />
                                                ) : (
                                                    <FileText className="h-4 w-4" />
                                                )}
                                                <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 border border-gray-100 shadow-sm hover:border-gray-300"
                                                    onClick={() => handleEdit(expense)}
                                                >
                                                    <Pencil className="h-5 w-5 text-gray-400" />
                                                </Button>
                                                <span className="text-[10px] text-gray-400 font-medium">Edit</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 hover:text-red-600 hover:bg-red-50 border border-gray-100 shadow-sm hover:border-red-200"
                                                    onClick={() => handleDelete(expense)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                                <span className="text-[10px] text-gray-400 font-medium">Delete</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <Card className="w-full max-w-md">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-lg font-bold">
                                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }}>
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <Input
                                    name="description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    placeholder="e.g., Office Supplies"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Hash className="h-4 w-4" />
                                        </span>
                                        <Input
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={handleFormChange}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <Input
                                        name="date"
                                        type="date"
                                        value={form.date}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <div className="space-y-2">
                                    <Input
                                        name="category"
                                        value={form.category}
                                        onChange={handleFormChange}
                                        placeholder="e.g., Inventory, Rent, Utilities"
                                        required
                                    />
                                    {existingCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-500 py-1">Recent:</span>
                                            {existingCategories.slice(0, 5).map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    className="bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs text-gray-600 transition-colors"
                                                    onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={form.paymentMethod}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Card">Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (Image, PDF, or Doc)</label>
                                <div className="mt-1 flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="receipt-upload"
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <label
                                            htmlFor="receipt-upload"
                                            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                                        >
                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                                                {receiptFile ? receiptFile.name : form.receiptName || 'Click to upload receipt'}
                                            </span>
                                        </label>
                                    </div>
                                    {(receiptFile || form.receiptUrl) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setReceiptFile(null);
                                                setForm(prev => ({ ...prev, receiptUrl: '', receiptName: '', receiptType: '' }));
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500 italic">Videos are not allowed. Max 10MB.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    disabled={saving || uploading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={saving || uploading}
                                >
                                    {uploading ? 'Uploading...' : saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
