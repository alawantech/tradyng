// Utility script to backfill ratings for existing products
import { ProductService } from '../services/product';

export async function backfillAllProductRatings(businessId: string): Promise<void> {
  try {
    console.log('Starting rating backfill for business:', businessId);
    await ProductService.backfillProductRatings(businessId);
    console.log('Rating backfill completed successfully!');
  } catch (error) {
    console.error('Error during rating backfill:', error);
    throw error;
  }
}

// Usage example:
// backfillAllProductRatings('your-business-id');