import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { AffiliateService, Affiliate, Referral } from '../../services/affiliate';
import { BusinessService } from '../../services/business';
import { Users, Mail, DollarSign, TrendingUp, Eye, X, Building2, Calendar, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface ReferralWithDetails extends Referral {
  businessName?: string;
  businessSubdomain?: string;
}

export const Affiliates: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const allAffiliates = await AffiliateService.getAllAffiliates();
      
      // Fetch actual referrals for each affiliate to get real counts
      const affiliatesWithRealData = await Promise.all(
        allAffiliates.map(async (affiliate) => {
          try {
            const referrals = await AffiliateService.getAffiliateReferrals(affiliate.id!);
            
            // Calculate real totals from actual referrals
            const realTotalReferrals = referrals.length;
            const realTotalEarnings = referrals.reduce((sum, ref) => {
              // Only count completed payments
              if (ref.paymentStatus === 'completed') {
                return sum + (ref.commissionAmount || 0);
              }
              return sum;
            }, 0);
            
            return {
              ...affiliate,
              totalReferrals: realTotalReferrals,
              totalEarnings: realTotalEarnings
            };
          } catch (error) {
            console.error(`Error fetching referrals for affiliate ${affiliate.id}:`, error);
            return affiliate;
          }
        })
      );
      
      setAffiliates(affiliatesWithRealData);
    } catch (error: any) {
      console.error('Error fetching affiliates:', error);
      toast.error('Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  };

  const viewReferrals = async (affiliate: Affiliate) => {
    try {
      setSelectedAffiliate(affiliate);
      setLoadingReferrals(true);
      setShowReferralsModal(true);
      
      const affiliateReferrals = await AffiliateService.getAffiliateReferrals(affiliate.id!);
      
      // Fetch business details for each referral
      const referralsWithDetails = await Promise.all(
        affiliateReferrals.map(async (referral) => {
          try {
            const business = await BusinessService.getBusinessById(referral.referredBusinessId);
            return {
              ...referral,
              businessName: business?.name || referral.referredBusinessName,
              businessSubdomain: business?.subdomain
            };
          } catch (error) {
            return referral;
          }
        })
      );
      
      setReferrals(referralsWithDetails);
    } catch (error: any) {
      console.error('Error fetching referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setLoadingReferrals(false);
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

  const totalEarnings = affiliates.reduce((sum, aff) => sum + (aff.totalEarnings || 0), 0);
  const totalReferrals = affiliates.reduce((sum, aff) => sum + (aff.totalReferrals || 0), 0);

  return (
    <div className="p-6 pt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Affiliates</h1>
        <p className="text-gray-600 mt-1">Total: {affiliates.length} affiliates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{affiliates.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalReferrals}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₦{totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Affiliates List */}
      {affiliates.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Affiliates Yet</h3>
          <p className="text-gray-600">No affiliates have signed up yet.</p>
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
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{affiliate.username}</div>
                          <div className="text-sm text-gray-500">@{affiliate.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{affiliate.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{affiliate.totalReferrals || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          ₦{(affiliate.totalEarnings || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          affiliate.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : affiliate.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {affiliate.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {affiliate.createdAt
                        ? new Date(affiliate.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewReferrals(affiliate)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Referrals
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referrals Modal */}
      {showReferralsModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Referrals by {selectedAffiliate.username}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {referrals.length} referrals
                </p>
              </div>
              <button
                onClick={() => setShowReferralsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingReferrals ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral, index) => (
                    <Card key={referral.id || index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {referral.businessName || 'Unknown Store'}
                              </h4>
                              {referral.businessSubdomain && (
                                <p className="text-xs text-gray-500">
                                  {referral.businessSubdomain}.rady.ng
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">Plan</p>
                              <div className="flex items-center mt-1">
                                <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {referral.planType}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Commission</p>
                              <div className="flex items-center mt-1">
                                <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm font-bold text-green-600">
                                  ₦{referral.commissionAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Payment Status</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                referral.paymentStatus === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : referral.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {referral.paymentStatus}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <div className="flex items-center mt-1">
                                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-900">
                                  {referral.createdAt
                                    ? new Date(referral.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
