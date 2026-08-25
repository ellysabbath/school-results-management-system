import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
  phone?: string;
  avatar?: string;
  is_email_verified?: boolean;
  is_active?: boolean;
}

export interface SchoolInfo {
  id: number;
  name: string;
  email: string;
  school_code?: string;
  admin_name?: string;
  admin_email?: string;
  plan?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  school: SchoolInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refresh: () => Promise<any>;
  getProfile: () => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  getSchoolInfo: () => Promise<SchoolInfo | null>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  confirmPasswordReset: (data: { token: string; new_password: string; confirm_password: string }) => Promise<any>;
  getActivityLogs: () => Promise<any>;
}

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh
authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        return authAxios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ============================================
// AUTH PROVIDER
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load user from localStorage on mount (only tokens, not user data)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          setAccessToken(token);
          // Fetch user profile from API
          const profileResponse = await getProfile();
          if (profileResponse.status === 'success') {
            const userData = profileResponse.data;
            setUser(userData);
            setIsAuthenticated(true);
            
            // Fetch school info
            await fetchSchoolInfo(userData);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setIsAuthenticated(false);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // ============================================
  // FETCH SCHOOL INFO
  // ============================================

  const fetchSchoolInfo = async (userData: User): Promise<SchoolInfo | null> => {
    try {
      const schoolCode = userData.school_id || userData.school_id;
      
      if (schoolCode) {
        const response = await authAxios.get('/schools/', {
          params: { school_code: schoolCode, page_size: 1 }
        });
        
        const results = response.data.results || response.data;
        if (results && results.length > 0) {
          const schoolData = results[0];
          setSchool(schoolData);
          return schoolData;
        }
      }
      
      // Try by admin email
      if (userData.email) {
        const response = await authAxios.get('/schools/', {
          params: { admin_email: userData.email, page_size: 1 }
        });
        
        const results = response.data.results || response.data;
        if (results && results.length > 0) {
          const schoolData = results[0];
          setSchool(schoolData);
          return schoolData;
        }
      }
      
      setSchool(null);
      return null;
    } catch (error) {
      console.error('Failed to fetch school info:', error);
      setSchool(null);
      return null;
    }
  };

  // ============================================
  // GET SCHOOL INFO (Public method)
  // ============================================

  const getSchoolInfo = async (): Promise<SchoolInfo | null> => {
    if (school) return school;
    if (user) {
      return await fetchSchoolInfo(user);
    }
    return null;
  };

  // ============================================
  // GET PROFILE
  // ============================================

  const getProfile = async (): Promise<any> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token');
    }
    
    const response = await authAxios.get('/accounts/profile/');
    return response.data;
  };

  // ============================================
  // LOGIN
  // ============================================

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/login/`, {
        username,
        password
      });

      if (response.data.status === 'success') {
        const userData = response.data.data?.user;
        const tokens = response.data.data?.tokens;

        if (userData && tokens) {
          // Store ONLY tokens in localStorage
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          
          setAccessToken(tokens.access);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Fetch school info
          await fetchSchoolInfo(userData);
        }

        return response.data;
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // REGISTER
  // ============================================

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/register/`, userData);

      if (response.data.status === 'success') {
        const userData = response.data.data?.user;
        const tokens = response.data.data?.tokens;

        if (userData && tokens) {
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
          
          setAccessToken(tokens.access);
          setUser(userData);
          setIsAuthenticated(true);
          
          await fetchSchoolInfo(userData);
        }

        return response.data;
      }

      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');
      
      if (refreshToken && accessToken) {
        try {
          await axios.post(
            `${API_BASE_URL}/accounts/logout/`,
            { refresh: refreshToken },
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              }
            }
          );
        } catch (error: any) {
          console.warn('Server logout failed:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens only, not user data (will be cleared on next load)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      setUser(null);
      setSchool(null);
      setIsAuthenticated(false);
      setAccessToken(null);
      setIsLoading(false);
      toast.success('Logged out successfully');
    }
  };

  // ============================================
  // REFRESH TOKEN
  // ============================================

  const refresh = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
        refresh: refreshToken
      });

      if (response.data.status === 'success') {
        const newAccess = response.data.data?.access;
        if (newAccess) {
          localStorage.setItem('access_token', newAccess);
          setAccessToken(newAccess);
        }
        return response.data;
      }

      throw new Error('Refresh failed');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // UPDATE PROFILE
  // ============================================

  const updateProfile = async (data: any) => {
    try {
      const response = await authAxios.put('/accounts/profile/', data);

      if (response.data.status === 'success') {
        const userData = response.data.data;
        setUser(userData);
        toast.success('Profile updated successfully!');
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to update profile');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // VERIFY EMAIL
  // ============================================

  const verifyEmail = async (token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
        params: { token }
      });

      if (response.data.status === 'success') {
        // Refresh user data
        if (user) {
          const profileResponse = await getProfile();
          if (profileResponse.status === 'success') {
            setUser(profileResponse.data);
          }
        }
        toast.success('Email verified successfully!');
        return response.data;
      }

      throw new Error(response.data.message || 'Verification failed');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // RESEND VERIFICATION
  // ============================================

  const resendVerification = async (email: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification/`, {
        email
      });

      if (response.data.status === 'success') {
        toast.success('Verification email sent!');
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to resend verification');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // PASSWORD RESET REQUEST
  // ============================================

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/request/`, {
        email
      });

      if (response.data.status === 'success') {
        toast.success('Password reset link sent to your email!');
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to send reset link');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // CONFIRM PASSWORD RESET
  // ============================================

  const confirmPasswordReset = async (data: { token: string; new_password: string; confirm_password: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/confirm/`, data);

      if (response.data.status === 'success') {
        toast.success('Password reset successfully!');
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to reset password');
    } catch (error) {
      throw error;
    }
  };

  // ============================================
  // GET ACTIVITY LOGS - FIXED
  // ============================================

  const getActivityLogs = async () => {
    try {
      const response = await authAxios.get('/accounts/activity-logs/');
      console.log('[AuthContext] Activity logs response:', response);
      
      // The Django view returns a raw array directly
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        console.log('[AuthContext] Response is array, length:', response.data.length);
        return response.data; // Return the array directly
      }
      
      // If response.data has a status field, handle it
      if (response.data && response.data.status === 'success') {
        // If it's a wrapped response with data
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data.results)) {
          return response.data.results;
        }
        // If it's a wrapped response but data is not array, return empty array
        console.warn('[AuthContext] Success response but no array found');
        return [];
      }
      
      // If response.data has results field
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      // If response.data has data field
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // If none of the above, return empty array
      console.warn('[AuthContext] Unexpected response format:', response.data);
      return [];
      
    } catch (error) {
      console.error('[AuthContext] Failed to get activity logs:', error);
      throw error;
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextType = {
    user,
    school,
    isLoading,
    isAuthenticated,
    accessToken,
    login,
    register,
    logout,
    refresh,
    getProfile,
    updateProfile,
    getSchoolInfo,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    confirmPasswordReset,
    getActivityLogs,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;