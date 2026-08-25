import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Calendar, 
  Loader2, AlertCircle, BookOpen, Hash, School,
  Users
} from 'lucide-react';
import { studentService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Student {
  id?: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  student_class: string;
  section: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  enrollment_date: string;
  is_active?: boolean;
  school?: number;
  school_code?: string;
  school_name?: string;
}

interface SchoolData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  status: string;
  admin_name: string;
  admin_email: string;
  school_code?: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student?: Student | null;
  mode: 'add' | 'edit';
  schoolId?: number;
}

const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
  mode,
  schoolId
}) => {
  const { user, school } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // School state
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);

  const [formData, setFormData] = useState<Student>({
    admission_number: '',
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    gender: 'male',
    student_class: '',
    section: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    enrollment_date: '',
    is_active: true,
    school: schoolId || 1,
  });

  // Get school code from user or context
  const userSchoolCode = school?.school_code || user?.school_id || undefined;

  // Load school function
  const loadSchool = async (schoolIdToLoad?: number, schoolCodeToLoad?: string) => {
    setIsLoadingSchool(true);
    try {
      let schoolData = null;

      // First try: Use schoolId from props or student
      const targetSchoolId = schoolIdToLoad || schoolId || student?.school;
      
      if (targetSchoolId) {
        try {
          const response = await schoolService.getSchool(targetSchoolId);
          if (response && (response.status === 'success' || response.id)) {
            schoolData = response.data || response;
          }
        } catch (err) {
          console.log('Could not load school by ID:', err);
        }
      }

      // Second try: Use school_code from student or user
      if (!schoolData) {
        const targetSchoolCode = schoolCodeToLoad || student?.school_code || userSchoolCode;
        
        if (targetSchoolCode) {
          try {
            const response = await schoolService.getSchools({ 
              school_code: targetSchoolCode,
              page_size: 1
            });
            const results = response.results || response;
            if (results && results.length > 0) {
              schoolData = results[0];
            }
          } catch (err) {
            console.log('Could not load school by code:', err);
          }
        }
      }

      // Third try: Use school from context
      if (!schoolData && school?.id) {
        try {
          const response = await schoolService.getSchool(school.id);
          if (response && (response.status === 'success' || response.id)) {
            schoolData = response.data || response;
          }
        } catch (err) {
          console.log('Could not load school from context:', err);
        }
      }

      if (schoolData) {
        setSelectedSchool(schoolData);
        setFormData(prev => ({ ...prev, school: schoolData.id }));
        console.log('[StudentModal] School loaded:', schoolData);
      } else {
        console.warn('[StudentModal] No school found');
        // Don't show error for edit mode if student has school
        if (mode === 'add') {
          toast.error('No school found. Please contact administrator.');
        }
      }
    } catch (error) {
      console.error('[StudentModal] Failed to load school:', error);
      if (mode === 'add') {
        toast.error('Failed to load school information');
      }
    } finally {
      setIsLoadingSchool(false);
    }
  };

  // Load school on modal open
  useEffect(() => {
    if (isOpen) {
      // For edit mode, try to load school from student data first
      if (mode === 'edit' && student) {
        loadSchool(student.school, student.school_code);
      } else {
        loadSchool(schoolId, userSchoolCode);
      }
    }
  }, [isOpen, mode, student]);

  // Set form data when student changes
  useEffect(() => {
    if (student && mode === 'edit') {
      setFormData({
        id: student.id,
        admission_number: student.admission_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || 'male',
        student_class: student.student_class || '',
        section: student.section || '',
        guardian_name: student.guardian_name || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        enrollment_date: student.enrollment_date || '',
        is_active: student.is_active !== undefined ? student.is_active : true,
        school: student.school || schoolId || 1,
      });
    } else if (mode === 'add') {
      setFormData({
        admission_number: '',
        first_name: '',
        last_name: '',
        email: '',
        date_of_birth: '',
        gender: 'male',
        student_class: '',
        section: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        enrollment_date: '',
        is_active: true,
        school: schoolId || 1,
      });
    }
    setErrors({});
  }, [student, mode, schoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
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

    if (!formData.student_class.trim()) {
      newErrors.student_class = 'Class is required';
      isValid = false;
    }

    if (!formData.guardian_name.trim()) {
      newErrors.guardian_name = 'Guardian name is required';
      isValid = false;
    }

    if (!formData.guardian_phone.trim()) {
      newErrors.guardian_phone = 'Guardian phone is required';
      isValid = false;
    }

    if (!formData.school) {
      newErrors.school = 'School is required';
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
      const apiData = {
        admission_number: formData.admission_number?.trim() || null,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        student_class: formData.student_class.trim(),
        section: formData.section?.trim() || '',
        guardian_name: formData.guardian_name.trim(),
        guardian_phone: formData.guardian_phone.trim(),
        guardian_email: formData.guardian_email?.trim() || '',
        enrollment_date: formData.enrollment_date || null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        school: formData.school,
      };

      if (mode === 'edit' && student?.id) {
        await studentService.updateStudent(student.id, apiData);
        toast.success('Student updated successfully!');
      } else {
        await studentService.createStudent(apiData);
        toast.success('Student added successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Student submission error:', error);
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(error.response.data.errors).forEach(key => {
            const messages = error.response.data.errors[key];
            fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
          });
          setErrors(fieldErrors);
          toast.error('Please fix the field errors');
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Operation failed. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
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
              {mode === 'add' ? 'Add New Student' : 'Edit Student'}
            </h2>
            <p className="text-sm text-secondary-500">
              {mode === 'add' ? 'Enter student details to add to the system' : 'Update student information'}
            </p>
            {selectedSchool?.school_code && (
              <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                <School className="w-3 h-3" />
                School: {selectedSchool.name} ({selectedSchool.school_code})
              </p>
            )}
            {student?.school_code && !selectedSchool && (
              <p className="text-xs text-secondary-500 mt-1 flex items-center gap-1">
                <School className="w-3 h-3" />
                School Code: {student.school_code}
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
          {/* ==========================================
              SCHOOL SELECTION - AUTO-LOADED
              ========================================== */}
          <div className="border-b border-secondary-200 pb-4">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
              <School className="w-4 h-4 text-primary-500" />
              School Assignment
            </h3>
            
            {isLoadingSchool ? (
              <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="text-sm text-secondary-600">Loading school...</span>
              </div>
            ) : selectedSchool ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <School className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">{selectedSchool.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-secondary-500">{selectedSchool.email}</span>
                      {selectedSchool.school_code && (
                        <span className="text-xs font-mono bg-green-100 px-1.5 py-0.5 rounded text-green-700">
                          {selectedSchool.school_code}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedSchool.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedSchool.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : student?.school_code ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <School className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700">School Code: {student.school_code}</p>
                    <p className="text-xs text-blue-600">School information will be loaded when you save</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-700">No school found</p>
                    <p className="text-xs text-yellow-600">Please contact your administrator</p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.school && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.school}
              </p>
            )}
          </div>

          {/* ==========================================
              STUDENT INFORMATION
              ========================================== */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Admission Number - Optional */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Admission Number <span className="text-secondary-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="admission_number"
                    value={formData.admission_number}
                    onChange={handleChange}
                    placeholder="AY8NH-0001"
                    className={`input-field pl-10 bg-gray-50 cursor-not-allowed ${errors.admission_number ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={true}
                  />
                </div>
                {errors.admission_number && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.admission_number}
                  </p>
                )}
                <p className="text-xs text-secondary-400 mt-1">Leave blank to auto-generate</p>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="student_class"
                    value={formData.student_class}
                    onChange={handleChange}
                    placeholder="Form Three"
                    className={`input-field pl-10 ${errors.student_class ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.student_class && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.student_class}
                  </p>
                )}
              </div>

              {/* First Name */}
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
                    className={`input-field pl-10 ${errors.first_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.first_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name */}
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
                    className={`input-field pl-10 ${errors.last_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.last_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.last_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@email.com"
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

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                  disabled={isLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="input-field pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="A, B, C"
                  className="input-field"
                  disabled={isLoading}
                />
              </div>

              {/* Enrollment Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Enrollment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="date"
                    name="enrollment_date"
                    value={formData.enrollment_date}
                    onChange={handleChange}
                    className="input-field pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  name="is_active"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="input-field"
                  disabled={isLoading}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* ==========================================
              GUARDIAN INFORMATION
              ========================================== */}
          <div className="border-t border-secondary-200 pt-4">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Guardian Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guardian Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Guardian Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="guardian_name"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    placeholder="Mr. John Doe"
                    className={`input-field pl-10 ${errors.guardian_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.guardian_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.guardian_name}
                  </p>
                )}
              </div>

              {/* Guardian Phone */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Guardian Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="tel"
                    name="guardian_phone"
                    value={formData.guardian_phone}
                    onChange={handleChange}
                    placeholder="+255-XXX-XXX-XXX"
                    className={`input-field pl-10 ${errors.guardian_phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.guardian_phone && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.guardian_phone}
                  </p>
                )}
              </div>

              {/* Guardian Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Guardian Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="guardian_email"
                    value={formData.guardian_email}
                    onChange={handleChange}
                    placeholder="guardian@email.com"
                    className="input-field pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              ACTIONS
              ========================================== */}
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
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Add Student' : 'Update Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;