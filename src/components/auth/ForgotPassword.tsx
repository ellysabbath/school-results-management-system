import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://resultmanagement.pythonanywhere.com/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/request/`, { email });
      
      if (response.data.status === 'success') {
        setSuccess(true);
        toast.success('Password reset link sent to your email!');
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-secondary-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">School</h1>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Manager</span>
            </div>
            <p className="text-secondary-500 mt-1 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                <p>Password reset link sent!</p>
                <p className="text-xs text-green-600 mt-1">
                  Please check your email inbox. You'll be redirected to login in a few seconds.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            className="mb-4 text-secondary-600 hover:text-secondary-800 flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@school.edu"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-500">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;