// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  X,
  Send,
  Loader2,
  Shield,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Tafadhali weka barua pepe');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Tafadhali weka barua pepe sahihi');
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email);
      
      if (response.status === 'success') {
        setSuccess(true);
        localStorage.setItem('resetEmail', email);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 
                     err.response?.data?.errors?.email?.[0] ||
                     'Imeshindwa kutuma kiungo cha kubadilisha nenosiri. Tafadhali jaribu tena.';
      setError(message);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Sahau Nenosiri</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tuma kiungo cha kubadilisha nenosiri kwenye barua pepe yako
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">
              Kiungo cha kubadilisha nenosiri kimetumwa! Angalia barua pepe yako.
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
          onClick={() => navigate('/login')}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Rudi kwenye Ingizo
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barua Pepe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="mfano@shule.com"
                required
                disabled={isLoading || success}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Tutatuma kiungo cha kubadilisha nenosiri kwenye barua pepe hii
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Inatuma...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Tuma Kiungo
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nakumbuka nenosiri?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Ingia
            </Link>
          </p>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            Kiungo kitakua halali kwa muda wa saa 24
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;