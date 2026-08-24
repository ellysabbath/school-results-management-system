import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, BookOpen, User, School, Hash, AlertCircle, 
  Loader2, Save, CheckCircle, XCircle, Plus, 
  Search, GraduationCap, FileText, Edit, ChevronDown
} from 'lucide-react';
import { subjectService, teacherService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

interface Subject {
  id?: number;
  code: string;
  name: string;
  description: string;
  max_marks: number;
  passing_marks: number;
  student_class: string;
  is_active: boolean;
  school: number;
  teacher: number | null;
  teacher_name?: string;
  school_code?: string;
  school_name?: string;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  department: string;
  school: number;
}

interface SchoolData {
  id: number;
  name: string;
  email: string;
  phone: string;
  school_code?: string;
  status: string;
}

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subject?: Subject | null;
  mode: 'add' | 'edit';
  schoolId?: number;
  schoolCode?: string;
}

// ============================================
// TANZANIA CLASSES LIST
// ============================================

const TANZANIA_CLASSES = {
  primary: [
    { value: 'Standard 1', label: 'Standard 1' },
    { value: 'Standard 2', label: 'Standard 2' },
    { value: 'Standard 3', label: 'Standard 3' },
    { value: 'Standard 4', label: 'Standard 4' },
    { value: 'Standard 5', label: 'Standard 5' },
    { value: 'Standard 6', label: 'Standard 6' },
    { value: 'Standard 7', label: 'Standard 7' },
  ],
  secondary: [
    { value: 'Form 1', label: 'Form 1' },
    { value: 'Form 2', label: 'Form 2' },
    { value: 'Form 3', label: 'Form 3' },
    { value: 'Form 4', label: 'Form 4' },
    { value: 'Form 5', label: 'Form 5' },
    { value: 'Form 6', label: 'Form 6' },
  ]
};

const ALL_TANZANIA_CLASSES = [
  ...TANZANIA_CLASSES.primary,
  ...TANZANIA_CLASSES.secondary
];

// ============================================
// TANZANIA SUBJECTS LIST
// ============================================

const TANZANIA_SUBJECTS = {
  primary: [
    'Mathematics',
    'English Language',
    'Kiswahili',
    'Science and Technology',
    'Social Studies',
    'Civics and Moral Education',
    'Physical Education and Sports',
    'Art and Craft',
    'Music',
    'Agriculture',
    'Home Economics',
    'Religious Education'
  ],
  secondary: [
    'Mathematics',
    'English Language',
    'Kiswahili',
    'Biology',
    'Chemistry',
    'Physics',
    'Geography',
    'History',
    'Civics',
    'Additional Mathematics',
    'Computer Science',
    'Information and Communication Technology',
    'Agriculture',
    'Nutrition',
    'Commerce',
    'Bookkeeping',
    'Economics',
    'Entrepreneurship',
    'French',
    'Arabic',
    'Chinese',
    'German',
    'Latin',
    'Fine Art',
    'Music',
    'Theatre Arts',
    'Physical Education',
    'Woodwork',
    'Metalwork',
    'Building Construction',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Cooking and Food Processing',
    'Tailoring and Fashion Design',
    'Secretarial Studies'
  ]
};

const ALL_TANZANIA_SUBJECTS = [
  ...TANZANIA_SUBJECTS.primary,
  ...TANZANIA_SUBJECTS.secondary
].sort();

// ============================================
// MAIN COMPONENT
// ============================================

