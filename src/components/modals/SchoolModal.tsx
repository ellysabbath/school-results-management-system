import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface School {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  status: string;
  // admin_name and admin_email are auto-loaded from user - NOT in form
}

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  school?: School | null;
  mode: 'add' | 'edit';
}

const SchoolModal: React.FC<SchoolModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  school,
  mode
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<School>({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'trial',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Admin info from user (auto-loaded)
  const adminName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.username || '';
  const adminEmail = user?.email || '';

  useEffect(() => {
    if (school && mode === 'edit') {
      setFormData({
        id: school.id,
        name: school.name || '',
        email: school.email || '',
        phone: school.phone || '',
        address: school.address || '',
        plan: school.plan || 'trial',
        status: school.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        plan: 'trial',
        status: 'active',
      });
    }
    setErrors({});
  }, [school, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
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

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // admin_name and admin_email are auto-loaded from user on backend
      const apiData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        plan: formData.plan,
        status: formData.status,
      };

      if (mode === 'edit' && school?.id) {
        await schoolService.updateSchool(school.id, apiData);
        toast.success('School updated successfully!');
      } else {
        await schoolService.createSchool(apiData);
        toast.success('School created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('School submission error:', error);
      
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          const messages = error.response.data.errors[key];
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(fieldErrors);
        toast.error('Please fix the field errors');
      } else {
        toast.error(error.response?.data?.message || 'Operation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">
              {mode === 'add' ? 'Add New School' : 'Edit School'}
            </h2>
            <p className="text-sm text-secondary-500">
              {mode === 'add' ? 'Enter school details' : 'Update school information'}
            </p>
            {mode === 'add' && (
              <p className="text-xs text-green-600 mt-1">
                Admin will be auto-assigned: <strong>{adminName}</strong> ({adminEmail})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-secondary-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Admin Info - Readonly display */}
          {mode === 'add' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800">Admin Auto-Assignment</h4>
              <div className="mt-1 text-sm text-green-700">
                <p><strong>Name:</strong> {adminName}</p>
                <p><strong>Email:</strong> {adminEmail}</p>
              </div>
              <p className="text-xs text-green-600 mt-1">
                This admin will be automatically assigned as the school administrator.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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
                  className={`input-field pl-10 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
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
                Phone
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

            <div className="md:col-span-2">
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
                  className="input-field pl-10 min-h-[80px] resize-y"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="input-field"
                disabled={isLoading}
              >
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input-field"
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'add' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Add School' : 'Update School'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolModal;