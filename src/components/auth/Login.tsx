import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Lock, AlertCircle, Eye, EyeOff, 
   User, Loader2, Mail 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequiresVerification(false);

    if (!username.trim()) {
      setError('Please enter your username or email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      const response = await login(username, password);
      
      if (response.status === 'success') {
        toast.success('Welcome back! 🎉');
        navigate('/settings/profile');
      }

    } catch (err: any) {
      const data = err.response?.data;
      
      if (data?.requires_verification) {
        setRequiresVerification(true);
        setVerificationEmail(data?.email || username);
        setError(data?.message || 'Please verify your email before logging in.');
        toast.error('Please verify your email first');
        return;
      }

      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.errors) {
        const errors = data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast.error('Email address not found');
      return;
    }

    try {
      const { resendVerification } = useAuth();
      await resendVerification(verificationEmail);
      setError('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          
            <p className="text-gray-500 mt-1 text-sm">Sign in to your school dashboard</p>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
              requiresVerification 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              {requiresVerification && (
                <button 
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium text-xs whitespace-nowrap disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Resend'}
                </button>
              )}
              {!requiresVerification && (
                <button 
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {requiresVerification && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                We sent a verification link to <strong>{verificationEmail}</strong>
              </p>
              <p className="text-xs text-blue-600 text-center mt-1">
                Please check your email and click the verification link to activate your account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                    setRequiresVerification(false);
                  }}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Start Free Trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;