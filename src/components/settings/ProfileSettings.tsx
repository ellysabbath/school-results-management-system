import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Save, User, Mail, Phone, Lock, Camera, 
  ArrowLeft, Check, AlertCircle, Loader2,
  Calendar, Clock, Activity, Shield, Award,
  Building2, Users, BookOpen, FileText,
  ChevronDown, ChevronUp, Copy, Eye, EyeOff,
  LogIn, LogOut, Edit, Trash2, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: number;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ProfileSettings: React.FC = () => {
  const { user, updateProfile, getProfile, getActivityLogs, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
      }));
    }
  }, [user]);

  // Fetch activities when component mounts
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const response = await getActivityLogs();
      if (response.status === 'success') {
        setActivities(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      // Only show error, no demo data
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!profile.first_name.trim()) {
      newErrors.first_name = 'First name is required';
      isValid = false;
    }

    if (!profile.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
      isValid = false;
    }

    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation (only if changing password)
    if (profile.newPassword || profile.currentPassword || profile.confirmPassword) {
      if (!profile.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
        isValid = false;
      }
      if (!profile.newPassword) {
        newErrors.newPassword = 'New password is required';
        isValid = false;
      }
      if (profile.newPassword && profile.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
        isValid = false;
      }
      if (profile.newPassword !== profile.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        email: profile.email.trim(),
        phone: profile.phone?.trim() || '',
      };

      // Include password change if provided
      if (profile.newPassword) {
        updateData.current_password = profile.currentPassword;
        updateData.new_password = profile.newPassword;
        updateData.confirm_password = profile.confirmPassword;
      }

      const response = await updateProfile(updateData);
      
      if (response.status === 'success') {
        setSuccessMessage('Profile updated successfully!');
        toast.success('Profile updated successfully!');
        // Refresh user data
        await getProfile();
        // Clear password fields
        setProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        // Refresh activities
        fetchActivities();
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          const messages = error.response.data.errors[key];
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the field errors');
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    return 'U';
  };

  const getFullName = (): string => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  };

  const getRoleLabel = (role?: string): string => {
    const roleMap: Record<string, string> = {
      super_admin: 'Super Administrator',
      school_admin: 'School Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return roleMap[role || ''] || role || 'User';
  };

  const getRoleColor = (role?: string): string => {
    const colorMap: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      school_admin: 'bg-blue-100 text-blue-700',
      teacher: 'bg-green-100 text-green-700',
      student: 'bg-orange-100 text-orange-700',
      parent: 'bg-pink-100 text-pink-700',
    };
    return colorMap[role || ''] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login')) return <LogIn className="w-4 h-4 text-green-500" />;
    if (lowerAction.includes('logout')) return <LogOut className="w-4 h-4 text-red-500" />;
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (lowerAction.includes('password')) return <Lock className="w-4 h-4 text-yellow-500" />;
    if (lowerAction.includes('create') || lowerAction.includes('add')) return <Plus className="w-4 h-4 text-purple-500" />;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <Trash2 className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/settings"
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Profile Settings</h1>
          <p className="text-secondary-500">Manage your personal information and view account activity</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleChange}
                  required
                  className={`input-field ${errors.first_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  required
                  className={`input-field ${errors.last_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.last_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="input-field pl-10 bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-secondary-400 mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    required
                    className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
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
                    value={profile.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <h3 className="text-sm font-semibold text-secondary-700 mt-6 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-500" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={profile.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className={`input-field pl-10 pr-10 ${errors.currentPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.currentPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={profile.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
                    className={`input-field pl-10 pr-10 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={profile.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfile(prev => ({
                    ...prev,
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  }));
                  setErrors({});
                  setSuccessMessage('');
                }}
                className="px-6 py-2.5 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 text-center">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 text-4xl font-bold mx-auto">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mt-3">
              {getFullName()}
            </h3>
            <p className="text-sm text-secondary-500">{user?.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
            
            {user?.school_id && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-secondary-600">
                <Building2 className="w-4 h-4" />
                <span>School ID: {user.school_id}</span>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 justify-center text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Email Verified</span>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <button
              onClick={() => setShowActivities(!showActivities)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" />
                <h3 className="font-semibold text-secondary-900">Activity Logs</h3>
              </div>
              {showActivities ? (
                <ChevronUp className="w-4 h-4 text-secondary-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-secondary-400" />
              )}
            </button>

            {showActivities && (
              <div className="mt-4">
                {isLoadingActivities ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    <span className="ml-2 text-sm text-secondary-500">Loading...</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-6 text-secondary-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 bg-secondary-50 rounded-lg border border-secondary-100 hover:bg-secondary-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getActionIcon(activity.action)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 truncate">
                              {activity.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-secondary-400" />
                              <span className="text-xs text-secondary-400">
                                {formatDate(activity.created_at)}
                              </span>
                            </div>
                            {activity.ip_address && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <Shield className="w-3 h-3 text-secondary-400" />
                                <span className="text-xs text-secondary-400">
                                  IP: {activity.ip_address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Tip */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-900">Security Tip</p>
                <p className="text-xs text-primary-700">
                  Use a strong password with at least 8 characters, including numbers and special characters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;