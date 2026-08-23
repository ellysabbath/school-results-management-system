import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Building2, ArrowRight } from 'lucide-react';
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

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
          params: { token }
        });

        if (response.data.status === 'success') {
          setStatus('success');
          
          // Get email from response if available
          if (response.data.data?.email) {
            setUserEmail(response.data.data.email);
          }
          
          setMessage('Email verified successfully! You can now register your school.');
          toast.success('Email verified successfully!');
          
          // Redirect to school registration after 2 seconds
          setTimeout(() => {
            // Pass email to registration page
            navigate('/register-school', { state: { email: userEmail || response.data.data?.email } });
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed');
          toast.error(response.data.message || 'Verification failed');
        }
      } catch (err: any) {
        setStatus('error');
        const errorMsg = err.response?.data?.message || 'Verification failed. Please try again.';
        setMessage(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

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
      } else {
        toast.error(response.data.message || 'Failed to resend verification');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend verification');
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register-school', { state: { email: userEmail } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl border border-secondary-200 p-8 text-center">
          <div className="mb-6">
            {status === 'verifying' && (
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
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

          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified! 🎉'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          
          <p className="text-secondary-600 mb-6">{message}</p>

          {status === 'success' && (
            <div className="space-y-4">
              {userEmail && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    {userEmail} is now verified
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-primary-700 font-medium">
                  🏫 Ready to register your school?
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Click the button below to complete your school registration.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={goToRegister}
                  className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Register School Now
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <Link
                  to="/login"
                  className="inline-block text-sm text-secondary-500 hover:text-secondary-700"
                >
                  Or go to Login
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={resendVerification}
                disabled={isLoading}
                className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="inline-block text-sm text-primary-600 hover:text-primary-700"
              >
                Back to Login
              </Link>
            </div>
          )}

          {status === 'verifying' && (
            <p className="text-sm text-secondary-400 mt-4">
              Please wait while we verify your email...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;