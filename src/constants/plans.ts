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