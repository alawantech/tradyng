import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, StarHalf } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { useCart } from '../../contexts/CartContext';
import { ProductService, Product } from '../../services/product';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import { generateProductRating, renderStars } from '../../utils/productRatings';
import { useColorScheme } from '../../hooks/useColorScheme';

export const StorefrontHome: React.FC = () => {
  const { business, isLoading: storeLoading, searchTerm, selectedCategory } = useStore();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Get color scheme based on business background color
  const colorScheme = useColorScheme(business?.branding?.storeBackgroundColor);

  // Get hero style based on branding settings
  const getHeroStyle = () => {
    const heroStyle = business?.branding?.heroStyle || 'modern'; // Changed default to 'modern'
    
    const styles = {
      default: {
        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 15%, #8b8db5 35%, #a5a8c5 65%, #c5cbe1 85%, #9ca3af 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient 12s ease-in-out infinite'
      },
      elegant: {
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradient 8s ease-in-out infinite'
      },
      modern: {
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient 10s ease-in-out infinite'
      },
      professional: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
        backgroundSize: '250% 250%',
        animation: 'gradient 6s ease-in-out infinite'
      },
      romantic: {
        background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 25%, #fdf2f8 50%, #fef7f0 75%, #fff1f2 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradient 15s ease-in-out infinite'
      },
      mystical: {
        background: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)',
        backgroundSize: '250% 250%',
        animation: 'gradient 10s ease-in-out infinite'
      },
      sunset: {
        background: 'linear-gradient(135deg, #fb7185 0%, #f97316 50%, #fbbf24 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradient 8s ease-in-out infinite'
      },
      ocean: {
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #67e8f9 100%)',
        backgroundSize: '250% 250%',
        animation: 'gradient 12s ease-in-out infinite'
      },
      lavender: {
        background: 'linear-gradient(135deg, #c084fc 0%, #d8b4fe 50%, #f3e8ff 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradient 14s ease-in-out infinite'
      },
      forest: {
        background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #6ee7b7 100%)',
        backgroundSize: '250% 250%',
        animation: 'gradient 10s ease-in-out infinite'
      },
      midnight: {
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 30%, #581c87 70%, #7c3aed 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient 16s ease-in-out infinite'
      },
      coral: {
        background: 'linear-gradient(135deg, #f472b6 0%, #fb7185 50%, #fbbf24 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradient 9s ease-in-out infinite'
      }
    };
    
    return styles[heroStyle as keyof typeof styles] || styles.default;
  };

  useEffect(() => {
    const loadProducts = async () => {
      if (!business?.id) return;
      
      try {
        setIsLoadingProducts(true);
        const products = await ProductService.getProductsByBusinessId(business.id);
        // Show all products, not just first 4 when category is selected
        if (selectedCategory) {
          setFeaturedProducts(products);
        } else {
          setFeaturedProducts(products.slice(0, 4));
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setFeaturedProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [business?.id, selectedCategory]);

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    if (!product || !business) return;
    
    addItem({
      id: product.id!,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      businessId: business.id!,
    });
  };

  // Scroll to products section
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className={`text-2xl font-bold ${colorScheme.text.primary} mb-2`}>Store Not Found</h1>
          <p className={colorScheme.text.secondary}>This store does not exist or is not available.</p>
        </div>
      </div>
    );
  }

  // Filter featured products by search term and category
  const filteredFeaturedProducts = featuredProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Hero Section - Dynamic Design Based on Branding Settings - Fixed Height */}
      <section 
        className="hero-section relative text-white overflow-hidden h-[400px] flex items-center" 
        style={{
          ...(business?.branding?.heroBannerImage ? {} : getHeroStyle()),
          height: '400px',
          maxHeight: '400px',
          minHeight: '400px'
        }}
      >
        {/* Custom Hero Background Image (replaces gradient background) */}
        {business?.branding?.heroBannerImage && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src={business.branding.heroBannerImage}
              alt={`${business.name} hero background`}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                console.error('Hero banner image failed to load, falling back to gradient');
                // Hide the image and show gradient background
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={() => {
                // Image loaded successfully, hide all overlays for clear image visibility
                const geometricOverlay = document.querySelector('.hero-section .absolute.inset-0.opacity-20');
                if (geometricOverlay) {
                  (geometricOverlay as HTMLElement).style.display = 'none';
                }
                
                // Hide floating orbs when image is present
                const floatingOrbs = document.querySelectorAll('.hero-section .absolute.w-28, .hero-section .absolute.w-20, .hero-section .absolute.w-16, .hero-section .absolute.w-12');
                floatingOrbs.forEach(orb => {
                  (orb as HTMLElement).style.display = 'none';
                });
              }}
            />
            {/* NO OVERLAY - Image shows completely clear */}
          </div>
        )}

        {/* Animated Geometric Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.6'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3Ccircle cx='20' cy='60' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Crect x='38' y='18' width='4' height='4' rx='2'/%3E%3Crect x='18' y='38' width='4' height='4' rx='2'/%3E%3Crect x='58' y='38' width='4' height='4' rx='2'/%3E%3Crect x='38' y='58' width='4' height='4' rx='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        
        {/* Enhanced Floating Orbs with Continuous Animation */}
        <div 
          className="absolute top-10 left-10 w-28 h-28 rounded-full blur-xl"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 70%)',
            animation: 'float 6s ease-in-out infinite, pulse-glow 4s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-20 right-20 w-20 h-20 rounded-full blur-lg"
          style={{ 
            background: 'radial-gradient(circle, rgba(200, 200, 220, 0.4) 0%, rgba(180, 190, 210, 0.2) 70%)',
            animationDelay: '2s',
            animation: 'float 8s ease-in-out infinite 2s, pulse-glow 5s ease-in-out infinite 1s'
          }} 
        />
        <div 
          className="absolute bottom-16 left-1/4 w-16 h-16 rounded-full blur-lg"
          style={{ 
            background: 'radial-gradient(circle, rgba(180, 200, 230, 0.3) 0%, rgba(160, 180, 210, 0.15) 70%)',
            animation: 'float 7s ease-in-out infinite 1s, pulse-glow 6s ease-in-out infinite 3s'
          }} 
        />
        <div 
          className="absolute top-1/2 right-10 w-12 h-12 rounded-full blur-md"
          style={{ 
            background: 'radial-gradient(circle, rgba(220, 225, 240, 0.35) 0%, rgba(200, 210, 230, 0.18) 70%)',
            animation: 'float 5s ease-in-out infinite 3s, pulse-glow 7s ease-in-out infinite 2s'
          }} 
        />
        
        {/* Main Content - Always visible on top with enhanced visibility */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-4"
            >
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight px-6 py-3 rounded-xl inline-block"
                style={{
                  color: '#ffffff',
                  textShadow: business?.branding?.heroBannerImage 
                    ? '0 1px 2px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2)'
                    : '0 1px 2px rgba(0,0,0,0.1)',
                  backgroundColor: business?.branding?.heroBannerImage 
                    ? 'rgba(0, 0, 0, 0.015)' 
                    : 'rgba(0, 0, 0, 0.008)',
                  backdropFilter: business?.branding?.heroBannerImage ? 'blur(20px)' : 'blur(8px)',
                  border: 'none',
                  boxShadow: business?.branding?.heroBannerImage
                    ? '0 0 2px rgba(0, 0, 0, 0.01)'
                    : 'none'
                }}
              >
                Welcome to{' '}
                <span className="relative inline-block">
                  <span 
                    className="font-extrabold"
                    style={{
                      background: business?.branding?.heroBannerImage 
                        ? 'white'
                        : 'linear-gradient(90deg, #ffffff 0%, #f3f4f6 25%, #ffffff 50%, #e5e7eb 75%, #ffffff 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: business?.branding?.heroBannerImage ? 'white' : 'transparent',
                      animation: business?.branding?.heroBannerImage ? 'none' : 'shimmer 3s ease-in-out infinite',
                      textShadow: business?.branding?.heroBannerImage 
                        ? '3px 3px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.8)'
                        : 'none',
                      WebkitTextStroke: business?.branding?.heroBannerImage ? '1px black' : 'none'
                    }}
                  >
                    {business.name}
                  </span>
                  <div 
                    className="absolute -bottom-1 left-0 w-full h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.8) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s ease-in-out infinite'
                    }}
                  />
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl mb-6 max-w-2xl mx-auto leading-relaxed px-6 py-3 rounded-xl"
              style={{
                color: '#ffffff',
                textShadow: business?.branding?.heroBannerImage 
                  ? '0 2px 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)'
                  : '0 1px 4px rgba(0,0,0,0.3)',
                backgroundColor: business?.branding?.heroBannerImage 
                  ? 'rgba(0, 0, 0, 0.45)' 
                  : 'rgba(0, 0, 0, 0.25)',
                backdropFilter: business?.branding?.heroBannerImage ? 'blur(8px)' : 'blur(2px)',
                border: business?.branding?.heroBannerImage 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: business?.branding?.heroBannerImage
                  ? '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {business.description || `Discover amazing products from ${business.name}. Quality guaranteed, fast shipping.`}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <button 
                onClick={scrollToProducts}
                className="relative font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg border overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: business?.branding?.heroBannerImage ? 'rgba(255, 255, 255, 0.95)' : 'white',
                  color: business?.branding?.heroBannerImage ? '#1f2937' : '#374151',
                  borderColor: business?.branding?.heroBannerImage ? 'rgba(255, 255, 255, 0.8)' : '#e5e7eb',
                  boxShadow: business?.branding?.heroBannerImage 
                    ? '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 4px 15px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 255, 255, 0.1)',
                  backdropFilter: business?.branding?.heroBannerImage ? 'blur(8px)' : 'none',
                  animation: 'buttonPulse 3s ease-in-out infinite, buttonGlow 2s ease-in-out infinite alternate'
                }}
                onMouseEnter={(e) => {
                  if (business?.branding?.heroBannerImage) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #f8fafc, #f1f5f9)';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (business?.branding?.heroBannerImage) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  } else {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                Shop Now
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Wave - Seamless transition to store background */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="relative block w-full h-12">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#c5cbe1"></path>
          </svg>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products-section" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dynamic section title based on category */}
          {selectedCategory && (
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold ${colorScheme.text.primary} mb-4`}>
                {selectedCategory}
              </h2>
              <p className={colorScheme.text.secondary}>
                {filteredFeaturedProducts.length} product{filteredFeaturedProducts.length !== 1 ? 's' : ''} in this category
              </p>
            </div>
          )}
          
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFeaturedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
              {filteredFeaturedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex justify-center"
                >
                  <Card className="border border-gray-200 shadow-sm w-full max-w-xs flex flex-col p-0 hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: '#f9f9f9' }}>
                    <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
                      <div className="w-full aspect-square overflow-hidden p-2">
                        <img
                          src={product.images?.[0] || '/api/placeholder/400/300'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                          }}
                        />
                      </div>
                      <div className="flex flex-col px-4 py-3 flex-1" style={{ backgroundColor: '#f9f9f9' }}>
                        <h3 className={`text-base font-semibold ${colorScheme.text.primary} mb-1 truncate`} style={{ backgroundColor: '#f9f9f9' }}>{product.name}</h3>
                        <span className={`text-lg font-bold ${colorScheme.text.primary} mb-2`} style={{ backgroundColor: '#f9f9f9' }}>{formatCurrency(product.price, business.settings?.currency || DEFAULT_CURRENCY)}</span>
                        <p className={`${colorScheme.text.secondary} text-xs mb-2 line-clamp-2`}>{product.description}</p>
                        <div className="flex items-center mb-2" style={{ backgroundColor: '#f9f9f9' }}>
                          <div className="flex text-yellow-400">
                            {renderStars(product.averageRating || generateProductRating(product.id || '').averageRating).map((starType, index) => (
                              <span key={index}>
                                {starType === 'full' && <Star className="h-4 w-4 fill-current" />}
                                {starType === 'half' && <StarHalf className="h-4 w-4 fill-current" />}
                                {starType === 'empty' && <Star className={`h-4 w-4 ${colorScheme.icon.muted}`} />}
                              </span>
                            ))}
                          </div>
                          <span className={`text-xs ${colorScheme.text.tertiary} ml-2`}>({product.totalReviews || generateProductRating(product.id || '').totalReviews})</span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 pb-3" style={{ backgroundColor: '#f9f9f9' }}>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 px-1 py-1 rounded font-semibold text-xs text-white hover:bg-gray-800 transition-all whitespace-nowrap"
                          style={{ backgroundColor: 'black', fontSize: '10px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          Add to Cart
                        </Button>
                        <Link to={`/product/${product.id}`} className="flex-1">
                          <Button size="sm" className="w-full px-1 py-1 rounded font-semibold text-xs text-white hover:bg-gray-800 transition-all whitespace-nowrap" style={{ backgroundColor: 'black', fontSize: '10px' }}>View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className={`${colorScheme.icon.default} mb-4`}>
                <ShoppingCart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className={`text-xl font-semibold ${colorScheme.text.primary} mb-2`}>
                {searchTerm || selectedCategory ? 'No Products Found' : 'No Products Yet'}
              </h3>
              <p className={colorScheme.text.secondary}>
                {searchTerm && selectedCategory
                  ? `No products match "${searchTerm}" in ${selectedCategory}. Try a different search term or category.`
                  : searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : selectedCategory
                  ? `No products found in ${selectedCategory} category.`
                  : "This store hasn't added any products yet. Check back later!"}
              </p>
            </div>
          )}
        </div>
      </section>


    </div>
  );
};