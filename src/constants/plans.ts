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
  test: {
    maxProducts: 50,
    maxImagesPerProduct: 2,
    maxVideoLengthSeconds: 15,
    maxStorageMB: 1000, // 1GB
    maxOrdersPerMonth: 100,
    allowCustomDomain: false,
    allowVideos: true,
    watermarkedReceipts: true,
    showPoweredByBadge: true,
    advancedAnalytics: false,
    emailCustomization: false,
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
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isPopular: false,
    description: '3-day trial with all business features',
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
      '5GB storage',
      'Trial expires after 3 days'
    ],
    buttonText: 'Start Free Trial'
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 0, // Not used for yearly plans
    yearlyPrice: 16000,
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
    monthlyPrice: 0, // Not used for yearly plans
    yearlyPrice: 32000,
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
  },
  {
    id: 'test',
    name: 'Test Plan',
    monthlyPrice: 0, // Not used for yearly plans
    yearlyPrice: 150,
    isPopular: false,
    description: 'Test plan for development and testing',
    features: [
      'Up to 50 products',
      'Up to 2 images per product',
      '15-second videos per product',
      '100 orders per month',
      'Watermarked receipts',
      '1GB storage',
      'Basic features only'
    ],
    buttonText: 'Start Test Plan'
  }
];