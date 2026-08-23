import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Shield, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentMethod: React.FC = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Payment method added successfully!');
    navigate('/billing');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/billing')}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Payment Method</h1>
          <p className="text-secondary-500">Add or update your payment information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Card Number *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    required
                    className="input-field pl-10"
                    maxLength={19}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Name on Card *
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="input-field"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="•••"
                    required
                    className="input-field"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Add Payment Method
                </div>
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-3">Security</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Encrypted Connection</p>
                  <p className="text-xs text-secondary-400">Your data is protected with 256-bit SSL encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">PCI Compliant</p>
                  <p className="text-xs text-secondary-400">We follow strict security standards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-900">Secure Payment</p>
                <p className="text-xs text-primary-700">
                  Your card will be charged $59.00 monthly. You can cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;