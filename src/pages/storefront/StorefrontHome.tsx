import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, StarHalf } from 'lucide-react';
import { Card } from '../../components/ui/Card';
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
        // Show all products on the homepage
        setFeaturedProducts(products);
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
      {/* Hero Section - Professional Dynamic Design */}
      <section 
        className="hero-section relative text-white overflow-hidden h-[500px] flex items-center" 
        style={{
          ...(business?.branding?.heroBannerImage ? {} : getHeroStyle()),
          height: '500px',
          maxHeight: '500px',
          minHeight: '500px'
        }}
      >
        {/* Custom Hero Background Image with Smart Overlay */}
        {business?.branding?.heroBannerImage && (
          <>
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img 
                src={business.branding.heroBannerImage}
                alt={`${business.name} hero background`}
                className="w-full h-full object-cover object-center transition-transform duration-[20s] ease-out hover:scale-110"
                onError={(e) => {
                  console.error('Hero banner image failed to load, falling back to gradient');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                style={{
                  animation: 'elegantZoom 30s ease-in-out infinite alternate'
                }}
              />
            </div>
            {/* Smart Gradient Overlay for Better Text Readability */}
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.4) 100%)',
                animation: 'overlayPulse 8s ease-in-out infinite'
              }}
            />
          </>
        )}

        {/* Animated Geometric Pattern Overlay - Only for Gradient Backgrounds */}
        {!business?.branding?.heroBannerImage && (
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.6'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='60' cy='20' r='2'/%3E%3Ccircle cx='20' cy='60' r='2'/%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Crect x='38' y='18' width='4' height='4' rx='2'/%3E%3Crect x='18' y='38' width='4' height='4' rx='2'/%3E%3Crect x='58' y='38' width='4' height='4' rx='2'/%3E%3Crect x='38' y='58' width='4' height='4' rx='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
              animation: 'float 12s ease-in-out infinite'
            }}
          />
        )}
        
        {/* Enhanced Floating Orbs - Only for Gradient Backgrounds */}
        {!business?.branding?.heroBannerImage && (
          <>
            <div 
              className="absolute top-16 left-16 w-32 h-32 rounded-full blur-2xl pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 70%)',
                animation: 'parallaxFloat 8s ease-in-out infinite, pulse-glow 5s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute top-24 right-24 w-24 h-24 rounded-full blur-xl pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.08) 70%)',
                animation: 'parallaxFloat 10s ease-in-out infinite 2s, pulse-glow 6s ease-in-out infinite 1s'
              }} 
            />
            <div 
              className="absolute bottom-20 left-1/3 w-20 h-20 rounded-full blur-xl pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 70%)',
                animation: 'parallaxFloat 9s ease-in-out infinite 1s, pulse-glow 7s ease-in-out infinite 3s'
              }} 
            />
            <div 
              className="absolute top-1/3 right-12 w-16 h-16 rounded-full blur-lg pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.07) 70%)',
                animation: 'parallaxFloat 7s ease-in-out infinite 3s, pulse-glow 8s ease-in-out infinite 2s'
              }} 
            />
          </>
        )}
        
        {/* Main Content - Professional Layout with Enhanced Visibility */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="mb-6"
            >
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight px-8 py-4 rounded-2xl inline-block"
                style={{
                  color: '#ffffff',
                  textShadow: business?.branding?.heroBannerImage 
                    ? '2px 2px 4px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                    : '2px 2px 8px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.1)',
                  backgroundColor: business?.branding?.heroBannerImage 
                    ? 'rgba(0, 0, 0, 0.25)' 
                    : 'rgba(0, 0, 0, 0.12)',
                  backdropFilter: business?.branding?.heroBannerImage ? 'blur(15px) saturate(180%)' : 'blur(10px)',
                  border: business?.branding?.heroBannerImage 
                    ? '1px solid rgba(255, 255, 255, 0.15)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: business?.branding?.heroBannerImage
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                  animation: 'fadeInUp 1s ease-out'
                }}
              >
                Welcome to{' '}
                <span className="relative inline-block">
                  <span 
                    className="font-black tracking-tight"
                    style={{
                      background: business?.branding?.heroBannerImage 
                        ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #ffffff 100%)'
                        : 'linear-gradient(90deg, #ffffff 0%, #f3f4f6 25%, #ffffff 50%, #e5e7eb 75%, #ffffff 100%)',
                      backgroundSize: '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'shimmer 4s ease-in-out infinite',
                      filter: business?.branding?.heroBannerImage 
                        ? 'drop-shadow(3px 3px 6px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(0,0,0,0.5))'
                        : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    {business.name}
                  </span>
                  <div 
                    className="absolute -bottom-2 left-0 w-full h-1 rounded-full"
                    style={{
                      background: business?.branding?.heroBannerImage
                        ? 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.9) 100%)'
                        : 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.7) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s ease-in-out infinite',
                      boxShadow: business?.branding?.heroBannerImage
                        ? '0 2px 10px rgba(255, 255, 255, 0.5)'
                        : '0 2px 6px rgba(255, 255, 255, 0.3)'
                    }}
                  />
                </span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
              className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed px-8 py-4 rounded-2xl font-medium"
              style={{
                color: '#ffffff',
                textShadow: business?.branding?.heroBannerImage 
                  ? '1px 1px 3px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)'
                  : '1px 1px 3px rgba(0,0,0,0.3), 0 0 12px rgba(0,0,0,0.2)',
                backgroundColor: business?.branding?.heroBannerImage 
                  ? 'rgba(0, 0, 0, 0.35)' 
                  : 'rgba(0, 0, 0, 0.18)',
                backdropFilter: business?.branding?.heroBannerImage ? 'blur(12px) saturate(150%)' : 'blur(8px)',
                border: business?.branding?.heroBannerImage 
                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: business?.branding?.heroBannerImage
                  ? '0 6px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 4px 16px rgba(0, 0, 0, 0.15)',
                animation: 'textReveal 1.2s ease-out 0.3s both'
              }}
            >
              {business.description || `Discover amazing products from ${business.name}. Quality guaranteed, fast shipping.`}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button 
                onClick={scrollToProducts}
                className="group relative font-bold px-10 py-4 rounded-full transition-all duration-500 transform hover:scale-110 shadow-2xl border-2 overflow-hidden cursor-pointer text-lg"
                style={{
                  backgroundColor: business?.branding?.heroBannerImage ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
                  color: business?.branding?.heroBannerImage ? '#111827' : '#1f2937',
                  borderColor: business?.branding?.heroBannerImage ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: business?.branding?.heroBannerImage 
                    ? '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                    : '0 8px 30px rgba(0, 0, 0, 0.15), 0 0 25px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  backdropFilter: business?.branding?.heroBannerImage ? 'blur(10px) saturate(180%)' : 'blur(5px)',
                  animation: 'scaleUp 0.6s ease-out 0.6s both, buttonPulse 4s ease-in-out 1s infinite'
                }}
                onMouseEnter={(e) => {
                  if (business?.branding?.heroBannerImage) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 255, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)';
                  } else {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2), 0 0 35px rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (business?.branding?.heroBannerImage) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.transform = 'scale(1)';
                  } else {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15), 0 0 25px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shop Now
                </span>
                {/* Animated shine effect */}
                <div 
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                    transform: 'translateX(-100%)',
                    animation: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animation = 'shimmer 1.5s ease-in-out';
                  }}
                />
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Bottom Wave - Elegant Seamless Transition */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-16 sm:h-20"
            style={{
              filter: business?.branding?.heroBannerImage 
                ? 'drop-shadow(0 -2px 8px rgba(0, 0, 0, 0.1))'
                : 'none'
            }}
          >
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              style={{
                fill: '#ffffff',
                opacity: 0.95
              }}
            />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredFeaturedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <Card className="relative border border-gray-200 shadow-sm w-full flex flex-col overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 bg-white rounded-xl h-full">
                    {/* Product Image with Link */}
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-gray-50 rounded-t-xl">
                      <div className="w-full aspect-square p-3 sm:p-4">
                        <img
                          src={product.images?.[0] || '/api/placeholder/400/300'}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
                          }}
                        />
                      </div>
                      {/* Category Badge */}
                      {product.category && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <span className="inline-block px-2 py-1 text-[9px] sm:text-[10px] font-bold text-white bg-black/80 backdrop-blur-sm rounded-full shadow-lg">
                            {product.category}
                          </span>
                        </div>
                      )}
                    </Link>
                    
                    {/* Product Info */}
                    <div className="flex flex-col px-3 sm:px-4 py-3 sm:py-4 flex-1 bg-white">
                      <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2 sm:mb-3">
                          <div className="flex text-yellow-400">
                            {renderStars(product.averageRating || generateProductRating(product.id || '').averageRating).map((starType, idx) => (
                              <span key={idx}>
                                {starType === 'full' && <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />}
                                {starType === 'half' && <StarHalf className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />}
                                {starType === 'empty' && <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                            ({product.totalReviews || generateProductRating(product.id || '').totalReviews})
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="mt-auto">
                          <span className="text-lg sm:text-xl font-black text-gray-900">
                            {formatCurrency(product.price, business.settings?.currency || DEFAULT_CURRENCY)}
                          </span>
                        </div>
                      </Link>
                      
                      {/* Action Buttons - Side by Side, Centered, Responsive */}
                      <div className="mt-3 sm:mt-4 flex flex-row gap-2 w-full justify-center">
                        <button 
                          className="flex-1 max-w-[45%] px-2 py-2 sm:py-2.5 bg-black text-white text-[10px] sm:text-xs font-bold rounded-lg hover:bg-gray-800 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="truncate">Add</span>
                        </button>
                        <Link to={`/product/${product.id}`} className="flex-1 max-w-[45%]">
                          <button className="w-full px-2 py-2 sm:py-2.5 bg-white text-black text-[10px] sm:text-xs font-bold rounded-lg border-2 border-black hover:bg-black hover:text-white active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md truncate">
                            Details
                          </button>
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