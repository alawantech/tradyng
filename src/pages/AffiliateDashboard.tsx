import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Users, CreditCard, Save, Copy, Check, Phone, MessageCircle, Building } from 'lucide-react';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { AffiliateService, Affiliate, Referral } from '../services/affiliate';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const AffiliateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    bankName: '',
    accountNumber: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/affiliate');
        return;
      }

      try {
        const affiliateData = await AffiliateService.getAffiliateByFirebaseUid(user.uid);
        if (!affiliateData) {
          toast.error('Affiliate account not found');
          navigate('/affiliate');
          return;
        }

        setAffiliate(affiliateData);
        
        // Load referrals for this affiliate
        if (affiliateData.id) {
          try {
            const referralsData = await AffiliateService.getAffiliateReferrals(affiliateData.id);
            setReferrals(referralsData);
          } catch (error) {
            console.error('Error loading referrals:', error);
          }
        }

        if (affiliateData.bankDetails) {
          setBankDetails(affiliateData.bankDetails);
        }
      } catch (error) {
        console.error('Error loading affiliate data:', error);
        toast.error('Failed to load affiliate data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSaveBankDetails = async () => {
    if (!affiliate?.id) return;

    // Validate bank details
    if (!bankDetails.accountName.trim() || !bankDetails.bankName.trim() || !bankDetails.accountNumber.trim()) {
      toast.error('Please fill in all bank details');
      return;
    }

    if (bankDetails.accountNumber.length < 10) {
      toast.error('Account number must be at least 10 digits');
      return;
    }

    setSaving(true);
    try {
      await AffiliateService.updateBankDetails(affiliate.id, bankDetails);
      toast.success('Bank details saved successfully!');
      setAffiliate((prev: Affiliate | null) => prev ? { ...prev, bankDetails } : null);
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const copyReferralLink = () => {
    if (!affiliate?.username) return;

    const referralLink = `${window.location.origin}/auth/signup?ref=${affiliate.username}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');

    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need an affiliate account to access this page.</p>
          <Link to="/affiliate" className="text-blue-400 hover:text-blue-300">
            Join Affiliate Program
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>
                <p className="text-gray-400">Welcome back, {affiliate.fullName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-white font-medium">@{affiliate.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-white">{affiliate.totalReferrals}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">₦{affiliate.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Commission Rate</p>
                <p className="text-2xl font-bold text-white">100%</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Your Referral Link</h2>
            <p className="text-gray-400 mb-4">
              Share this link with potential customers. When they sign up and use your username as a coupon code, you'll earn commissions.
            </p>

            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={`${window.location.origin}/auth/signup?ref=${affiliate.username}`}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
              <Button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>

            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">💰 Commission Structure</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Business Plan: ₦2,000 discount → ₦2,000 commission</li>
                <li>• Pro Plan: ₦4,000 discount → ₦4,000 commission</li>
                <li>• Customers use your username as coupon code</li>
              </ul>
            </div>
          </motion.div>

          {/* Bank Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Bank Details</h2>
            <p className="text-gray-400 mb-6">
              Add your bank details to receive commission payouts. This information is securely stored.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter account name"
                  value={bankDetails.accountName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter bank name"
                  value={bankDetails.bankName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter account number"
                  value={bankDetails.accountNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  maxLength={10}
                />
              </div>

              <Button
                onClick={handleSaveBankDetails}
                disabled={saving}
                className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Bank Details</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Referrals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Your Referrals</h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No referrals yet. Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3">Store Name</th>
                    <th scope="col" className="px-6 py-3">Plan</th>
                    <th scope="col" className="px-6 py-3">Contact</th>
                    <th scope="col" className="px-6 py-3">Commission</th>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-white">{referral.referredBusinessName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.planType === 'business' 
                            ? 'bg-blue-900 text-blue-300' 
                            : 'bg-purple-900 text-purple-300'
                        }`}>
                          {referral.planType.charAt(0).toUpperCase() + referral.planType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {referral.referredUserWhatsapp && (
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3 text-green-400" />
                              <span className="text-xs">{referral.referredUserWhatsapp}</span>
                            </div>
                          )}
                          {referral.referredUserPhone && referral.referredUserPhone !== referral.referredUserWhatsapp && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-blue-400" />
                              <span className="text-xs">{referral.referredUserPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-400">
                          ₦{referral.commissionAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">
                          {referral.completedAt?.toDate().toLocaleDateString() || referral.createdAt.toDate().toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.paymentStatus === 'completed' 
                            ? 'bg-green-900 text-green-300' 
                            : referral.paymentStatus === 'pending'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {referral.paymentStatus.charAt(0).toUpperCase() + referral.paymentStatus.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
