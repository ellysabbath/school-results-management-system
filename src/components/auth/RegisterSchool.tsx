import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, Mail, Phone, MapPin, User, 
  AlertCircle, CheckCircle, Loader2, ArrowLeft,
  GraduationCap, X, CreditCard, Check, Zap,
  Shield, Users, BookOpen, FileText, Smartphone,
  Headphones, Award, DollarSign, Sparkles,
  SkipForward, School
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface SchoolFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  admin_name: string;
  admin_email: string;
  plan: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  admin_name?: string;
  admin_email?: string;
  plan?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  students: string;
  classes: string;
  features: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const RegisterSchool: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const locationState = location.state as { email?: string } | null;
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [schoolCreated, setSchoolCreated] = useState(false);
  const [createdSchoolId, setCreatedSchoolId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    email: locationState?.email || user?.email || '',
    phone: '',
    address: '',
    admin_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    admin_email: locationState?.email || user?.email || '',
    plan: 'starter',
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  // Payment Plans
  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      priceDisplay: 'Free',
      students: '30 Students',
      classes: '3 Classes',
      features: [
        'Basic Reports',
        'Email Support',
        '30 Days Free',
      ],
      icon: <Sparkles className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 25000,
      priceDisplay: 'Tsh 25,000/month',
      students: '100 Students',
      classes: '10 Classes',
      features: [
        'Detailed Reports',
        'PDF Export',
        'SMS Notifications',
        'Phone Support',
      ],
      isPopular: true,
      icon: <Zap className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 35000,
      priceDisplay: 'Tsh 35,000/month',
      students: '200 Students',
      classes: '15 Classes',
      features: [
        'Detailed Reports',
        'PDF Export',
        'SMS Notifications',
        'Phone Support',
        'Progress Dashboard',
        'Data Analytics',
      ],
      icon: <Award className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 75000,
      priceDisplay: 'Tsh 75,000/month',
      students: 'Unlimited Students',
      classes: 'Unlimited Classes',
      features: [
        'Detailed Reports',
        'PDF Export',
        'SMS Notifications',
        'Phone Support',
        'Progress Dashboard',
        'Data Analytics',
        'API Integration',
        'Priority Support',
      ],
      icon: <Shield className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  // Pre-fill from auth user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        admin_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || prev.admin_name,
        admin_email: user.email || prev.admin_email,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (locationState?.email) {
      setFormData(prev => ({
        ...prev,
        email: locationState.email || '',
        admin_email: locationState.email || '',
      }));
    }
  }, [locationState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setFormData(prev => ({ ...prev, plan: planId }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'School email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.admin_name.trim()) {
      newErrors.admin_name = 'Admin name is required';
      isValid = false;
    }

    if (!formData.admin_email.trim()) {
      newErrors.admin_email = 'Admin email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // If Trial plan is selected, register directly without payment
    if (selectedPlan === 'trial') {
      await registerSchool();
    } else {
      // Show payment modal for paid plans
      setShowPaymentModal(true);
    }
  };

  const registerSchool = async () => {
    setIsLoading(true);

    try {
      // Get selected plan details
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      // Create school after successful payment
      const response = await axios.post(`${API_BASE_URL}/schools/`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        plan: selectedPlan,
        status: 'active',
        // If trial, set trial period
        trial_ends_at: selectedPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      });

      if (response.data.status === 'success' || response.data.id) {
        const schoolId = response.data.id;
        setCreatedSchoolId(schoolId);
        setSchoolCreated(true);
        
        toast.success('School registered successfully! 🎉');
        
        if (selectedPlan === 'trial') {
          toast('Your 30-day free trial has started!', {
            icon: '🎊',
            duration: 5000,
          });
        } else {
          toast(`Payment of ${selectedPlanData?.priceDisplay} confirmed!`, {
            icon: '✅',
            duration: 5000,
          });
        }
        
        setShowPaymentModal(false);
        
        // Check if user is authenticated, if yes redirect to dashboard
        if (isAuthenticated) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          // Redirect to login for unauthenticated users
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      } else {
        toast.error(response.data.message || 'School registration failed');
        setShowPaymentModal(false);
      }

    } catch (err: any) {
      console.error('School registration error:', err);
      
      if (err.response?.data?.errors) {
        const fieldErrors: ValidationErrors = {};
        Object.keys(err.response.data.errors).forEach(key => {
          const messages = err.response.data.errors[key];
          fieldErrors[key as keyof ValidationErrors] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the field errors');
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error('School registration failed. Please try again.');
      }
      setShowPaymentModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async () => {
    await registerSchool();
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    navigate('/login');
    toast.info('School registration cancelled');
  };

  const closeCancelConfirm = () => {
    setShowCancelConfirm(false);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handleSkipToLogin = () => {
    navigate('/login');
    toast.info('You can register your school later from your profile');
  };

  const hasError = (field: keyof ValidationErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  const getError = (field: keyof ValidationErrors): string => {
    return errors[field] || '';
  };

  const getSelectedPlanDetails = (): Plan | undefined => {
    return plans.find(p => p.id === selectedPlan);
  };

  const selectedPlanDetails = getSelectedPlanDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-secondary-200 p-8 relative">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 hover:bg-secondary-100 rounded-lg transition-colors text-secondary-400 hover:text-secondary-600"
            title="Cancel registration"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">Register Your School</h1>
            <p className="text-secondary-500 mt-1">
              Complete your school registration and choose a payment plan
            </p>
            {formData.email && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                Email verified: {formData.email}
              </div>
            )}
            {isAuthenticated && (
              <div className="mt-1 text-xs text-primary-600">
                Logged in as: {user?.email}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Registration Form */}
            <div>
              <button
                onClick={() => navigate('/login')}
                className="mb-4 text-secondary-600 hover:text-secondary-800 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* School Information */}
                <div>
                  <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    School Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        School Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Green Valley High School"
                          className={`input-field pl-10 ${
                            hasError('name') ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {hasError('name') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {getError('name')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        School Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="school@domain.com"
                          className={`input-field pl-10 ${
                            hasError('email') ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {hasError('email') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {getError('email')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+255-XXX-XXX-XXX"
                          className="input-field pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-secondary-400" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="123 Education Street, City, Country"
                          className="input-field pl-10 min-h-[60px] resize-y"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Information */}
                <div>
                  <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-500" />
                    Administrator Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Admin Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          name="admin_name"
                          value={formData.admin_name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className={`input-field pl-10 ${
                            hasError('admin_name') ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {hasError('admin_name') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {getError('admin_name')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Admin Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="email"
                          name="admin_email"
                          value={formData.admin_email}
                          onChange={handleChange}
                          placeholder="john.doe@domain.com"
                          className={`input-field pl-10 ${
                            hasError('admin_email') ? 'border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {hasError('admin_email') && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {getError('admin_email')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column - Plans */}
            <div>
              <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-500" />
                Choose Your Plan
              </h3>
              <p className="text-xs text-secondary-400 mb-4">
                Select a plan that best fits your school's needs
              </p>

              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? `${plan.borderColor} ${plan.bgColor} shadow-md`
                        : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${plan.bgColor} ${plan.color}`}>
                          {plan.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${plan.color}`}>{plan.name}</h4>
                            {plan.isPopular && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-secondary-400">{plan.students} • {plan.classes}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-secondary-900">{plan.priceDisplay}</p>
                        {selectedPlan === plan.id && (
                          <span className="inline-block mt-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedPlan === plan.id && (
                      <div className="mt-3 pt-3 border-t border-secondary-200">
                        <ul className="grid grid-cols-2 gap-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-xs text-secondary-600">
                              <Check className="w-3 h-3 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* BUTTONS: Register & Proceed + Skip */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full btn-primary text-lg py-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {selectedPlan === 'trial' ? 'Start Free Trial' : 'Register & Proceed to Payment'}
                    </>
                  )}
                </button>

                {/* "I Don't Need" Button - Skip to Login */}
                <button
                  onClick={handleSkipToLogin}
                  disabled={isLoading}
                  className="w-full px-6 py-3 border-2 border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-600 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <SkipForward className="w-4 h-4" />
                  I Don't Need a Plan, Just Login
                </button>
              </div>

              <p className="text-center text-xs text-secondary-400 mt-3">
                You can change your plan at any time after registration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-secondary-900 mb-2">Cancel Registration?</h3>
              <p className="text-secondary-600 mb-2">
                Are you sure you want to cancel the school registration?
              </p>
              <p className="text-sm text-secondary-400 mb-6">
                Your progress will be lost. You can always register later.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={closeCancelConfirm}
                  className="px-6 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                >
                  Continue Registration
                </button>
                <button
                  onClick={confirmCancel}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedPlanDetails && selectedPlan !== 'trial' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">Confirm Payment</h3>
              <p className="text-secondary-500 mb-6">
                Please confirm your subscription payment
              </p>

              {/* School Summary */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-medium text-secondary-700">School Details</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-secondary-400">School:</span> {formData.name}</p>
                  <p><span className="text-secondary-400">Email:</span> {formData.email}</p>
                  <p><span className="text-secondary-400">Admin:</span> {formData.admin_name}</p>
                </div>
              </div>

              {/* Plan Summary */}
              <div className={`rounded-lg p-4 mb-6 ${selectedPlanDetails.bgColor} border ${selectedPlanDetails.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedPlanDetails.bgColor}`}>
                      {selectedPlanDetails.icon}
                    </div>
                    <div>
                      <p className={`font-semibold ${selectedPlanDetails.color}`}>
                        {selectedPlanDetails.name} Plan
                      </p>
                      <p className="text-xs text-secondary-500">
                        {selectedPlanDetails.students} • {selectedPlanDetails.classes}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-secondary-900">
                    {selectedPlanDetails.priceDisplay}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-secondary-200">
                  <ul className="grid grid-cols-2 gap-1">
                    {selectedPlanDetails.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <Check className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-secondary-400 mb-6">
                By confirming, you agree to our Terms of Service and Privacy Policy
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={closePaymentModal}
                  disabled={isProcessingPayment}
                  className="px-6 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={isProcessingPayment}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterSchool;