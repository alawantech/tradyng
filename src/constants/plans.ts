export interface PlanLimits {
  maxProducts: number;
  maxImagesPerProduct: number;
  maxVideoLengthSeconds: number;
  maxStorageMB: number;
  maxOrdersPerMonth: number;
  allowCustomDomain: boolean;
  allowVideos: boolean;
  watermarkedReceipts: boolean;
  showPoweredByBadge: boolean;
  advancedAnalytics: boolean;
  emailCustomization: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxProducts: 20,
    maxImagesPerProduct: 1,
    maxVideoLengthSeconds: 0, // No videos allowed
    maxStorageMB: 50,
    maxOrdersPerMonth: 50,
    allowCustomDomain: false,
    allowVideos: false,
    watermarkedReceipts: true,
    showPoweredByBadge: true,
    advancedAnalytics: false,
    emailCustomization: false,
  },
  business: {
    maxProducts: 150,
    maxImagesPerProduct: 4,
    maxVideoLengthSeconds: 30,
    maxStorageMB: 5000, // 5GB
    maxOrdersPerMonth: -1, // Unlimited
    allowCustomDomain: true,
    allowVideos: true,
    watermarkedReceipts: false,
    showPoweredByBadge: false,
    advancedAnalytics: true,
    emailCustomization: true,
  },
  pro: {
    maxProducts: 300,
    maxImagesPerProduct: 4,
    maxVideoLengthSeconds: 60,
    maxStorageMB: 10000, // 10GB
    maxOrdersPerMonth: -1, // Unlimited
    allowCustomDomain: true,
    allowVideos: true,
    watermarkedReceipts: false,
    showPoweredByBadge: false,
    advancedAnalytics: true,
    emailCustomization: true,
  },
};

export const getPlanLimits = (plan: string): PlanLimits => {
  return PLAN_LIMITS[plan.toLowerCase()] || PLAN_LIMITS.free;
};

export const validatePlanLimit = (
  plan: string,
  type: keyof PlanLimits,
  currentValue: number
): { isValid: boolean; limit: number; message?: string } => {
  const limits = getPlanLimits(plan);
  const limit = limits[type] as number;
  
  if (limit === -1) {
    return { isValid: true, limit: -1 }; // Unlimited
  }
  
  const isValid = currentValue <= limit;
  
  return {
    isValid,
    limit,
    message: isValid 
      ? undefined 
      : `Your ${plan} plan allows up to ${limit} ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}`
  };
};

// Pricing plans for the landing page
export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isPopular: boolean;
  features: string[];
  buttonText: string;
  description: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isPopular: false,
    description: 'Perfect for getting started',
    features: [
      '20 products maximum',
      '1 image per product (no videos)',
      'Watermarked receipts',
      'Basic business page theme',
      '50 MB storage limit',
      '50 orders per month limit',
      '"Powered by rady.ng" badge',
      'rady.ng/yourbusiness subdomain only'
    ],
    buttonText: 'Get Started Free'
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 9500,
    yearlyPrice: 95000,
    isPopular: true,
    description: 'Most popular for growing businesses',
    features: [
      'Up to 150 products',
      'Up to 4 images per product',
      '30-second videos per product',
      'Custom domain support',
      'Unlimited orders',
      'Clean receipts (no watermark)',
      'Advanced analytics',
      'Email customization',
      'Priority support',
      'Remove "Powered by" badge',
      '5GB storage'
    ],
    buttonText: 'Start Business Plan'
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19000,
    yearlyPrice: 190000,
    isPopular: false,
    description: 'For established businesses',
    features: [
      'Up to 300 products',
      'Up to 4 images per product',
      '1-minute videos per product',
      'Custom domain support',
      'Unlimited orders',
      'Clean receipts (no watermark)',
      'Advanced analytics',
      'Email customization',
      'Priority support',
      'Remove "Powered by" badge',
      'API access',
      'White-label solution',
      '10GB storage'
    ],
    buttonText: 'Go Pro'
  }
];