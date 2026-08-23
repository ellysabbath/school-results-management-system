import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building2, Award, Calendar, Loader2, AlertCircle, BookOpen, Hash, Search, School, Shield, CheckCircle } from 'lucide-react';
import { teacherService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface Teacher {
  id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  designation: string;
  qualification: string;
  joining_date: string;
  phone: string;
  subjects: string[];
  is_active?: boolean;
  school?: number;
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
}

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher?: Teacher | null;
  mode: 'add' | 'edit';
  schoolId?: number;
}

const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teacher,
  mode,
  schoolId
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Teacher>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    designation: '',
    qualification: '',
    joining_date: '',
    phone: '',
    subjects: [],
    is_active: true,
    school: schoolId || 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subjectInput, setSubjectInput] = useState('');
  
  // School search states
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [showSchoolSearch, setShowSchoolSearch] = useState(false);
  const [schoolSearchResults, setSchoolSearchResults] = useState<SchoolData[]>([]);
  
  // Matched school state
  const [matchedSchool, setMatchedSchool] = useState<SchoolData | null>(null);
  const [isMatchingSchool, setIsMatchingSchool] = useState(false);

  // Get user role and email
  const userRole = user?.role || '';
  const userEmail = user?.email || '';

  // Auto-match school based on user email on modal open
  useEffect(() => {
    if (isOpen) {
      matchSchoolByEmail();
    }
  }, [isOpen, userEmail]);

  useEffect(() => {
    if (teacher && mode === 'edit') {
      setFormData({
        id: teacher.id,
        employee_id: teacher.employee_id || '',
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        department: teacher.department || '',
        designation: teacher.designation || '',
        qualification: teacher.qualification || '',
        joining_date: teacher.joining_date || '',
        phone: teacher.phone || '',
        subjects: teacher.subjects || [],
        is_active: teacher.is_active !== undefined ? teacher.is_active : true,
        school: teacher.school || schoolId || 1,
      });
    } else {
      setFormData({
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        designation: '',
        qualification: '',
        joining_date: '',
        phone: '',
        subjects: [],
        is_active: true,
        school: schoolId || 1,
      });
    }
    setErrors({});
    setSubjectInput('');
  }, [teacher, mode, isOpen, schoolId]);

  // Load school details when modal opens
  useEffect(() => {
    if (isOpen && formData.school) {
      loadSchoolDetails(formData.school);
    }
  }, [isOpen, formData.school]);

  // Match school by admin email
  const matchSchoolByEmail = async () => {
    if (!userEmail || userRole !== 'school_admin') {
      // For Super Admin, don't auto-match
      if (userRole === 'super_admin') {
        setMatchedSchool(null);
      }
      return;
    }

    setIsMatchingSchool(true);
    try {
      // Search for schools where admin_email matches user email
      const response = await schoolService.getSchools({ 
        admin_email: userEmail,
        page_size: 100
      });
      
      const schools = response.results || response;
      
      if (schools && schools.length > 0) {
        // Found a matching school
        const school = schools[0];
        setMatchedSchool(school);
        setSelectedSchool(school);
        setFormData(prev => ({ 
          ...prev, 
          school: school.id 
        }));
        setSchoolSearchQuery(school.name);
        console.log('School matched by admin email:', school.name);
      } else {
        // No matching school found
        setMatchedSchool(null);
        console.log('No school found matching admin email:', userEmail);
      }
    } catch (error) {
      console.error('Failed to match school by email:', error);
      setMatchedSchool(null);
    } finally {
      setIsMatchingSchool(false);
    }
  };

  const loadSchoolDetails = async (id: number) => {
    if (!id) return;
    try {
      const response = await schoolService.getSchool(id);
      if (response.status === 'success' || response.data) {
        const schoolData = response.data || response;
        setSelectedSchool(schoolData);
        setSchoolSearchQuery(schoolData.name);
      }
    } catch (error) {
      console.error('Failed to load school details:', error);
    }
  };

  // Search schools for Super Admin
  const searchSchools = async () => {
    if (!schoolSearchQuery.trim()) {
      setSchoolSearchResults([]);
      return;
    }

    setIsSearchingSchools(true);
    try {
      const response = await schoolService.getSchools({ 
        search: schoolSearchQuery 
      });
      
      const results = response.results || response;
      setSchoolSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No schools found matching your search');
      }
    } catch (error) {
      console.error('Failed to search schools:', error);
      toast.error('Failed to search schools');
    } finally {
      setIsSearchingSchools(false);
    }
  };

  const selectSchool = (school: SchoolData) => {
    setSelectedSchool(school);
    setFormData(prev => ({ ...prev, school: school.id }));
    setSchoolSearchQuery(school.name);
    setShowSchoolSearch(false);
    setSchoolSearchResults([]);
    toast.success(`School selected: ${school.name}`);
  };

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

  const addSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subjectInput.trim()]
      }));
      setSubjectInput('');
    }
  };

  const removeSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
      isValid = false;
    }

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

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
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
        employee_id: formData.employee_id.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        designation: formData.designation?.trim() || '',
        qualification: formData.qualification?.trim() || '',
        joining_date: formData.joining_date || null,
        phone: formData.phone?.trim() || '',
        subjects: formData.subjects || [],
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        school: formData.school,
      };

      let response;
      if (mode === 'edit' && teacher?.id) {
        response = await teacherService.updateTeacher(teacher.id, apiData);
        toast.success('Teacher updated successfully!');
      } else {
        response = await teacherService.createTeacher(apiData);
        toast.success('Teacher added successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Teacher submission error:', error);
      
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error status:', error.response.status);
      }
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          toast.error(error.response.data);
        } else if (error.response.data.errors) {
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
              {mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
            </h2>
            <p className="text-sm text-secondary-500">
              {mode === 'add' ? 'Enter teacher details to add to the system' : 'Update teacher information'}
            </p>
            {userRole === 'school_admin' && matchedSchool && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                School matched: {matchedSchool.name}
              </p>
            )}
            {userRole === 'super_admin' && (
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Super Admin - Select a school
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee ID */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  placeholder="EMP-001"
                  className={`input-field pl-10 ${errors.employee_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.employee_id && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.employee_id}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Mathematics"
                  className={`input-field pl-10 ${errors.department ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.department && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.department}
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
                  placeholder="john.doe@school.edu"
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

            {/* Phone */}
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

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Designation
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Senior Teacher"
                  className="input-field pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Qualification
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="M.Sc. Mathematics"
                  className="input-field pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Joining Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
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

            {/* School Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                School <span className="text-red-500">*</span>
              </label>
              
              {/* For Super Admin - Searchable school selection */}
              {userRole === 'super_admin' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      value={schoolSearchQuery}
                      onChange={(e) => {
                        setSchoolSearchQuery(e.target.value);
                        setShowSchoolSearch(true);
                      }}
                      onFocus={() => setShowSchoolSearch(true)}
                      placeholder="Search schools by name, email..."
                      className="input-field pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={searchSchools}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700"
                      disabled={isSearchingSchools}
                    >
                      {isSearchingSchools ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {showSchoolSearch && schoolSearchResults.length > 0 && (
                    <div className="border border-secondary-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg">
                      {schoolSearchResults.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => selectSchool(school)}
                          className="w-full text-left px-4 py-2 hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-0"
                        >
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-secondary-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-secondary-900">{school.name}</p>
                              <p className="text-xs text-secondary-500">{school.email}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  school.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {school.status}
                                </span>
                                <span className="text-xs text-secondary-400">Plan: {school.plan}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSchool && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-secondary-900">{selectedSchool.name}</p>
                            <p className="text-xs text-secondary-500">{selectedSchool.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                selectedSchool.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {selectedSchool.status}
                              </span>
                              <span className="text-xs text-secondary-400">Plan: {selectedSchool.plan}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSchool(null);
                            setSchoolSearchQuery('');
                            setFormData(prev => ({ ...prev, school: undefined }));
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Change
                        </button>
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
              ) : (
                // For School Admin - Show matched school or read-only
                <div className="space-y-2">
                  {isMatchingSchool ? (
                    <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                      <span className="text-sm text-secondary-600">Matching your school...</span>
                    </div>
                  ) : matchedSchool ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900">{matchedSchool.name}</p>
                          <p className="text-xs text-secondary-500">{matchedSchool.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              matchedSchool.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {matchedSchool.status}
                            </span>
                            <span className="text-xs text-secondary-400">Plan: {matchedSchool.plan}</span>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Matched by email
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm text-yellow-700">No school found matching your email</p>
                          <p className="text-xs text-yellow-600">Please contact your administrator</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subjects */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Subjects
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="Add subject (e.g., Mathematics)"
                    className="input-field pl-10"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubject();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                  disabled={isLoading}
                >
                  Add Subject
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    <BookOpen className="w-3 h-3" />
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeSubject(subject)}
                      className="text-blue-400 hover:text-blue-600"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.subjects.length === 0 && (
                  <span className="text-xs text-secondary-400">No subjects added yet</span>
                )}
              </div>
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
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                mode === 'add' ? 'Add Teacher' : 'Update Teacher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherModal;