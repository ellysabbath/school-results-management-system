import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles, Star, Zap, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { subscriptionService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  billing_period: string;
  max_students: number;
  max_teachers: number;
  max_classes: number;
  max_subjects: number;
  feature_list: string[];
  is_unlimited_students: boolean;
  is_unlimited_teachers: boolean;
  is_unlimited_classes: boolean;
  is_unlimited_subjects: boolean;
  trial_days: number;
  is_active: boolean;
}

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const response = await subscriptionService.getPlans();
        console.log('[SubscriptionPlans] Plans response:', response);
        
        let planData = [];
        if (response.results) {
          planData = response.results;
        } else if (Array.isArray(response)) {
          planData = response;
        }
        
        setPlans(planData);
      } catch (error: any) {
        console.error('[SubscriptionPlans] Failed to fetch plans:', error);
        toast.error(error.response?.data?.message || 'Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    setIsProcessing(true);
    try {
      // Navigate to payment or subscription creation
      toast.success(`Selected ${plan.display_name} plan!`);
      
      // You can navigate to payment page or open a modal
      navigate('/billing/payment', { 
        state: { 
          planId: plan.id,
          planName: plan.display_name,
          price: plan.price,
          billingPeriod: billingCycle
        } 
      });
    } catch (error: any) {
      console.error('[SubscriptionPlans] Failed to select plan:', error);
      toast.error(error.response?.data?.message || 'Failed to select plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('starter') || name.includes('basic')) {
      return <Sparkles className="w-6 h-6 text-primary-600" />;
    } else if (name.includes('professional') || name.includes('pro')) {
      return <Star className="w-6 h-6 text-primary-600" />;
    } else if (name.includes('enterprise') || name.includes('premium')) {
      return <Crown className="w-6 h-6 text-primary-600" />;
    }
    return <Zap className="w-6 h-6 text-primary-600" />;
  };

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('starter') || name.includes('basic')) {
      return 'border-blue-200 hover:border-blue-400';
    } else if (name.includes('professional') || name.includes('pro')) {
      return 'border-purple-200 hover:border-purple-400';
    } else if (name.includes('enterprise') || name.includes('premium')) {
      return 'border-amber-200 hover:border-amber-400';
    }
    return 'border-secondary-200 hover:border-primary-300';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Determine which plan is most popular (usually the middle one or professional)
  const getIsPopular = (index: number, total: number) => {
    if (total === 1) return true;
    if (total === 2) return index === 0;
    if (total === 3) return index === 1; // Middle plan is most popular
    return index === Math.floor(total / 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Loading Plans...</h3>
          <p className="text-secondary-500">Please wait while we load available plans</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">No Plans Available</h3>
          <p className="text-secondary-500">Please check back later for available subscription plans</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Subscription Plans</h1>
        <p className="text-secondary-500">Choose the perfect plan for your school</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
            billingCycle === 'yearly'
              ? 'bg-primary-600 text-white'
              : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
            Save 20%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const isPopular = getIsPopular(index, plans.length);
          // For yearly pricing, you might want to calculate discount
          const price = billingCycle === 'monthly' 
            ? plan.price 
            : plan.price * 12 * 0.8; // 20% discount for yearly
          const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';
          
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 relative transition-all hover:shadow-xl ${
                isPopular
                  ? 'border-primary-500 shadow-lg'
                  : getPlanColor(plan.name)
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-bold text-secondary-900">{plan.display_name}</h3>
                <p className="text-xs text-secondary-400 mt-1 line-clamp-2">{plan.description}</p>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-secondary-900">{formatCurrency(price)}</span>
                  <span className="text-secondary-500 text-sm ml-1">{priceLabel}</span>
                </div>
                <p className="text-xs text-secondary-400 mt-1">
                  {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                </p>
                {plan.trial_days > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {plan.trial_days} days free trial
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {/* Feature list from API */}
                {plan.feature_list && plan.feature_list.length > 0 ? (
                  plan.feature_list.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  // Fallback features based on plan limits
                  <>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.is_unlimited_students ? 'Unlimited Students' : `${plan.max_students} Students`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.is_unlimited_teachers ? 'Unlimited Teachers' : `${plan.max_teachers} Teachers`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.is_unlimited_classes ? 'Unlimited Classes' : `${plan.max_classes} Classes`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.is_unlimited_subjects ? 'Unlimited Subjects' : `${plan.max_subjects} Subjects`}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isProcessing}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  isPopular
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  isPopular ? 'Get Started' : 'Choose Plan'
                )}
              </button>

              {isPopular && (
                <p className="text-center text-xs text-secondary-400 mt-2">
                  30-day money-back guarantee
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-secondary-50 rounded-xl border border-secondary-200 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h4 className="font-semibold text-secondary-900">Need a custom plan?</h4>
        </div>
        <p className="text-sm text-secondary-500">
          Contact us for enterprise solutions, custom integrations, and volume discounts.
        </p>
        <button 
          onClick={() => toast.info('Contact sales feature coming soon')}
          className="mt-3 px-6 py-2 bg-white border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors text-sm font-medium text-secondary-700"
        >
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;