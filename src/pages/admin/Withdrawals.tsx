import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { AffiliateService, WithdrawalRequest } from '../../services/affiliate';
import { DollarSign, Clock, CheckCircle, XCircle, Banknote, User, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

// Helper function to send withdrawal status email
const sendWithdrawalNotification = async (
  withdrawal: WithdrawalRequest,
  status: 'approved' | 'rejected' | 'paid',
  rejectionReason?: string,
  transactionReference?: string
) => {
  try {
    const response = await fetch(
      'https://us-central1-tradyng-51655.cloudfunctions.net/sendWithdrawalStatusEmail',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateEmail: withdrawal.affiliateEmail,
          affiliateName: withdrawal.affiliateUsername,
          amount: withdrawal.amount,
          status,
          rejectionReason,
          transactionReference,
          withdrawalId: withdrawal.id
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    console.log('✅ Email notification sent to:', withdrawal.affiliateEmail);
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    // Don't throw error - email failure shouldn't block the withdrawal status update
  }
};

export const Withdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const allWithdrawals = await AffiliateService.getAllWithdrawalRequests();
      setWithdrawals(allWithdrawals);
    } catch (error: any) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: WithdrawalRequest) => {
    if (!user) return;
    
    const confirmed = window.confirm(
      `Approve withdrawal of ₦${withdrawal.amount.toLocaleString()} for ${withdrawal.affiliateUsername}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingId(withdrawal.id!);
      await AffiliateService.updateWithdrawalStatus(
        withdrawal.id!,
        'approved',
        user.uid
      );
      
      // Send email notification
      await sendWithdrawalNotification(withdrawal, 'approved');
      
      toast.success('Withdrawal approved successfully');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async (withdrawal: WithdrawalRequest) => {
    if (!user) return;
    
    const ref = window.prompt('Enter transaction reference:');
    if (!ref) return;

    try {
      setProcessingId(withdrawal.id!);
      await AffiliateService.updateWithdrawalStatus(
        withdrawal.id!,
        'paid',
        user.uid,
        undefined,
        ref
      );
      
      // Send email notification
      await sendWithdrawalNotification(withdrawal, 'paid', undefined, ref);
      
      toast.success('Withdrawal marked as paid');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      toast.error(error.message || 'Failed to update withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!user || !selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(selectedWithdrawal.id!);
      await AffiliateService.updateWithdrawalStatus(
        selectedWithdrawal.id!,
        'rejected',
        user.uid,
        rejectionReason
      );
      
      // Send email notification
      await sendWithdrawalNotification(selectedWithdrawal, 'rejected', rejectionReason);
      
      toast.success('Withdrawal rejected');
      setShowRejectModal(false);
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 pt-20">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
  const paidWithdrawals = withdrawals.filter(w => w.status === 'paid');
  const rejectedWithdrawals = withdrawals.filter(w => w.status === 'rejected');

  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalApproved = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalPaid = paidWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 pt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-gray-600 mt-1">Manage affiliate withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingWithdrawals.length}</p>
              <p className="text-xs text-gray-500 mt-1">₦{totalPending.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{approvedWithdrawals.length}</p>
              <p className="text-xs text-gray-500 mt-1">₦{totalApproved.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{paidWithdrawals.length}</p>
              <p className="text-xs text-gray-500 mt-1">₦{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Banknote className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rejectedWithdrawals.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawals Table */}
      {withdrawals.length === 0 ? (
        <Card className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h3>
          <p className="text-gray-600">No withdrawal requests have been made yet.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.affiliateUsername}</div>
                          <div className="text-sm text-gray-500">{withdrawal.affiliateEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm font-bold text-gray-900">
                          ₦{withdrawal.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{withdrawal.bankDetails.accountName}</div>
                      <div className="text-sm text-gray-500">{withdrawal.bankDetails.bankName}</div>
                      <div className="text-sm font-mono text-gray-500">{withdrawal.bankDetails.accountNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(withdrawal.status)}`}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                      {withdrawal.transactionReference && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ref: {withdrawal.transactionReference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {withdrawal.requestedAt
                          ? new Date(withdrawal.requestedAt.seconds * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(withdrawal)}
                            disabled={processingId === withdrawal.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === withdrawal.id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(withdrawal)}
                            disabled={processingId === withdrawal.id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {withdrawal.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(withdrawal)}
                          disabled={processingId === withdrawal.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {processingId === withdrawal.id ? 'Processing...' : 'Mark as Paid'}
                        </Button>
                      )}
                      {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                        <div className="text-xs text-red-600">
                          Reason: {withdrawal.rejectionReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Withdrawal Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting withdrawal of ₦{selectedWithdrawal.amount.toLocaleString()} for {selectedWithdrawal.affiliateUsername}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedWithdrawal(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === selectedWithdrawal.id}
                className="bg-red-600 hover:bg-red-700"
              >
                {processingId === selectedWithdrawal.id ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
