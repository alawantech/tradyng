import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { BusinessService } from '../../services/business';
import { UserService } from '../../services/user';
import { Building2, CreditCard, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { SendReminderModal } from '../../components/modals/SendReminderModal';
import { Button } from '../../components/ui/Button';

interface AdminBusiness {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  plan?: string;
  status?: string;
  createdAt?: any;
  subdomain?: string;
  trialEndDate?: any;
  email?: string;
}

export const Businesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusiness | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      // Get all businesses
      const allBusinesses = await BusinessService.getAllBusinesses();
      
      // Fetch owner details for each business
      const businessesWithOwners = await Promise.all(
        allBusinesses.map(async (business) => {
          try {
            const owner = await UserService.getUserById(business.ownerId);
            return {
              ...business,
              ownerEmail: owner?.email,
              ownerName: owner?.displayName || owner?.email
            };
          } catch (error) {
            console.error(`Error fetching owner for business ${business.id}:`, error);
            return business;
          }
        })
      );
      
      setBusinesses(businessesWithOwners as AdminBusiness[]);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (businessId: string, message: string) => {
    try {
      const response = await fetch('https://sendtrialreminder-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, customMessage: message })
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      toast.success('Reminder email sent successfully!');
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder email');
      throw error;
    }
  };

  const handleDeleteBusiness = async (business: AdminBusiness) => {
    if (!confirm(`Are you sure you want to permanently delete "${business.name}"? This will delete all products, orders, customers, and the owner's account. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(business.id);
    try {
      const response = await fetch('https://admindeletebusiness-rv5lqk7lxa-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete business');
      }

      toast.success(`Business "${business.name}" deleted successfully!`);
      // Refresh the list
      await fetchBusinesses();
    } catch (error: any) {
      console.error('Error deleting business:', error);
      toast.error('Failed to delete business');
    } finally {
      setDeletingId(null);
    }
  };

  const getDaysRemaining = (trialEndDate: any) => {
    if (!trialEndDate) return null;
    const now = new Date();
    const endDate = trialEndDate.toDate ? trialEndDate.toDate() : new Date(trialEndDate.seconds * 1000);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <div className="p-6 pt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Businesses</h1>
        <p className="text-gray-600 mt-1">Total: {businesses.length} businesses</p>
      </div>
      
      {businesses.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Businesses Yet</h3>
          <p className="text-gray-600">No businesses have been created yet.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map((business) => {
                  const daysRemaining = business.plan === 'free' ? getDaysRemaining(business.trialEndDate) : null;
                  return (
                  <tr key={business.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          {business.subdomain && (
                            <div className="text-sm text-gray-500">{business.subdomain}.rady.ng</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{business.ownerName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{business.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 capitalize">{business.plan || 'Free'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          business.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {business.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {business.createdAt
                        ? new Date(business.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {business.plan === 'free' ? (
                        <div className="flex items-center space-x-2">
                          {/* Trial Status */}
                          {daysRemaining !== null && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              daysRemaining <= 0 
                                ? 'bg-red-100 text-red-800' 
                                : daysRemaining === 1 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {daysRemaining <= 0 ? 'EXPIRED' : `${daysRemaining}d left`}
                            </span>
                          )}
                          {/* Send Reminder Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedBusiness(business);
                              setReminderModalOpen(true);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>Remind</span>
                          </Button>
                          {/* Delete Button */}
                          <Button
                            onClick={() => handleDeleteBusiness(business)}
                            disabled={deletingId === business.id}
                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{deletingId === business.id ? 'Deleting...' : 'Delete'}</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Send Reminder Modal */}
      {selectedBusiness && (
        <SendReminderModal
          isOpen={reminderModalOpen}
          onClose={() => {
            setReminderModalOpen(false);
            setSelectedBusiness(null);
          }}
          businessName={selectedBusiness.name}
          businessId={selectedBusiness.id}
          onSendReminder={handleSendReminder}
        />
      )}
    </div>
  );
};
