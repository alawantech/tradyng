// Utility to generate consistent ratings and review counts for products
export interface ProductRating {
  averageRating: number;
  totalReviews: number;
}

export function generateProductRating(productId: string): ProductRating {
  // Create a simple hash from productId for consistent results
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive number
  const seed = Math.abs(hash);
  
  // Generate rating with realistic distribution (more 4-4.5 stars, fewer 5 stars)
  const ratingVariations = [
    3.7, 3.8, 3.9, 4.0, 4.0, 4.1, 4.1, 4.2, 4.2, 4.3, 4.3, 4.4, 4.4, 
    4.5, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.9, 5.0
  ];
  const averageRating = ratingVariations[seed % ratingVariations.length];
  
  // Generate base review count between 15 and 150
  const baseReviewCount = 15 + (seed % 136);
  
  // Add monthly increment of 5 reviews since January 2024
  const startDate = new Date('2024-01-01');
  const currentDate = new Date();
  const monthsDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - startDate.getMonth());
  
  const monthlyIncrement = monthsDiff * 5;
  const totalReviews = baseReviewCount + monthlyIncrement;
  
  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews
  };
}

export function renderStars(rating: number): string[] {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  
  // Add half star if needed
  if (hasHalfStar && fullStars < 5) {
    stars.push('half');
  }
  
  // Fill remaining with empty stars
  while (stars.length < 5) {
    stars.push('empty');
  }
  
  return stars;
}