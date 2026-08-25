import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentMethod: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get plan data from navigation state
  const state = location.state as { planId?: number; planName?: string; price?: number; billingPeriod?: string } || {};
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/(.{1,4})/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: '' }));
      }
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
      if (errors.expiryDate) {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
      if (errors.cvv) {
        setErrors(prev => ({ ...prev, cvv: '' }));
      }
    }
  };

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value);
    if (errors.cardName) {
      setErrors(prev => ({ ...prev, cardName: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Card number validation
    const cardNumberClean = cardNumber.replace(/\s/g, '');
    if (!cardNumberClean || cardNumberClean.length < 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    // Card name validation
    if (!cardName || cardName.trim().length < 2) {
      newErrors.cardName = 'Please enter the name on the card';
    }

    // Expiry date validation
    if (!expiryDate || expiryDate.length < 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const expMonth = parseInt(month);
      const expYear = parseInt(year);
      
      if (expMonth < 1 || expMonth > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!cvv || cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV (3-4 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      // In a real app, you would call your payment API here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // If you have a plan ID, create a subscription
      if (state.planId) {
        // Create subscription with the selected plan
        // You would need to get the school ID from context or auth
        // const schoolId = user?.school_id;
        // await subscriptionService.createSubscription({
        //   school_id: schoolId,
        //   plan_id: state.planId
        // });
        
        toast.success(`Payment successful! You are now subscribed to ${state.planName || 'the plan'}`);
      } else {
        toast.success('Payment method added successfully!');
      }
      
      // Navigate to billing or subscription page
      setTimeout(() => {
        navigate('/billing');
      }, 1000);
      
    } catch (error: any) {
      console.error('[PaymentMethod] Payment failed:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get card type from number
  const getCardType = (number: string) => {
    const clean = number.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('3')) return 'Amex';
    if (clean.startsWith('6')) return 'Discover';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Payment Method</h1>
          <p className="text-secondary-500">
            {state.planName 
              ? `Subscribe to ${state.planName} plan` 
              : 'Add or update your payment information'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {state.planName && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-900">Selected Plan</p>
                      <p className="text-lg font-bold text-primary-900">{state.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary-700">Amount</p>
                      <p className="text-lg font-bold text-primary-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'TZS',
                          minimumFractionDigits: 0,
                        }).format(state.price || 0)}
                      </p>
                      <p className="text-xs text-primary-600">
                        {state.billingPeriod || 'Monthly'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Card Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.cardNumber ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    maxLength={19}
                    disabled={isProcessing}
                    autoComplete="cc-number"
                  />
                  {cardNumber.replace(/\s/g, '').length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-secondary-400">
                      {getCardType(cardNumber)}
                    </span>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Name on Card <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={handleCardNameChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.cardName ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isProcessing}
                  autoComplete="cc-name"
                />
                {errors.cardName && (
                  <p className="text-xs text-red-500 mt-1">{errors.cardName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/YY"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.expiryDate ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    maxLength={5}
                    disabled={isProcessing}
                    autoComplete="cc-exp"
                  />
                  {errors.expiryDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="•••"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.cvv ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    maxLength={4}
                    disabled={isProcessing}
                    autoComplete="cc-csc"
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {state.planName ? 'Subscribe Now' : 'Add Payment Method'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-3">Security</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Encrypted Connection</p>
                  <p className="text-xs text-secondary-400">Your data is protected with 256-bit SSL encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">PCI Compliant</p>
                  <p className="text-xs text-secondary-400">We follow strict security standards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-900">Secure Payment</p>
                <p className="text-xs text-primary-700">
                  {state.planName 
                    ? `You are subscribing to ${state.planName} plan. You can cancel anytime.`
                    : 'Your card will be charged according to your selected plan. You can cancel anytime.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-xl border border-secondary-200 p-4">
            <h4 className="text-sm font-medium text-secondary-900 mb-2">Accepted Cards</h4>
            <div className="flex gap-3">
              <div className="w-12 h-8 bg-white rounded border border-secondary-200 flex items-center justify-center text-xs font-bold text-secondary-400">
                Visa
              </div>
              <div className="w-12 h-8 bg-white rounded border border-secondary-200 flex items-center justify-center text-xs font-bold text-secondary-400">
                MC
              </div>
              <div className="w-12 h-8 bg-white rounded border border-secondary-200 flex items-center justify-center text-xs font-bold text-secondary-400">
                Amex
              </div>
              <div className="w-12 h-8 bg-white rounded border border-secondary-200 flex items-center justify-center text-xs font-bold text-secondary-400">
                Disc
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;