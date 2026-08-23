import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, User, 
  AlertCircle, Eye, EyeOff, CheckCircle, XCircle,
  RefreshCw, ArrowRight, Send, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  non_field_errors?: string;
}

const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // Resend Modal states
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendEmailError, setResendEmailError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof ValidationErrors]) {
      setErrors({ ...errors, [name]: '' });
    }
    setTouched({ ...touched, [name]: true });
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
      isValid = false;
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      toast.error('Please fix all errors before submitting');
      return;
    }

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: 'school_admin',
      });

      setRegistrationEmail(formData.email);
      setIsRegistered(true);

      toast.success(response.message || 'Registration successful! 🎉');
      toast('Please check your email to verify your account.', {
        icon: '📧',
        duration: 5000,
      });

    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed. Please try again.';
      
      if (err?.errors) {
        setErrors(err.errors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Open Resend Modal
  const openResendModal = () => {
    setResendEmail(registrationEmail || formData.email || '');
    setResendEmailError('');
    setShowResendModal(true);
  };

  // Close Resend Modal
  const closeResendModal = () => {
    setShowResendModal(false);
    setResendEmail('');
    setResendEmailError('');
  };

  // Handle Resend from Modal
  const handleResendFromModal = async () => {
    if (!resendEmail || !resendEmail.trim()) {
      setResendEmailError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) {
      setResendEmailError('Please enter a valid email address');
      return;
    }

    setResendEmailError('');
    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification/`, {
        email: resendEmail
      });

      if (response.data.status === 'success') {
        setResendSuccess(true);
        setRegistrationEmail(resendEmail);
        toast.success('Verification email sent! Please check your inbox.');
        
        setTimeout(() => {
          setResendSuccess(false);
          closeResendModal();
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to resend verification');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to resend verification. Please try again.';
      
      if (err.response?.data?.already_verified) {
        toast.success('Email already verified! Redirecting to login...');
        setTimeout(() => {
          closeResendModal();
          navigate('/login');
        }, 1500);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleProceedToLogin = () => {
    navigate('/login');
  };

  const hasError = (field: keyof ValidationErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  const getError = (field: keyof ValidationErrors): string => {
    return errors[field] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-secondary-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Create Account
            </h1>
            <p className="text-secondary-500 mt-1">
              Register to get started with your school management
            </p>
          </div>

          {/* Success Message after Registration */}
          {isRegistered && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Registration Successful!</p>
                  <p className="text-xs text-green-600 mt-1">
                    We've sent a verification link to <strong>{registrationEmail}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Please check your email and click the verification link to activate your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resend Button - Always Visible */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {isRegistered ? 'Didn\'t receive the email?' : 'Need a verification email?'}
                </span>
              </div>
              <button
                onClick={openResendModal}
                disabled={isResending}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Resend
              </button>
            </div>
            {resendSuccess && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verification email sent! Please check your inbox.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="John"
                      className={`input-field pl-10 ${
                        hasError('first_name') ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {hasError('first_name') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getError('first_name')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                      className={`input-field pl-10 ${
                        hasError('last_name') ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {hasError('last_name') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getError('last_name')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-500" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@email.com"
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
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="john_doe"
                      className={`input-field pl-10 ${
                        hasError('username') ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {hasError('username') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getError('username')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className={`input-field pl-10 pr-10 ${
                        hasError('password') ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {hasError('password') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getError('password')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className={`input-field pl-10 pr-10 ${
                        hasError('confirmPassword') ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {formData.confirmPassword && formData.password && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-red-500">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {hasError('confirmPassword') && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getError('confirmPassword')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-lg py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center text-sm text-secondary-500">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </p>

            <p className="text-center text-sm text-secondary-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* ========================================== */}
      {/* RESEND EMAIL MODAL */}
      {/* ========================================== */}
      {showResendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-secondary-900">Resend Verification Email</h3>
              </div>
              <button
                onClick={closeResendModal}
                className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                disabled={isResending}
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-secondary-500 mb-4">
              Enter your email address to receive a new verification link.
            </p>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => {
                    setResendEmail(e.target.value);
                    setResendEmailError('');
                  }}
                  placeholder="your@email.com"
                  className={`input-field pl-10 ${
                    resendEmailError ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  disabled={isResending}
                  autoFocus
                />
              </div>
              {resendEmailError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {resendEmailError}
                </p>
              )}
            </div>

            {/* Success Message */}
            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Verification email sent to <strong>{resendEmail}</strong>
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
              <button
                onClick={closeResendModal}
                className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                disabled={isResending}
              >
                Cancel
              </button>
              <button
                onClick={handleResendFromModal}
                disabled={isResending}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Verification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;