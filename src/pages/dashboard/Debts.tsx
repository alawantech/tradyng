import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    HandCoins,
    Pencil,
    X,
    Loader,
    Hash,
    Paperclip,
    FileText,
    Image as ImageIcon,
    ExternalLink,
    Calendar,
    User,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DebtService, Debt } from '../../services/debt';
import { FileUploadService } from '../../services/fileUpload';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const Debts: React.FC = () => {
    const { business, loading: authLoading } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    const [form, setForm] = useState({
        contactName: '',
        amount: '',
        type: 'to_pay' as 'to_pay' | 'to_collect',
        status: 'pending' as 'pending' | 'paid',
        description: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        receiptUrl: '',
        receiptName: '',
        receiptType: ''
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && business?.id) {
            loadDebts();
        }
    }, [business, authLoading]);

    const loadDebts = async () => {
        if (!business?.id) return;
        try {
            setLoading(true);
            const data = await DebtService.getDebtsByBusinessId(business.id);
            setDebts(data);
        } catch (error) {
            console.error('Error loading debts:', error);
            toast.error('Failed to load debts');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business?.id) return;

        if (!form.contactName.trim() || !form.amount || !form.date) {
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
                        `businesses/${business.id}/debts`
                    );
                    uploadedName = receiptFile.name;
                    uploadedType = receiptFile.type;
                } catch (error: any) {
                    toast.error(error.message || 'Failed to upload attachment');
                    setUploading(false);
                    setSaving(false);
                    return;
                }
                setUploading(false);
            }

            const debtData = {
                contactName: form.contactName.trim(),
                amount: amount,
                type: form.type,
                status: form.status,
                description: form.description.trim(),
                date: Timestamp.fromDate(new Date(form.date)),
                dueDate: form.dueDate ? Timestamp.fromDate(new Date(form.dueDate)) : null,
                receiptUrl: uploadedUrl || null,
                receiptName: uploadedName || null,
                receiptType: uploadedType || null
            };

            if (editingDebt?.id) {
                await DebtService.updateDebt(business.id, editingDebt.id, debtData);
                toast.success('Debt updated');
            } else {
                await DebtService.createDebt(business.id, debtData);
                toast.success('Debt recorded');
            }

            setShowModal(false);
            resetForm();
            loadDebts();
        } catch (error) {
            console.error('Error saving debt:', error);
            toast.error('Failed to save record');
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const resetForm = () => {
        setForm({
            contactName: '',
            amount: '',
            type: 'to_pay',
            status: 'pending',
            description: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: '',
            receiptUrl: '',
            receiptName: '',
            receiptType: ''
        });
        setEditingDebt(null);
        setReceiptFile(null);
    };

    const handleEdit = (debt: Debt) => {
        setEditingDebt(debt);
        setForm({
            contactName: debt.contactName,
            amount: debt.amount.toString(),
            type: debt.type,
            status: debt.status,
            description: debt.description,
            date: debt.date.toDate().toISOString().split('T')[0],
            dueDate: debt.dueDate ? debt.dueDate.toDate().toISOString().split('T')[0] : '',
            receiptUrl: debt.receiptUrl || '',
            receiptName: debt.receiptName || '',
            receiptType: debt.receiptType || ''
        });
        setReceiptFile(null);
        setShowModal(true);
    };

    const handleDelete = async (debt: Debt) => {
        if (!business?.id || !window.confirm('Are you sure you want to delete this record?')) return;
        try {
            if (debt.receiptUrl) {
                await FileUploadService.deleteFile(debt.receiptUrl);
            }
            await DebtService.deleteDebt(business.id, debt.id!);
            toast.success('Record removed');
            loadDebts();
        } catch (error) {
            console.error('Error deleting debt:', error);
            toast.error('Failed to delete record');
        }
    };

    const toggleStatus = async (debt: Debt) => {
        if (!business?.id || !debt.id) return;
        const newStatus = debt.status === 'pending' ? 'paid' : 'pending';
        try {
            await DebtService.updateDebt(business.id, debt.id, { status: newStatus });
            toast.success(`Marked as ${newStatus}`);
            loadDebts();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const filteredDebts = debts.filter(d => {
        const date = d.date.toDate();
        const matchesYear = !selectedYear || date.getFullYear().toString() === selectedYear;
        const matchesMonth = !selectedMonth || (date.getMonth() + 1).toString() === selectedMonth;
        const matchesDay = !selectedDay || date.getDate().toString() === selectedDay;
        const matchesType = !selectedType || d.type === selectedType;
        const matchesStatus = !selectedStatus || d.status === selectedStatus;

        return matchesYear && matchesMonth && matchesDay && matchesType && matchesStatus;
    });

    const totalToPay = filteredDebts
        .filter(d => d.type === 'to_pay' && d.status === 'pending')
        .reduce((sum, d) => sum + d.amount, 0);

    const totalToCollect = filteredDebts
        .filter(d => d.type === 'to_collect' && d.status === 'pending')
        .reduce((sum, d) => sum + d.amount, 0);

    const getPeriodLabel = () => {
        if (!selectedYear && !selectedMonth && !selectedDay) return 'Overall';

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let label = '';

        if (selectedDay) label += `${selectedDay} `;
        if (selectedMonth) label += `${monthNames[parseInt(selectedMonth) - 1]} `;
        if (selectedYear) label += selectedYear;

        return label.trim();
    };

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
                    <h1 className="text-2xl font-bold text-gray-900">Debts Tracking</h1>
                    <p className="text-gray-600">Manage money you need to pay or collect</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-gradient-to-r from-red-600 to-red-400 shadow-md rounded-xl px-4 py-3 flex items-center min-w-[160px]">
                        <div className="text-white">
                            <div className="text-xs font-medium opacity-80 uppercase tracking-wider">To Pay</div>
                            <div className="text-xl font-bold">
                                {formatCurrency(totalToPay, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-md rounded-xl px-4 py-3 flex items-center min-w-[160px]">
                        <div className="text-white">
                            <div className="text-xs font-medium opacity-80 uppercase tracking-wider">To Collect</div>
                            <div className="text-xl font-bold">
                                {formatCurrency(totalToCollect, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3 items-center">
                <Button onClick={() => setShowModal(true)} className="sm:mr-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Record New
                </Button>

                <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2"></div>

                <div className="flex flex-wrap gap-2">
                    <select
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">All Years</option>
                        {[...new Set(debts.map(d => d.date.toDate().getFullYear()))]
                            .sort((a, b) => b - a)
                            .map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))
                        }
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'short' })}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="to_pay">To Pay</option>
                        <option value="to_collect">To Collect</option>
                    </select>

                    <select
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">Any Status</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                    </select>

                    {(selectedYear || selectedMonth || selectedDay || selectedType || selectedStatus) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedYear('');
                                setSelectedMonth('');
                                setSelectedDay('');
                                setSelectedType('');
                                setSelectedStatus('');
                            }}
                            className="text-gray-500 hover:text-red-600 h-9"
                        >
                            <X className="mr-1 h-3 w-3" />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-2 mb-4">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">{getPeriodLabel()}</span> activity:
                    <span className="ml-2">Showing {filteredDebts.length} records</span>
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Contact / Entity</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            <th className="px-6 py-4 font-semibold text-center">Receipt</th>
                            <th className="px-6 py-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDebts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <HandCoins className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                    <p>No records for this period</p>
                                </td>
                            </tr>
                        ) : (
                            filteredDebts.map((debt) => (
                                <tr key={debt.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        <div className="flex flex-col">
                                            <span>{debt.date.toDate().toLocaleDateString()}</span>
                                            {debt.dueDate && (
                                                <span className={`text-[10px] flex items-center mt-0.5 ${debt.status === 'pending' && debt.dueDate.toDate() < new Date() ? 'text-red-500 font-bold' : 'text-gray-400'
                                                    }`}>
                                                    <Clock className="h-2 w-2 mr-1" />
                                                    Due: {debt.dueDate.toDate().toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{debt.contactName}</span>
                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{debt.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${debt.type === 'to_pay'
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            {debt.type === 'to_pay' ? 'To Pay' : 'To Collect'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(debt)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${debt.status === 'paid'
                                                ? 'bg-gray-100 text-gray-700'
                                                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                                }`}
                                        >
                                            {debt.status === 'paid' ? (
                                                <><CheckCircle2 className="h-3 w-3" /> Paid</>
                                            ) : (
                                                <><Clock className="h-3 w-3" /> Pending</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatCurrency(debt.amount, business?.settings?.currency || DEFAULT_CURRENCY)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {debt.receiptUrl ? (
                                            <a
                                                href={debt.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                            >
                                                {debt.receiptType?.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 border border-gray-100 shadow-sm" onClick={() => handleEdit(debt)}>
                                                    <Pencil className="h-5 w-5 text-gray-400" />
                                                </Button>
                                                <span className="text-[10px] text-gray-400 font-medium">Edit</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:text-red-600 hover:bg-red-50 border border-gray-100 shadow-sm" onClick={() => handleDelete(debt)}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold">
                                {editingDebt ? 'Edit Record' : 'New Debt Record'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }}>
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${form.type === 'to_pay' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                                    onClick={() => setForm(prev => ({ ...prev, type: 'to_pay' }))}
                                >
                                    To Pay
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${form.type === 'to_collect' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                                    onClick={() => setForm(prev => ({ ...prev, type: 'to_collect' }))}
                                >
                                    To Collect
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact / Person Name *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <User className="h-4 w-4" />
                                    </span>
                                    <Input
                                        name="contactName"
                                        value={form.contactName}
                                        onChange={handleFormChange}
                                        placeholder="e.g., Supplier X, John Doe"
                                        className="pl-9"
                                        required
                                    />
                                </div>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Date *</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                    </span>
                                    <Input
                                        name="dueDate"
                                        type="date"
                                        value={form.dueDate}
                                        onChange={handleFormChange}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    placeholder="Add notes..."
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Document/Bill)</label>
                                <div className="mt-1 flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="debt-upload"
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <label
                                            htmlFor="debt-upload"
                                            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                                        >
                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                                                {receiptFile ? receiptFile.name : form.receiptName || 'Click to upload proof'}
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
                                    {uploading ? 'Uploading...' : saving ? 'Saving...' : editingDebt ? 'Update' : 'Record Debt'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
