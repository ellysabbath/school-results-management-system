// src/pages/SubscriptionManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, DollarSign, Calendar, Clock, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Loader2, School, Hash, TrendingUp,
  Award, Crown, Star, Zap, Shield, ArrowRight, Building2,
  Users, BookOpen, FileText, BarChart3, Mail, Phone,
  User,
  Search,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService, schoolService } from '../api/schoolApi';
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
  trial_days: number;
  is_active: boolean;
  is_unlimited_students: boolean;
  is_unlimited_teachers: boolean;
  is_unlimited_classes: boolean;
  is_unlimited_subjects: boolean;
}

interface Subscription {
  id: number;
  school: number;
  school_name: string;
  school_code: string;
  plan: number;
  plan_name: string;
  plan_display_name: string;
  status: string;
  days_remaining: number;
  is_active: boolean;
  is_trial: boolean;
  is_expiring_soon: boolean;
  current_period_end: string;
  auto_renew: boolean;
}

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // School search states
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const userSchoolCode = school?.school_code || user?.school_id || null;
  const userEmail = user?.email || '';

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      const response = await subscriptionService.getPlans();
      setPlans(response.results || response);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  }, []);

  // Fetch subscription for a school
  const fetchSubscription = useCallback(async (schoolCode: string) => {
    try {
      const response = await subscriptionService.getSubscriptions({
        school_code: schoolCode
      });
      const subscriptions = response.results || response;
      if (subscriptions && subscriptions.length > 0) {
        setSubscription(subscriptions[0]);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setSubscription(null);
    }
  }, []);

  // Fetch my school data
  const fetchMySchoolByAdminEmail = useCallback(async () => {
    if (!userEmail) {
      toast.error('No email found for logged in user');
      return;
    }

    setIsLoadingMySchool(true);
    setSearchError(null);

    try {
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          setCurrentSchoolInfo({
            code: schoolData.school_code,
            name: schoolData.name,
            id: schoolData.id
          });
          await fetchPlans();
          await fetchSubscription(schoolCode);
          toast.success(`Loaded subscription for ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account.');
      }
    } catch (error: any) {
      console.error('Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail, fetchPlans, fetchSubscription]);

  // Fetch data by school code
  const fetchDataBySchoolCode = useCallback(async (schoolCode: string) => {
    if (!schoolCode || schoolCode.trim() === '') {
      toast.error('Please enter a school code');
      return;
    }

    const cleanCode = schoolCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(cleanCode)) {
      toast.error('School code must be 5 characters');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // Check if school exists
      const schoolResponse = await schoolService.getSchools({
        school_code: cleanCode,
        page_size: 1
      });
      
      const schoolResults = schoolResponse.results || schoolResponse;
      if (!schoolResults || schoolResults.length === 0) {
        setSearchError('School not found');
        toast.error('School not found');
        setIsLoading(false);
        return;
      }

      const schoolData = schoolResults[0];
      setCurrentSchoolInfo({
        code: schoolData.school_code,
        name: schoolData.name,
        id: schoolData.id
      });

      await fetchPlans();
      await fetchSubscription(cleanCode);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setSearchError(error.response?.data?.message || 'Failed to fetch data');
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [fetchPlans, fetchSubscription]);

  // Auto-load on mount
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetchMySchoolByAdminEmail();
    } else {
      setIsInitialLoading(false);
    }
  }, [isAuthenticated, userEmail, fetchMySchoolByAdminEmail]);

  // Handle plan selection
  const handleSelectPlan = async (planId: number) => {
    if (!currentSchoolInfo) {
      toast.error('Please search for a school first');
      return;
    }

    setIsProcessing(true);
    try {
      await subscriptionService.createSubscription({
        school_id: currentSchoolInfo.id,
        plan_id: planId
      });
      
      toast.success('Subscription updated successfully!');
      await fetchSubscription(currentSchoolInfo.code);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to update subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDataBySchoolCode(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchError(null);
    setSubscription(null);
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'trial': return <Zap className="w-5 h-5" />;
      case 'starter': return <Star className="w-5 h-5" />;
      case 'professional': return <Crown className="w-5 h-5" />;
      case 'enterprise': return <Award className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'trial': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'starter': return 'bg-green-100 text-green-700 border-green-200';
      case 'professional': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'enterprise': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'trial': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to manage subscriptions</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-600" />
            Subscription Management
          </h1>
          <p className="text-secondary-500">Manage your school subscription and billing</p>
          {currentSchoolInfo && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <School className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {currentSchoolInfo.name}
              </span>
              <span className="text-xs font-mono bg-primary-50 px-2 py-0.5 rounded text-primary-600 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {currentSchoolInfo.code}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentSchoolInfo && (
            <button
              onClick={() => fetchDataBySchoolCode(currentSchoolInfo.code)}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-secondary-700 mb-1 block">
                Search by School Code
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Enter school code (e.g., AY8NH)"
                    value={searchSchoolCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (/^[A-Z0-9]*$/.test(value) || value === '') {
                        setSearchSchoolCode(value);
                        setSearchError(null);
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all uppercase ${
                      searchError ? 'border-red-500' : 'border-secondary-200'
                    }`}
                    maxLength={10}
                  />
                  {searchError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !searchSchoolCode.trim()}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2.5 text-secondary-600 hover:text-secondary-800 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-1 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </form>
              {searchError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {searchError}
                </p>
              )}
            </div>
          </div>

          {/* My School Button */}
          {userEmail && !currentSchoolInfo && !isLoading && !isInitialLoading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-secondary-200" />
              <button
                onClick={handleMySchool}
                disabled={isLoadingMySchool}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isLoadingMySchool ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue with my school
              </button>
              <div className="h-px flex-1 bg-secondary-200" />
            </div>
          )}
        </div>

        {/* Current Subscription */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-medium text-secondary-700">Current Subscription</h3>
                {subscription ? (
                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(subscription.plan_name)}`}>
                      {subscription.plan_display_name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                    {subscription.is_expiring_soon && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {subscription.days_remaining} days left
                      </span>
                    )}
                    {subscription.days_remaining > 0 && !subscription.is_expiring_soon && (
                      <span className="text-sm text-secondary-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {subscription.days_remaining} days remaining
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500 mt-2">No active subscription found</p>
                )}
              </div>
              {subscription && (
                <div className="text-right text-sm text-secondary-400">
                  <p>Renewal: {formatDate(subscription.current_period_end)}</p>
                  <p>Auto-renew: {subscription.auto_renew ? 'Enabled' : 'Disabled'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {currentSchoolInfo && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-secondary-700 mb-4">Available Plans</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                <span className="ml-2 text-secondary-500">Loading plans...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-secondary-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No plans available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => {
                  const isCurrent = subscription?.plan === plan.id;
                  const isSelected = selectedPlan === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isCurrent 
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-secondary-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${getPlanColor(plan.name)}`}>
                          {getPlanIcon(plan.name)}
                        </div>
                        {isCurrent && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-secondary-900">{plan.display_name}</h4>
                      <p className="text-xs text-secondary-400 mt-1">{plan.description}</p>
                      
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-secondary-900">
                          {plan.price === 0 ? 'Free' : `Tsh ${plan.price.toLocaleString()}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-xs text-secondary-400">/{plan.billing_period}</span>
                        )}
                        {plan.trial_days > 0 && (
                          <span className="text-xs text-green-600 ml-2">
                            {plan.trial_days} days trial
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-secondary-600">
                          <Users className="w-3.5 h-3.5" />
                          {plan.is_unlimited_students ? 'Unlimited' : plan.max_students} Students
                        </div>
                        <div className="flex items-center gap-2 text-xs text-secondary-600">
                          <User className="w-3.5 h-3.5" />
                          {plan.is_unlimited_teachers ? 'Unlimited' : plan.max_teachers} Teachers
                        </div>
                        <div className="flex items-center gap-2 text-xs text-secondary-600">
                          <BookOpen className="w-3.5 h-3.5" />
                          {plan.is_unlimited_classes ? 'Unlimited' : plan.max_classes} Classes
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        {plan.feature_list.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-secondary-600">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isCurrent || isProcessing}
                        className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          isCurrent
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isProcessing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : isCurrent ? (
                          'Active Plan'
                        ) : (
                          `Select ${plan.display_name}`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;