const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subject,
  mode,
  schoolId,
  schoolCode
}) => {
  const { user, school } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // School state
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  
  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Subject selection state
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<string[]>(ALL_TANZANIA_SUBJECTS);
  
  // Class selection state
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [filteredClasses, setFilteredClasses] = useState<{value: string; label: string}[]>(ALL_TANZANIA_CLASSES);
  
  // Form state
  const [formData, setFormData] = useState<Subject>({
    code: '',
    name: '',
    description: '',
    max_marks: 100,
    passing_marks: 40,
    student_class: '',
    is_active: true,
    school: 0,
    teacher: null,
  });

  // Get school code from props or context
  const userSchoolCode = schoolCode || school?.school_code || user?.school_id || null;
  const userSchoolId = schoolId || school?.id || (user?.school_id ? parseInt(user.school_id) : null);

  // ============================================
  // LOAD SCHOOL
  // ============================================

  const loadSchool = useCallback(async () => {
    setIsLoadingSchool(true);
    try {
      let schoolData = null;

      if (userSchoolId) {
        try {
          const response = await schoolService.getSchool(userSchoolId);
          if (response && (response.status === 'success' || response.id)) {
            schoolData = response.data || response;
          }
        } catch (err) {
          console.log('Could not load school by ID:', err);
        }
      }

      if (!schoolData && userSchoolCode) {
        try {
          const response = await schoolService.getSchools({ 
            school_code: userSchoolCode,
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

      if (!schoolData && subject?.school) {
        try {
          const response = await schoolService.getSchool(subject.school);
          if (response && (response.status === 'success' || response.id)) {
            schoolData = response.data || response;
          }
        } catch (err) {
          console.log('Could not load school from subject:', err);
        }
      }

      if (schoolData) {
        setSelectedSchool(schoolData);
        setFormData(prev => ({ ...prev, school: schoolData.id }));
        await loadTeachers(schoolData.id);
      } else {
        if (mode === 'add') {
          toast.error('No school found. Please contact administrator.');
        }
      }
    } catch (error) {
      console.error('[SubjectModal] Failed to load school:', error);
      if (mode === 'add') {
        toast.error('Failed to load school information');
      }
    } finally {
      setIsLoadingSchool(false);
    }
  }, [userSchoolId, userSchoolCode, subject, mode]);

  // ============================================
  // LOAD TEACHERS
  // ============================================

  const loadTeachers = useCallback(async (schoolId: number) => {
    setIsLoadingTeachers(true);
    try {
      const response = await teacherService.getTeachers({
        school: schoolId,
        page_size: 100,
        is_active: true
      });
      
      let teacherData: Teacher[] = [];
      if (response.results) {
        teacherData = response.results;
      } else if (Array.isArray(response)) {
        teacherData = response;
      }
      
      setTeachers(teacherData);
    } catch (error) {
      console.error('[SubjectModal] Failed to load teachers:', error);
    } finally {
      setIsLoadingTeachers(false);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (isOpen) {
      loadSchool();
    }
  }, [isOpen, loadSchool]);

  // Filter subjects based on search term
  useEffect(() => {
    if (subjectSearchTerm) {
      const filtered = ALL_TANZANIA_SUBJECTS.filter(sub => 
        sub.toLowerCase().includes(subjectSearchTerm.toLowerCase())
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(ALL_TANZANIA_SUBJECTS);
    }
  }, [subjectSearchTerm]);

  // Filter classes based on search term
  useEffect(() => {
    if (classSearchTerm) {
      const filtered = ALL_TANZANIA_CLASSES.filter(cls => 
        cls.value.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
        cls.label.toLowerCase().includes(classSearchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(ALL_TANZANIA_CLASSES);
    }
  }, [classSearchTerm]);

  // Set form data when subject changes (edit mode)
  useEffect(() => {
    if (subject && mode === 'edit' && isOpen) {
      setFormData({
        id: subject.id,
        code: subject.code || '',
        name: subject.name || '',
        description: subject.description || '',
        max_marks: subject.max_marks || 100,
        passing_marks: subject.passing_marks || 40,
        student_class: subject.student_class || '',
        is_active: subject.is_active !== undefined ? subject.is_active : true,
        school: subject.school || 0,
        teacher: subject.teacher || null,
      });

      // Set selected subject
      if (subject.name) {
        setSelectedSubject(subject.name);
        setIsCustomSubject(!ALL_TANZANIA_SUBJECTS.includes(subject.name));
      }

      // Set selected class
      if (subject.student_class) {
        setSelectedClass(subject.student_class);
        setIsCustomClass(!ALL_TANZANIA_CLASSES.some(c => c.value === subject.student_class));
      }
    } else if (mode === 'add') {
      setFormData({
        code: '',
        name: '',
        description: '',
        max_marks: 100,
        passing_marks: 40,
        student_class: '',
        is_active: true,
        school: 0,
        teacher: null,
      });
      setSelectedSubject('');
      setSelectedClass('');
      setIsCustomSubject(false);
      setIsCustomClass(false);
      setSubjectSearchTerm('');
      setClassSearchTerm('');
      setShowSubjectDropdown(false);
      setShowClassDropdown(false);
    }
    setErrors({});
  }, [subject, mode, isOpen]);

  // ============================================
  // HANDLERS
  // ============================================

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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [name]: numValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ============================================
  // SUBJECT HANDLERS
  // ============================================

  const handleSubjectSelect = (subjectName: string) => {
    setSelectedSubject(subjectName);
    setFormData(prev => ({ ...prev, name: subjectName }));
    setIsCustomSubject(false);
    setShowSubjectDropdown(false);
    setSubjectSearchTerm('');
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleCustomSubjectToggle = () => {
    setIsCustomSubject(true);
    setShowSubjectDropdown(false);
    setSelectedSubject('');
    setFormData(prev => ({ ...prev, name: '' }));
  };

  const handleCustomSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSubject(e.target.value);
    setFormData(prev => ({ ...prev, name: e.target.value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleEditSubject = () => {
    setShowSubjectDropdown(true);
    setIsCustomSubject(false);
    setSelectedSubject('');
    setFormData(prev => ({ ...prev, name: '' }));
    setSubjectSearchTerm('');
  };

  // ============================================
  // CLASS HANDLERS
  // ============================================

  const handleClassSelect = (classValue: string) => {
    setSelectedClass(classValue);
    setFormData(prev => ({ ...prev, student_class: classValue }));
    setIsCustomClass(false);
    setShowClassDropdown(false);
    setClassSearchTerm('');
    if (errors.student_class) {
      setErrors(prev => ({ ...prev, student_class: '' }));
    }
  };

  const handleCustomClassToggle = () => {
    setIsCustomClass(true);
    setShowClassDropdown(false);
    setSelectedClass('');
    setFormData(prev => ({ ...prev, student_class: '' }));
  };

  const handleCustomClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedClass(e.target.value);
    setFormData(prev => ({ ...prev, student_class: e.target.value }));
    if (errors.student_class) {
      setErrors(prev => ({ ...prev, student_class: '' }));
    }
  };

  const handleEditClass = () => {
    setShowClassDropdown(true);
    setIsCustomClass(false);
    setSelectedClass('');
    setFormData(prev => ({ ...prev, student_class: '' }));
    setClassSearchTerm('');
  };

  // ============================================
  // VALIDATION & SUBMIT
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
      isValid = false;
    }

    // Subject code is now OPTIONAL - removed validation
    // Only validate if code is provided, check format
    if (formData.code && formData.code.trim().length > 0 && formData.code.trim().length < 2) {
      newErrors.code = 'Subject code must be at least 2 characters if provided';
      isValid = false;
    }

    if (!formData.student_class.trim()) {
      newErrors.student_class = 'Class is required';
      isValid = false;
    }

    if (!formData.teacher) {
      newErrors.teacher = 'Please select a teacher';
      isValid = false;
    }

    if (formData.max_marks <= 0) {
      newErrors.max_marks = 'Max marks must be greater than 0';
      isValid = false;
    }

    if (formData.passing_marks < 0) {
      newErrors.passing_marks = 'Passing marks cannot be negative';
      isValid = false;
    }

    if (formData.passing_marks > formData.max_marks) {
      newErrors.passing_marks = 'Passing marks cannot exceed max marks';
      isValid = false;
    }

    if (!formData.school || formData.school === 0) {
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
      // Auto-generate code if not provided
      let subjectCode = formData.code.trim().toUpperCase();
      
      // If code is empty, auto-generate from subject name
      if (!subjectCode) {
        // Generate from subject name (first 3 letters + random number)
        const namePart = formData.name.trim().substring(0, 3).toUpperCase();
        const randomNum = Math.floor(100 + Math.random() * 900);
        subjectCode = `${namePart}${randomNum}`;
        console.log('[SubjectModal] Auto-generated code:', subjectCode);
      }

      const apiData = {
        name: formData.name.trim(),
        code: subjectCode,
        student_class: formData.student_class.trim(),
        teacher: formData.teacher,
        max_marks: formData.max_marks,
        passing_marks: formData.passing_marks,
        description: formData.description.trim(),
        is_active: formData.is_active,
        school: formData.school,
      };

      console.log('[SubjectModal] Submitting data:', apiData);

      if (mode === 'edit' && subject?.id) {
        await subjectService.updateSubject(subject.id, apiData);
        toast.success('Subject updated successfully!');
      } else {
        await subjectService.createSubject(apiData);
        toast.success('Subject added successfully!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[SubjectModal] Submission error:', error);
      
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
        } else if (error.response.data.teacher) {
          toast.error(error.response.data.teacher);
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

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderSubjectSelection = () => {
    // Show selected subject with edit option
    if (selectedSubject && !showSubjectDropdown && !isCustomSubject) {
      return (
        <div className="flex items-center gap-2 p-2.5 border border-green-300 bg-green-50 rounded-lg">
          <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-secondary-900">{selectedSubject}</span>
          <button
            type="button"
            onClick={handleEditSubject}
            className="p-1 hover:bg-green-100 rounded-lg transition-colors text-green-600"
            title="Change subject"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Show custom subject input
    if (isCustomSubject) {
      return (
        <div className="space-y-2">
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleCustomSubjectChange}
              placeholder="Enter custom subject name..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                errors.name ? 'border-red-500' : 'border-secondary-200'
              }`}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCustomSubject(false);
              setSelectedSubject('');
              setFormData(prev => ({ ...prev, name: '' }));
              setSubjectSearchTerm('');
              setShowSubjectDropdown(true);
            }}
            className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700"
          >
            <X className="w-4 h-4" />
            Back to subject list
          </button>
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>
      );
    }

    // Show dropdown
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search Tanzania recognized subjects..."
            value={subjectSearchTerm}
            onChange={(e) => setSubjectSearchTerm(e.target.value)}
            onFocus={() => setShowSubjectDropdown(true)}
            className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            autoFocus
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        </div>
        
        {showSubjectDropdown && (
          <div className="max-h-40 overflow-y-auto border border-secondary-200 rounded-lg">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubjectSelect(sub)}
                  className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors text-sm text-secondary-700 border-b border-secondary-100 last:border-b-0 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>{sub}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-secondary-500 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No matching subjects found
              </div>
            )}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleCustomSubjectToggle}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
        >
          <Plus className="w-4 h-4" />
          Add custom subject not in the list
        </button>
        
        <p className="text-xs text-secondary-400 mt-1">
          Select a recognized Tanzania subject or add a custom one
        </p>
        {errors.name && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.name}
          </p>
        )}
      </div>
    );
  };

  const renderClassSelection = () => {
    // Show selected class with edit option
    if (selectedClass && !showClassDropdown && !isCustomClass) {
      return (
        <div className="flex items-center gap-2 p-2.5 border border-green-300 bg-green-50 rounded-lg">
          <GraduationCap className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-secondary-900">{selectedClass}</span>
          <button
            type="button"
            onClick={handleEditClass}
            className="p-1 hover:bg-green-100 rounded-lg transition-colors text-green-600"
            title="Change class"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Show custom class input
    if (isCustomClass) {
      return (
        <div className="space-y-2">
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              name="student_class"
              value={formData.student_class}
              onChange={handleCustomClassChange}
              placeholder="Enter custom class name..."
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                errors.student_class ? 'border-red-500' : 'border-secondary-200'
              }`}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCustomClass(false);
              setSelectedClass('');
              setFormData(prev => ({ ...prev, student_class: '' }));
              setClassSearchTerm('');
              setShowClassDropdown(true);
            }}
            className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700"
          >
            <X className="w-4 h-4" />
            Back to class list
          </button>
          {errors.student_class && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.student_class}
            </p>
          )}
        </div>
      );
    }

    // Show dropdown
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search Tanzania classes..."
            value={classSearchTerm}
            onChange={(e) => setClassSearchTerm(e.target.value)}
            onFocus={() => setShowClassDropdown(true)}
            className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            autoFocus
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        </div>
        
        {showClassDropdown && (
          <div className="max-h-40 overflow-y-auto border border-secondary-200 rounded-lg">
            {filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <button
                  key={cls.value}
                  type="button"
                  onClick={() => handleClassSelect(cls.value)}
                  className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors text-sm text-secondary-700 border-b border-secondary-100 last:border-b-0 flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>{cls.label}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-secondary-500 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No matching classes found
              </div>
            )}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleCustomClassToggle}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
        >
          <Plus className="w-4 h-4" />
          Add custom class not in the list
        </button>
        
        <p className="text-xs text-secondary-400 mt-1">
          Select a recognized Tanzania class or add a custom one
        </p>
        {errors.student_class && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.student_class}
          </p>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              {mode === 'add' ? 'Add New Subject' : 'Edit Subject'}
            </h2>
            <p className="text-sm text-secondary-500">
              {mode === 'add' ? 'Enter subject details to add to the system' : 'Update subject information'}
            </p>
            {selectedSchool?.school_code && (
              <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                <School className="w-3 h-3" />
                School: {selectedSchool.name} ({selectedSchool.school_code})
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
          {/* School Selection */}
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

          {/* Subject Information */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-500" />
              Subject Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                {renderSubjectSelection()}
              </div>

              {/* Subject Code - OPTIONAL */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Subject Code <span className="text-secondary-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Leave blank to auto-generate"
                    className={`input-field pl-10 uppercase ${errors.code ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.code}
                  </p>
                )}
                <p className="text-xs text-secondary-400 mt-1">
                  Optional - Auto-generated if left blank
                </p>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                {renderClassSelection()}
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <select
                    name="teacher"
                    value={formData.teacher || ''}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.teacher ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading || isLoadingTeachers}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} ({teacher.department})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.teacher && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.teacher}
                  </p>
                )}
                {isLoadingTeachers ? (
                  <p className="text-xs text-secondary-400 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading teachers...
                  </p>
                ) : teachers.length === 0 && !isLoadingTeachers && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No teachers available for this school
                  </p>
                )}
              </div>

              {/* Max Marks */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Max Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="max_marks"
                  value={formData.max_marks}
                  onChange={handleNumberChange}
                  min="1"
                  className={`input-field ${errors.max_marks ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.max_marks && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.max_marks}
                  </p>
                )}
              </div>

              {/* Passing Marks */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Passing Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="passing_marks"
                  value={formData.passing_marks}
                  onChange={handleNumberChange}
                  min="0"
                  className={`input-field ${errors.passing_marks ? 'border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                />
                {errors.passing_marks && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.passing_marks}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      value="true"
                      checked={formData.is_active === true}
                      onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                      className="w-4 h-4 text-green-600 border-secondary-300 focus:ring-green-500"
                      disabled={isLoading}
                    />
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      value="false"
                      checked={formData.is_active === false}
                      onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                      className="w-4 h-4 text-red-600 border-secondary-300 focus:ring-red-500"
                      disabled={isLoading}
                    />
                    <XCircle className="w-4 h-4 text-red-600" />
                    Inactive
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-secondary-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="input-field pl-10 resize-none"
                    placeholder="Brief description of the subject (optional)"
                    disabled={isLoading}
                  />
                </div>
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
              disabled={isLoading || !selectedSchool}
              className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {mode === 'add' ? 'Add Subject' : 'Update Subject'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;