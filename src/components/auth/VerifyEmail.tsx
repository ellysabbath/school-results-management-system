import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Loader2, Mail, Building2, ArrowRight, 
  Zap, CreditCard, Award,
  Shield, Sparkles, Star, Crown, GraduationCap,
  
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [userEmail, setUserEmail] = useState(email);
  const [showPricing, setShowPricing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Prevent double API calls
  const hasVerified = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://resultmanagement.pythonanywhere.com/api';

  const plans = [
    {
      name: 'Basic',
      price: '15,000',
      period: '/month',
      features: ['50 Students', '5 Classes', 'Basic Reports', 'Email Support'],
      recommended: false,
      icon: Star,
      color: 'blue'
    },
    {
      name: 'Premium',
      price: '35,000',
      period: '/month',
      features: ['200 Students', '15 Classes', 'Detailed Reports', 'PDF Export', 'SMS Notifications', 'Phone Support'],
      recommended: true,
      icon: Crown,
      color: 'purple'
    },
    {
      name: 'Enterprise',
      price: '75,000',
      period: '/month',
      features: ['Unlimited Students', 'Unlimited Classes', 'Detailed Reports', 'PDF Export', 'SMS Notifications', 'API Access', '24/7 Support'],
      recommended: false,
      icon: Award,
      color: 'green'
    }
  ];

  useEffect(() => {
    // If no token, show error
    if (!token) {
      setStatus('error');
      setMessage('No verification token found');
      setIsLoading(false);
      return;
    }

    // Prevent double verification
    if (hasVerified.current) {
      console.log('Verification already attempted, skipping...');
      return;
    }

    const verifyEmail = async () => {
      // Mark as verified to prevent double calls
      hasVerified.current = true;
      
      try {
        console.log('Verifying token:', token);
        
        const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
          params: { token }
        });

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);

        // Handle different status responses
        if (response.data.status === 'success') {
          // Successfully verified
          setStatus('success');
          setMessage('Email verified successfully! Choose your plan to get started.');
          toast.success('Email verified successfully!');
          
          // Extract email from response if available
          if (response.data.data?.email) {
            setUserEmail(response.data.data.email);
          }
          
          setTimeout(() => {
            setShowPricing(true);
          }, 1500);
          
        } else if (response.data.status === 'already_verified') {
          // Email already verified - treat as success
          setStatus('success');
          setMessage('Email already verified! You can log in now.');
          toast.success('Email already verified!', {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            duration: 4000,
          });
          
          if (response.data.data?.email) {
            setUserEmail(response.data.data.email);
          }
          
          setTimeout(() => {
            setShowPricing(true);
          }, 1500);
          
        } else {
          // Any other status is an error
          setStatus('error');
          const errorMsg = response.data.message || 'Verification failed';
          setMessage(errorMsg);
          setErrorDetails(errorMsg);
          toast.error(errorMsg);
        }
        
      } catch (err: any) {
        console.error('Verification error:', err);
        console.error('Error response:', err.response);
        console.error('Error data:', err.response?.data);
        
        setStatus('error');
        
        let errorMsg = 'Verification failed. Please try again.';
        
        // Handle different error scenarios
        if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
          setErrorDetails(err.response.data.message);
        } else if (err.response?.data?.detail) {
          errorMsg = err.response.data.detail;
          setErrorDetails(err.response.data.detail);
        } else if (err.response?.status === 400) {
          errorMsg = 'Invalid or expired verification token. Please request a new verification email.';
          setErrorDetails('The verification link may have expired or been used already.');
        } else if (err.response?.status === 404) {
          errorMsg = 'Verification endpoint not found. Please contact support.';
          setErrorDetails('The verification URL is invalid.');
        } else if (err.code === 'ERR_NETWORK') {
          errorMsg = 'Network error. Please check your internet connection.';
          setErrorDetails('Unable to connect to the server.');
        }
        
        setMessage(errorMsg);
        toast.error(errorMsg);
        
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
    
    // Cleanup
    return () => {
      // No cleanup needed
    };
  }, [token]);

  const resendVerification = async () => {
    const emailInput = prompt('Please enter your email address to resend verification:');
    if (!emailInput) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification/`, { 
        email: emailInput 
      });
      
      if (response.data.status === 'success') {
        toast.success('Verification email sent! Please check your inbox.');
        setMessage('Verification email sent! Please check your inbox.');
        setUserEmail(emailInput);
        // Reset error state and allow retry
        setStatus('verifying');
        setErrorDetails(null);
        hasVerified.current = false; // Allow re-verification
      } else if (response.data.already_verified) {
        toast.success('Email already verified! You can log in.', {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          duration: 4000,
        });
        setStatus('success');
        setMessage('Email already verified! You can log in now.');
        setTimeout(() => {
          setShowPricing(true);
        }, 1500);
      } else {
        toast.error(response.data.message || 'Failed to resend verification');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend verification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planName: string) => {
    navigate('/register-school', { 
      state: { 
        email: userEmail,
        selectedPlan: planName 
      } 
    });
  };

  const renderPricingSection = () => (
    <div className="w-full max-w-5xl animate-slide-up mt-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Select Your Pricing Plan
          </h2>
          <p className="text-gray-600 mt-2">
            Choose the plan that best fits your school's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div 
                key={index} 
                className={`relative rounded-xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 ${
                  plan.recommended 
                    ? 'border-2 border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border border-gray-200 bg-white shadow-md hover:shadow-xl'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-4 py-1.5 rounded-full font-medium shadow-lg shadow-blue-200">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    plan.recommended ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      plan.recommended ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                </div>

                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-blue-600">Tsh {plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                        plan.recommended ? 'text-blue-500' : 'text-green-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`block w-full text-center py-2.5 rounded-lg transition ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-200'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Choose {plan.name}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              <span>All plans include core features</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">School</h1>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Manager</span>
            </div>
          </div>

          <div className="mb-6">
            {status === 'verifying' && (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>

          {status === 'error' && errorDetails && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600">
                <strong>Error details:</strong> {errorDetails}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4 inline" />
                  Your email has been verified successfully!
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium flex items-center justify-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Ready to get started?
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Choose a plan below to complete your registration.
                </p>
              </div>

              {!showPricing && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Loading plans...</span>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={resendVerification}
                disabled={isLoading}
                className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>
              <Link
                to="/login"
                className="inline-block text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Login
              </Link>
            </div>
          )}

          {status === 'verifying' && (
            <p className="text-sm text-gray-400 mt-4">
              Please wait while we verify your email...
            </p>
          )}
        </div>
      </div>

      {status === 'success' && showPricing && renderPricingSection()}

      {status === 'success' && showPricing && (
        <footer className="w-full mt-12 text-center text-sm text-gray-400 border-t border-gray-200 pt-6">
          <p>© 2026 SchoolManager. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
};

export default VerifyEmail;