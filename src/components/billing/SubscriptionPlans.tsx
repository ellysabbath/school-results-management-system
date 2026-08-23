import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles, Star, Zap, CreditCard, TrendingUp } from 'lucide-react';
import { mockSubscriptionPlans } from '../../utils/mockData';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SubscriptionPlans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (plan: any) => {
    toast.success(`Selected ${plan.name} plan! Redirecting to payment...`);
  };

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
        {mockSubscriptionPlans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';
          
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 relative transition-all hover:shadow-xl ${
                plan.isPopular
                  ? 'border-primary-500 shadow-lg'
                  : 'border-secondary-200 hover:border-primary-300'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-4">
                  {plan.name === 'Starter' && <Sparkles className="w-6 h-6 text-primary-600" />}
                  {plan.name === 'Professional' && <Star className="w-6 h-6 text-primary-600" />}
                  {plan.name === 'Enterprise' && <Crown className="w-6 h-6 text-primary-600" />}
                </div>
                <h3 className="text-xl font-bold text-secondary-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-secondary-900">{formatCurrency(price)}</span>
                  <span className="text-secondary-500 text-sm ml-1">{priceLabel}</span>
                </div>
                <p className="text-xs text-secondary-400 mt-1">
                  {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-secondary-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
                  plan.isPopular
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700'
                }`}
              >
                {plan.isPopular ? 'Get Started' : 'Choose Plan'}
              </button>

              {plan.isPopular && (
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
        <button className="mt-3 px-6 py-2 bg-white border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors text-sm font-medium text-secondary-700">
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;