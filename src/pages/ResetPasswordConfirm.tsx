// src/pages/ResetPasswordConfirm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Key,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResetPasswordConfirm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    
    if (!token) {
      setError('Kiungo cha kubadilisha nenosiri ni batili. Tafadhali omba kiungo kipya.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('Kiungo cha kubadilisha nenosiri ni batili');
      return;
    }

    if (!formData.new_password || formData.new_password.length < 6) {
      setError('Nenosiri lazima iwe na herufi 6 au zaidi');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Nenosiri mpya na uthibitisho hazifanani');
      return;
    }

    setIsLoading(true);

    try {
      const response = await confirmPasswordReset({
        token: token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      if (response.status === 'success') {
        setSuccess(true);
        localStorage.removeItem('resetEmail');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 
                     err.response?.data?.errors?.token?.[0] ||
                     err.response?.data?.errors?.new_password?.[0] ||
                     'Imeshindwa kubadilisha nenosiri. Tafadhali jaribu tena.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    // Reset success to false when user starts typing again
    if (success) {
      setSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-full shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Badilisha Nenosiri</h1>
          <p className="text-gray-500 text-sm mt-1">
            Weka nenosiri lako jipya
          </p>
          {email && (
            <p className="text-xs text-gray-400 mt-1">
              Kwa: <span className="font-medium text-gray-600">{email}</span>
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">
              Nenosiri limebadilishwa kikamilifu! Inaelekeza kwenye ingizo...
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/forgot-password')}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Rudi
        </button>

        {!token && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 text-center">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Hakuna kiungo cha kubadilisha nenosiri. 
              <Link to="/forgot-password" className="text-blue-600 hover:underline ml-1">
                Omba kiungo kipya
              </Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nenosiri Mpya <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Herufi 6 au zaidi"
                required
                minLength={6}
                disabled={isLoading || success || !token}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thibitisha Nenosiri Mpya <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Weka nenosiri mpya tena"
                required
                disabled={isLoading || success || !token}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || success || !token}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Inabadilisha...
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                Badilisha Nenosiri
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nakumbuka nenosiri?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Ingia
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            Hakikisha nenosiri lako ni salama
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;