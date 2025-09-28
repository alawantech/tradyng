import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useStore } from './StorefrontLayout';
import { useCart } from '../../contexts/CartContext';
import { ProductService, Product } from '../../services/product';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';
import toast from 'react-hot-toast';

export const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const { business, isLoading: storeLoading } = useStore();
  const { addItem } = useCart();
  const [selectedMedia, setSelectedMedia] = useState<'image' | 'video'>('image');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id || !business?.id) return;
      try {
        setIsLoading(true);
        const fetchedProduct = await ProductService.getProductById(business.id, id);
        setProduct(fetchedProduct);
        // Show video first if it exists
        if (fetchedProduct && fetchedProduct.video) {
          setSelectedMedia('video');
        } else {
          setSelectedMedia('image');
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, business?.id]);

  if (storeLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg h-96"></div>
              <div className="flex space-x-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or is no longer available.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product || !business) return;
    
    addItem({
      id: product.id!,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
      businessId: business.id!,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to checkout - we'll implement this later
    toast.success('Redirecting to checkout...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Section: Responsive Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT: Product Media */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
          {/* Main Image/Video Viewer */}
          <div className="relative w-full aspect-w-1 aspect-h-1 mb-4 group">
            {selectedMedia === 'video' && product.video ? (
              <video
                src={product.video}
                controls
                autoPlay
                className="w-full h-full object-cover rounded-2xl bg-black"
                poster={product.images?.[0]}
              />
            ) : (
              <img
                src={product.images?.[selectedImage] || '/api/placeholder/400/300'}
                alt={product.name}
                className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-300 group-hover:scale-105 bg-gray-100"
                style={{boxShadow: '0 4px 16px rgba(0,0,0,0.08)'}}
                onError={e => (e.target as HTMLImageElement).src = '/api/placeholder/400/300'}
              />
            )}
            {/* Zoom effect overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl group-hover:ring-4 group-hover:ring-blue-200 transition"></div>
          </div>
          {/* Thumbnails: Video first, then images */}
          <div className="flex space-x-2 mt-2">
            {product.video && (
              <button
                onClick={() => setSelectedMedia('video')}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex items-center justify-center relative transition-all duration-200 ${selectedMedia === 'video' ? 'border-blue-600 scale-105 shadow-md' : 'border-gray-200 hover:border-blue-400'}`}
                title="Watch Product Video"
              >
                <img
                  src={product.images?.[0] || '/api/placeholder/400/300'}
                  alt="Product Video Thumbnail"
                  className="w-full h-full object-cover opacity-70"
                  onError={e => (e.target as HTMLImageElement).src = '/api/placeholder/400/300'}
                />
                {/* Play Icon Overlay */}
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-lg">
                    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.4)" />
                    <polygon points="10,8 16,12 10,16" fill="white" />
                  </svg>
                </span>
              </button>
            )}
            {product.images && product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => { setSelectedImage(index); setSelectedMedia('image'); }}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedMedia === 'image' && selectedImage === index ? 'border-blue-600 scale-105 shadow-md' : 'border-gray-200 hover:border-blue-400'}`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => (e.target as HTMLImageElement).src = '/api/placeholder/400/300'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {/* Price Section */}
          <div className="flex items-center mb-4">
            <span className="text-3xl font-bold text-blue-600 mr-3">{formatCurrency(product.price, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
            {/* Discount logic (mockup) */}
            {/* <span className="text-xl line-through text-gray-400 mr-2">{formatCurrency(product.originalPrice, business?.settings?.currency || DEFAULT_CURRENCY)}</span> */}
            {/* <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded font-bold">-20%</span> */}
          </div>
          {/* Ratings & Reviews */}
          <div className="flex items-center mb-2">
            <span className="text-yellow-400 text-lg mr-2">★</span>
            <span className="font-semibold text-gray-700">4.9</span>
            <span className="text-gray-500 ml-2">(127 reviews)</span>
          </div>
          {/* Seller/Brand Info */}
          <div className="text-sm text-gray-500 mb-4">Sold by <span className="font-semibold text-blue-700 cursor-pointer hover:underline">{business?.name || 'Brand Name'}</span></div>
          {/* Variations (mockup) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-xs text-gray-600">Size:</div>
              <div className="flex space-x-2">
                {product.sizes.map(size => (
                  <button key={size} className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300">{size}</button>
                ))}
              </div>
            </div>
          )}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-xs text-gray-600">Color:</div>
              <div className="flex space-x-2">
                {product.colors.map(color => (
                  <button key={color} className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-200 hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300" style={{backgroundColor: color.toLowerCase()}}></button>
                ))}
              </div>
            </div>
          )}
            {/* Dimensions */}
            {(product.dimensions?.width || product.dimensions?.height) && (
              <div className="mb-4">
                <div className="mb-2 text-xs text-gray-600">Dimensions:</div>
                <div className="flex space-x-4 text-gray-700">
                  {product.dimensions?.width && (
                    <span>Width: {product.dimensions.width} cm</span>
                  )}
                  {product.dimensions?.height && (
                    <span>Height: {product.dimensions.height} cm</span>
                  )}
                </div>
              </div>
            )}
          {/* Quantity & Stock */}
          <div className="flex items-center mb-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                disabled={quantity <= 1}
              >-
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                disabled={product.stock !== undefined && product.stock !== null && product.stock > 0 && quantity >= product.stock}
              >+
              </button>
            </div>
            <span className="text-gray-600 ml-3">
              {product.isActive ? (
                product.stock !== undefined && product.stock !== null
                  ? (product.stock > 0 ? `${product.stock} available` : 'Out of stock')
                  : 'Available'
              ) : 'Unavailable'}
            </span>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <Button 
              onClick={handleAddToCart} 
              className="w-full py-4 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all"
              disabled={!product.isActive}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button 
              onClick={handleBuyNow} 
              variant="outline" 
              className="w-full py-4 text-lg rounded-full border-blue-600 text-blue-600 font-bold shadow-md hover:bg-blue-50 transition-all"
              disabled={!product.isActive}
            >Buy Now
            </Button>
          </div>
          {/* Share Row */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600 font-medium">Share this product:</span>
            {/* Native Share Popup */}
            <button
              className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center hover:scale-110 transition-all"
              title="Share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: document.title,
                    text: 'Check out this product!',
                    url: window.location.href,
                  });
                } else {
                  alert('Sharing is not supported on this device.');
                }
              }}
            >
              <Share2 className="w-5 h-5" />
            </button>
            {/* Copy Link */}
            <button
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:scale-110 transition-all"
              title="Copy product link"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Product link copied!');
              }}
            >
              {/* Universally recognizable copy icon */}
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Details Section (Tabs/Accordion) */}
      <div className="mt-10">
        <Card className="p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
          <div className="text-gray-700 leading-relaxed mb-2">{product.description}</div>
          {/* Notes / Attention Section */}
          <div className="text-xs text-orange-600 mt-2">Note: Please check size and color before ordering. Delivery times may vary.</div>
        </Card>
      </div>

      {/* Reviews Section */}
      <div className="mt-10">
        <Card className="p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {[
              { name: 'John D.', rating: 5, comment: 'Excellent product! Exceeded my expectations.', date: '2024-01-15' },
              { name: 'Sarah M.', rating: 4, comment: 'Great quality and fast shipping. Very satisfied.', date: '2024-01-10' },
              { name: 'Mike R.', rating: 5, comment: 'Perfect! Exactly what I was looking for.', date: '2024-01-08' }
            ].map((review, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{review.name}</span>
                    <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};