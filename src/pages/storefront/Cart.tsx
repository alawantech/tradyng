import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Sparkles, Heart, Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useCart } from '../../contexts/CartContext';
import { useStore } from './StorefrontLayout';
import { formatCurrency, DEFAULT_CURRENCY } from '../../constants/currencies';

export const Cart: React.FC = () => {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { business } = useStore();

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative inline-block mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full shadow-2xl">
                <ShoppingCart className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4"
            >
              Your Cart is Empty
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-gray-600 mb-12 max-w-md mx-auto"
            >
              Discover amazing products from {business.name} and fill your cart with treasures!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Shopping
                  <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/20">
              <div className="relative">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{itemCount}</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                Your Shopping Cart
              </h1>
            </div>
            <p className="text-gray-600 mt-4 text-lg">
              {itemCount} amazing {itemCount === 1 ? 'item' : 'items'} waiting for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl border-0 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative flex items-center space-x-6">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative"
                        >
                          <img
                            src={item.image || '/api/placeholder/100/100'}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/100/100';
                            }}
                          />
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full p-1">
                            <Heart className="h-3 w-3 text-white" />
                          </div>
                        </motion.div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors duration-300 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-lg font-semibold text-blue-600 mb-3">
                            {formatCurrency(item.price, business?.settings?.currency || DEFAULT_CURRENCY)} each
                          </p>

                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">Premium Quality</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-4">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner"
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </motion.button>

                            <motion.span
                              key={`qty-${item.id}`}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="w-12 text-center font-bold text-gray-900"
                            >
                              {item.quantity}
                            </motion.span>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors duration-200"
                            >
                              <Plus className="h-4 w-4" />
                            </motion.button>
                          </motion.div>

                          <div className="text-right">
                            <motion.p
                              key={`total-${item.id}`}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                            >
                              {formatCurrency(item.price * item.quantity, business?.settings?.currency || DEFAULT_CURRENCY)}
                            </motion.p>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeItem(item.id)}
                              className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center transition-colors duration-200"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-8 bg-gradient-to-br from-white to-blue-50/50 shadow-2xl border-0 sticky top-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg mb-4">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                      Order Summary
                    </h2>
                  </div>

                  <div className="space-y-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex justify-between items-center p-4 bg-white/60 rounded-xl"
                    >
                      <span className="text-gray-700 font-medium">Subtotal ({itemCount} items)</span>
                      <span className="font-bold text-gray-900">{formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200"
                    >
                      <span className="text-green-700 font-medium flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Shipping
                      </span>
                      <span className="font-bold text-green-700">FREE</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="border-t-2 border-gradient-to-r from-blue-500 to-purple-500 pt-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">Total</span>
                        <motion.span
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.9, type: "spring" }}
                          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                        >
                          {formatCurrency(total, business?.settings?.currency || DEFAULT_CURRENCY)}
                        </motion.span>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      <Link to="/checkout" className="block">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Proceed to Checkout
                        </Button>
                      </Link>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-gray-300 hover:border-red-400 text-gray-700 hover:text-red-600 py-4 rounded-xl hover:bg-red-50 transition-all duration-300"
                        onClick={clearCart}
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Clear Cart
                      </Button>
                    </motion.div>
                  </div>

                  {/* Store Info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-8 pt-6 border-t border-gray-200"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-3">
                        <Heart className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Shopping from</h3>
                      <p className="text-lg font-semibold text-blue-600 mb-1">{business.name}</p>
                      {business.phone && (
                        <p className="text-sm text-gray-500 flex items-center justify-center">
                          <span className="mr-2">📞</span>
                          {business.phone}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};