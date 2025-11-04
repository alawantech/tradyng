import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, ChevronDown, Rocket, Building, Crown, Sparkles, ArrowRight, Users, TrendingUp, Award, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PRICING_PLANS } from '../../constants/plans';
import { AuthService } from '../../services/auth';

interface PricingSectionProps {
  showHeader?: boolean;
  className?: string;
  sectionId?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  showHeader = true,
  className = '',
  sectionId = 'pricing'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to business plan when hash is #business
  useEffect(() => {
    if (location.hash === '#business') {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        const businessPlanCard = document.getElementById('business-plan-card');
        if (businessPlanCard) {
          businessPlanCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          
          // Add a highlight effect
          businessPlanCard.classList.add('highlight-pulse');
          setTimeout(() => {
            businessPlanCard.classList.remove('highlight-pulse');
          }, 2000);
        }
      }, 300);
    }
  }, [location.hash]);

  // FAQ data
  const faqData = [
    {
      id: 1,
      question: "Can I change my plan later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades or at the next billing cycle for downgrades."
    },
    {
      id: 2,
      question: "Do you offer support for setting up my store?",
      answer: "Absolutely! We provide comprehensive setup assistance including product uploads, payment gateway configuration, and store customization to get you started quickly."
    },
    {
      id: 3,
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees or hidden charges. You only pay the monthly subscription fee."
    },
    {
      id: 4,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and bank transfers within Nigeria."
    }
  ];

  // FAQ toggle state
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const handlePlanSelection = async (plan: typeof PRICING_PLANS[0]) => {
    try {
      console.log('🎯 Plan selected:', plan.id, plan.name);
      
      // Free plan always goes to signup - no coupon needed
      if (plan.id === 'free') {
        console.log('🆓 Free plan selected - redirecting to signup');
        navigate(`/auth/signup?plan=${plan.id}`);
        return;
      }
      
      // For paid plans, check if user is authenticated
      const currentUser = await AuthService.getCurrentUser();

      if (currentUser) {
        // User is authenticated - redirect to coupon page for paid plans
        console.log('✅ Authenticated user selecting paid plan:', plan.id);
        navigate(`/coupon?plan=${plan.id}&amount=${plan.yearlyPrice}`);
      } else {
        // User not authenticated - redirect to signup with plan
        console.log('🔐 Non-authenticated user - redirecting to signup with plan:', plan.id);
        navigate(`/auth/signup?plan=${plan.id}`);
      }
    } catch (error) {
      console.error('❌ Error in handlePlanSelection:', error);
      // Fallback to signup if there's an error
      console.log('⚠️ Fallback - redirecting to signup');
      navigate(`/auth/signup?plan=${plan.id}`);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Rocket className="w-10 h-10" />;
      case 'business':
        return <Building className="w-10 h-10" />;
      case 'pro':
        return <Crown className="w-10 h-10" />;
      default:
        return <Shield className="w-10 h-10" />;
    }
  };

  const getPlanColors = (planId: string) => {
    switch (planId) {
      case 'free':
        return {
          gradient: 'from-blue-500 via-cyan-500 to-teal-500',
          bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
          border: 'border-blue-200',
          ring: 'ring-blue-400',
          button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-blue-500/25',
          accent: 'text-blue-600',
          glow: 'shadow-blue-500/20'
        };
      case 'business':
        return {
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
          border: 'border-emerald-200',
          ring: 'ring-emerald-400',
          button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-500/25',
          accent: 'text-emerald-600',
          glow: 'shadow-emerald-500/20'
        };
      case 'pro':
        return {
          gradient: 'from-purple-500 via-violet-500 to-pink-500',
          bgGradient: 'from-purple-50 via-violet-50 to-pink-50',
          border: 'border-purple-200',
          ring: 'ring-purple-400',
          button: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-purple-500/25',
          accent: 'text-purple-600',
          glow: 'shadow-purple-500/20'
        };
      default:
        return {
          gradient: 'from-gray-500 via-slate-500 to-zinc-500',
          bgGradient: 'from-gray-50 via-slate-50 to-zinc-50',
          border: 'border-gray-200',
          ring: 'ring-gray-400',
          button: 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-gray-500/25',
          accent: 'text-gray-600',
          glow: 'shadow-gray-500/20'
        };
    }
  };

  return (
    <section id={sectionId} className={`relative overflow-hidden ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* Floating Elements - Hidden on mobile for better performance */}
        <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="hidden sm:block absolute top-40 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="hidden sm:block absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="hidden sm:block absolute bottom-40 right-1/3 w-16 h-16 bg-pink-200/20 rounded-full blur-xl animate-pulse delay-1500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {showHeader && (
          <motion.div
            className="text-center mb-8 sm:mb-10 lg:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Compelling Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              <span className="text-sm font-bold text-green-700">💰 Incredibly Affordable - Just ₦16k/Year</span>
            </motion.div>

            <motion.h2
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="block text-gray-900 mb-2">Simple, Transparent Pricing</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                That Grows With You
              </span>
            </motion.h2>

            <motion.p
              className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Choose the plan that fits your business and <span className="font-bold text-blue-600">start selling today</span>. 
              <span className="block mt-2 font-semibold text-gray-900">Incredibly affordable. No hidden fees. Cancel anytime.</span>
            </motion.p>

            {/* Enhanced Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <Check className="w-5 h-5" />
                  <span className="text-lg">No Setup Fees</span>
                </div>
                <span className="text-xs text-gray-500">Get started instantly</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <Shield className="w-5 h-5" />
                  <span className="text-lg">Free Setup Help</span>
                </div>
                <span className="text-xs text-gray-500">We'll build it for you</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-purple-600 font-bold">
                  <Users className="w-5 h-5" />
                  <span className="text-lg">5000+ Stores</span>
                </div>
                <span className="text-xs text-gray-500">Join successful businesses</span>
              </div>
            </motion.div>

            {/* Value Proposition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl shadow-lg"
            >
              <div className="text-3xl">🎉</div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">Special Launch Offer</div>
                <div className="text-xs text-gray-600">Pay yearly and save 20% - That's just ₦1,333/month!</div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {PRICING_PLANS.map((plan, index) => {
            const colors = getPlanColors(plan.id);
            const isHovered = hoveredPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                id={plan.id === 'business' ? 'business-plan-card' : undefined}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                className="relative group"
                onHoverStart={() => setHoveredPlan(plan.id)}
                onHoverEnd={() => setHoveredPlan(null)}
              >
                {plan.isPopular && (
                  <motion.div
                    className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.15 + 0.5, type: "spring", stiffness: 200 }}
                  >
                    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Most Popular</span>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                  </motion.div>
                )}

                <motion.div
                  className={`relative h-full transition-all duration-500 ${
                    plan.isPopular
                      ? `transform scale-105 ${colors.ring} ring-4 ${colors.glow} shadow-2xl`
                      : `hover:scale-105 hover:shadow-2xl hover:${colors.glow}`
                  }`}
                  animate={isHovered ? {
                    y: -10,
                    boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)`
                  } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className={`relative overflow-hidden h-full bg-white/80 backdrop-blur-sm border-0 ${
                    plan.isPopular ? `bg-gradient-to-br ${colors.bgGradient}` : ''
                  }`}>
                    {/* Background Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Animated Border */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl`}></div>

                    <div className="relative p-6 sm:p-8 h-full flex flex-col">
                      {/* Plan Header */}
                      <div className="text-center mb-6 sm:mb-8">
                        <motion.div
                          className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${colors.gradient} rounded-2xl mb-4 sm:mb-6 shadow-lg`}
                          animate={isHovered ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="text-white">
                            {getPlanIcon(plan.id)}
                          </div>
                        </motion.div>

                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed px-2">{plan.description}</p>
                      </div>

                      {/* Price Display */}
                      <div className="text-center mb-6 sm:mb-8">
                        <motion.div
                          className="flex items-baseline justify-center mb-2"
                          animate={isHovered ? { scale: 1.05 } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <span className={`text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                            {plan.id === 'free' ? 'Free' : `₦${plan.yearlyPrice.toLocaleString()}`}
                          </span>
                          {plan.id !== 'free' && (
                            <span className="text-gray-500 ml-2 sm:ml-3 text-lg sm:text-xl font-medium">/year</span>
                          )}
                        </motion.div>

                        {plan.id === 'free' && (
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>3-day trial</span>
                          </div>
                        )}

                        {plan.id !== 'free' && (
                          <div className="text-center">
                            <div className="inline-flex items-center space-x-1 text-sm text-green-600 font-medium">
                              <TrendingUp className="w-4 h-4" />
                              <span>Save 20% vs monthly</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Features List */}
                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            className="flex items-start"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 + featureIndex * 0.1 }}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <motion.div
                                animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.6, delay: featureIndex * 0.1 }}
                              >
                                <Check className={`h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-r ${colors.gradient} rounded-full p-0.5 sm:p-1 text-white`} />
                              </motion.div>
                            </div>
                            <span className="ml-2 sm:ml-3 text-gray-700 leading-relaxed text-sm">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>

                      {/* Call to Action */}
                      <div className="mt-auto">
                        <Button
                          onClick={() => handlePlanSelection(plan)}
                          className={`w-full py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl ${colors.button} group/btn`}
                        >
                          <span className="flex items-center justify-center space-x-2">
                            <span>{plan.buttonText}</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                        </Button>

                        {plan.id === 'free' && (
                          <p className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                            No credit card required • Start instantly
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Additional Information */}
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto shadow-2xl overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
              <motion.div
                className="flex items-center justify-center mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/30">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </motion.div>

              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 px-4">
                🎯 Can't Set Up Your Store?
              </h3>
              <p className="text-xl sm:text-2xl text-white mb-3 px-4 font-bold">
                We'll Do It For You - 100% FREE!
              </p>
              <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
                Our expert team will build your complete store, upload products, set up payments, and customize everything - 
                <span className="font-bold text-white"> absolutely FREE</span>. You just provide the content, we handle the rest!
              </p>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 px-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl mb-2">🚀</div>
                  <div className="text-sm font-bold text-white">Quick Setup</div>
                  <div className="text-xs text-blue-100">Ready in 24-48hrs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl mb-2">💼</div>
                  <div className="text-sm font-bold text-white">Professional</div>
                  <div className="text-xs text-blue-100">Expert designers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl mb-2">🎁</div>
                  <div className="text-sm font-bold text-white">100% Free</div>
                  <div className="text-xs text-blue-100">No extra charges</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/contact">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-2xl hover:shadow-white/20 px-8 py-4 text-lg font-bold rounded-xl w-full sm:w-auto">
                      <span className="flex items-center gap-2">
                        Launch Your Store Now
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <a href="https://wa.me/2348156853636" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 hover:text-white px-8 py-4 text-lg font-bold rounded-xl w-full sm:w-auto">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Contact Sales Team
                      </span>
                    </Button>
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced FAQ Section */}
        <motion.div
          className="max-w-4xl mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">
              Everything you need to know about our pricing and features
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <motion.button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 sm:px-8 py-4 sm:py-6 text-left flex justify-between items-center hover:bg-gray-50/50 transition-colors group"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h4 className="font-semibold text-gray-900 pr-4 text-base sm:text-lg">
                    {faq.question}
                  </h4>
                  <motion.div
                    animate={{ rotate: openFAQ === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {openFAQ === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 sm:px-8 pb-4 sm:pb-6">
                        <div className="border-t border-gray-100 pt-4 sm:pt-6">
                          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};