import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, CheckCircle, Clock, Printer, 
  Download, Save, Send, Trash2, Plus,
  School, Hash, Loader2, AlertCircle, RefreshCw, ArrowRight,
  Users, BookOpen, FileText,
  User, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resultService, studentService, subjectService, schoolService, termService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  admission_number: string;
  student_class: string;
  school_code?: string;
  school?: number;
  email?: string;
  guardian_email?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  student_class: string;
  teacher_name?: string;
  school: number;
}

interface Term {
  id: number;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
  is_current: boolean;
}

interface StudentResult {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  class: string;
  subjects: {
    subjectId: number;
    subjectName: string;
    subjectCode: string;
    marks: number;
    totalMarks: number;
    grade: string;
    percentage: number;
    remarks: string;
    resultId?: number;
    isSaved?: boolean;
  }[];
  overallAverage: number;
  overallGrade: string;
  totalPoints: number;
}

// ============================================
// GRADE CALCULATION FUNCTIONS
// ============================================

const calculateGrade = (marks: number, totalMarks: number = 100): { grade: string; percentage: number } => {
  const percentage = (marks / totalMarks) * 100;
  
  let grade = '';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B+';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C+';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else if (percentage >= 30) grade = 'E';
  else grade = 'F';
  
  return { grade, percentage };
};

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A': 'bg-green-100 text-green-700',
    'B+': 'bg-blue-100 text-blue-700',
    'B': 'bg-blue-50 text-blue-600',
    'C+': 'bg-yellow-100 text-yellow-700',
    'C': 'bg-yellow-50 text-yellow-600',
    'D': 'bg-orange-100 text-orange-700',
    'E': 'bg-red-50 text-red-600',
    'F': 'bg-red-100 text-red-700',
    'N/A': 'bg-gray-100 text-gray-500',
  };
  return colors[grade] || colors['N/A'];
};

const getGradePoint = (grade: string): number => {
  const points: Record<string, number> = {
    'A': 5.0,
    'B+': 4.5,
    'B': 4.0,
    'C+': 3.5,
    'C': 3.0,
    'D': 2.0,
    'E': 1.0,
    'F': 0.0,
  };
  return points[grade] || 0;
};

// ============================================
// MAIN COMPONENT
// ============================================

const ResultEntry: React.FC = () => {
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  
  // School Search States
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Add Subject State
  const [newSubjectId, setNewSubjectId] = useState<number | null>(null);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userEmail = user?.email || '';
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);

  // ============================================
  // FETCH MY SCHOOL BY ADMIN EMAIL
  // ============================================

  const fetchMySchoolByAdminEmail = useCallback(async () => {
    if (!userEmail) {
      toast.error('No email found for logged in user');
      return;
    }

    setIsLoadingMySchool(true);
    setSearchError(null);

    try {
      console.log('[ResultEntry] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[ResultEntry] My school response:', response);
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          setCurrentSchoolInfo({
            code: schoolData.school_code,
            name: schoolData.name,
            id: schoolData.id
          });
          await fetchDataBySchoolCode(schoolCode);
          toast.success(`Loaded data from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[ResultEntry] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH DATA BY SCHOOL CODE
  // ============================================

  const fetchDataBySchoolCode = useCallback(async (schoolCode: string) => {
    if (!schoolCode || schoolCode.trim() === '') {
      toast.error('Please enter a school code');
      return;
    }

    const cleanCode = schoolCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(cleanCode)) {
      toast.error('School code must be 5 characters (letters and numbers only)');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      console.log('[ResultEntry] Fetching data for school code:', cleanCode);
      
      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(cleanCode);
      console.log('[ResultEntry] Students response:', studentsResponse);
      
      let studentData: Student[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          const schoolData = groupedData[0];
          setCurrentSchoolInfo({
            code: schoolData.school_code,
            name: schoolData.school_name,
            id: schoolData.school_id
          });
          studentData = schoolData.students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        studentData = studentsResponse;
      } else if (studentsResponse.results) {
        studentData = studentsResponse.results;
      }
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: cleanCode,
        page_size: 100
      });
      console.log('[ResultEntry] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      
      // Fetch terms
      if (userSchoolId) {
        try {
          const termsResponse = await termService.getTermsBySchool(userSchoolId.toString());
          console.log('[ResultEntry] Terms response:', termsResponse);
          
          if (termsResponse.results) {
            setTerms(termsResponse.results);
          } else if (Array.isArray(termsResponse)) {
            setTerms(termsResponse);
          }
        } catch (err) {
          console.log('Could not fetch terms:', err);
        }
      }
      
      setStudents(studentData);
      setSubjects(subjectData);
      
      const classList = [...new Set(studentData.map(s => s.student_class).filter(Boolean))];
      setClasses(classList);
      
      const initialResults: StudentResult[] = studentData.map(student => ({
        studentId: student.id,
        studentName: student.full_name || `${student.first_name} ${student.last_name}`,
        admissionNumber: student.admission_number,
        class: student.student_class,
        subjects: [],
        overallAverage: 0,
        overallGrade: 'N/A',
        totalPoints: 0,
      }));
      setStudentResults(initialResults);
      
      toast.success(`Loaded ${studentData.length} students and ${subjectData.length} subjects`);
      
    } catch (error: any) {
      console.error('[ResultEntry] Error fetching data:', error);
      
      let errorMsg = 'Failed to fetch data';
      
      if (error.response?.status === 404) {
        errorMsg = `School with code "${cleanCode}" not found`;
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setSearchError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userSchoolId]);

  // ============================================
  // AUTO-LOAD ON PAGE LOAD
  // ============================================

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetchMySchoolByAdminEmail();
    } else {
      setIsInitialLoading(false);
    }
  }, [isAuthenticated, userEmail, fetchMySchoolByAdminEmail]);

  // ============================================
  // AUTO-SELECT FIRST TERM
  // ============================================

  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      const currentTerm = terms.find(t => t.is_current);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      } else {
        setSelectedTerm(terms[0].id);
      }
    }
  }, [terms]);

  // ============================================
  // FILTER STUDENTS
  // ============================================

  useEffect(() => {
    let filtered = [...students];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.first_name?.toLowerCase().includes(term) ||
        s.last_name?.toLowerCase().includes(term) ||
        s.admission_number?.toLowerCase().includes(term)
      );
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.student_class === selectedClass);
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, selectedClass, students]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchDataBySchoolCode(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setStudents([]);
    setFilteredStudents([]);
    setSubjects([]);
    setStudentResults([]);
    setClasses([]);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchTerm('');
    setSelectedClass('all');
    setSearchError(null);
    setTerms([]);
    setSelectedTerm(null);
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchDataBySchoolCode(currentSchoolInfo.code);
    }
  };

  const handleViewStudent = (studentId: number) => {
    setSelectedStudent(studentId === selectedStudent ? null : studentId);
    initializeStudentResults(studentId);
  };

  const initializeStudentResults = (studentId: number) => {
    const existing = studentResults.find(r => r.studentId === studentId);
    if (existing) return;

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newResult: StudentResult = {
      studentId: student.id,
      studentName: student.full_name || `${student.first_name} ${student.last_name}`,
      admissionNumber: student.admission_number,
      class: student.student_class,
      subjects: [],
      overallAverage: 0,
      overallGrade: 'N/A',
      totalPoints: 0,
    };

    setStudentResults(prev => [...prev, newResult]);
  };

  const addSubjectToStudent = (studentId: number, subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        const existingSubject = result.subjects.find(s => s.subjectId === subjectId);
        if (existingSubject) return result;

        return {
          ...result,
          subjects: [
            ...result.subjects,
            {
              subjectId: subject.id,
              subjectName: subject.name,
              subjectCode: subject.code,
              marks: 0,
              totalMarks: 100,
              grade: 'N/A',
              percentage: 0,
              remarks: '',
              isSaved: false,
            }
          ],
        };
      }
      return result;
    }));

    toast.success(`Added ${subject.name}`);
  };

  const removeSubjectFromStudent = (studentId: number, subjectId: number) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        return {
          ...result,
          subjects: result.subjects.filter(s => s.subjectId !== subjectId),
        };
      }
      return result;
    }));
    toast.success('Subject removed');
  };

  const updateMarks = (studentId: number, subjectId: number, marks: number) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        const updatedSubjects = result.subjects.map(subject => {
          if (subject.subjectId === subjectId) {
            const { grade, percentage } = calculateGrade(marks, subject.totalMarks);
            return {
              ...subject,
              marks,
              grade,
              percentage,
              isSaved: false,
            };
          }
          return subject;
        });

        const validSubjects = updatedSubjects.filter(s => s.marks > 0);
        const totalPercentage = validSubjects.reduce((sum, s) => sum + s.percentage, 0);
        const overallAverage = validSubjects.length > 0 ? totalPercentage / validSubjects.length : 0;
        const { grade: overallGrade } = calculateGrade(overallAverage, 100);
        const totalPoints = validSubjects.reduce((sum, s) => sum + getGradePoint(s.grade), 0);

        return {
          ...result,
          subjects: updatedSubjects,
          overallAverage,
          overallGrade: validSubjects.length > 0 ? overallGrade : 'N/A',
          totalPoints,
        };
      }
      return result;
    }));
  };

  const updateRemarks = (studentId: number, subjectId: number, remarks: string) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        return {
          ...result,
          subjects: result.subjects.map(subject => {
            if (subject.subjectId === subjectId) {
              return { ...subject, remarks, isSaved: false };
            }
            return subject;
          }),
        };
      }
      return result;
    }));
  };

  const getStudentResult = (studentId: number) => {
    return studentResults.find(r => r.studentId === studentId);
  };

  const getAvailableSubjects = (studentId: number) => {
    const result = getStudentResult(studentId);
    const existingIds = result?.subjects.map(s => s.subjectId) || [];
    return subjects.filter(s => !existingIds.includes(s.id));
  };

  // ============================================
  // SAVE FUNCTIONS
  // ============================================

  const saveStudentResults = async (studentId: number) => {
    if (!currentSchoolInfo?.id) {
      toast.error('No school selected');
      return;
    }

    if (!selectedTerm) {
      toast.error('Please select a term first');
      return;
    }

    const studentResult = getStudentResult(studentId);
    if (!studentResult) {
      toast.error('No results found for this student');
      return;
    }

    const subjectsToSave = studentResult.subjects.filter(s => s.marks > 0);
    if (subjectsToSave.length === 0) {
      toast.error('No marks entered to save for this student');
      return;
    }

    setSavingStudentId(studentId);
    try {
      const resultsToSave: any[] = [];
      
      for (const subject of subjectsToSave) {
        const data = {
          school_id: currentSchoolInfo.id,
          student_id: studentId,
          subject_id: subject.subjectId,
          term_id: selectedTerm,
          marks_obtained: subject.marks,
          total_marks: subject.totalMarks || 100,
          exam_type: 'final',
          teacher_remarks: subject.remarks || '',
        };
        resultsToSave.push(data);
      }
      
      console.log('[ResultEntry] Saving results data:', resultsToSave);
      
      const response = await resultService.bulkCreateResults(resultsToSave);
      console.log('[ResultEntry] Save response:', response);
      
      setStudentResults(prev => prev.map(result => {
        if (result.studentId === studentId) {
          return {
            ...result,
            subjects: result.subjects.map(s => ({
              ...s,
              isSaved: true,
            })),
          };
        }
        return result;
      }));
      
      toast.success(`Saved ${resultsToSave.length} results for ${studentResult.studentName}!`);
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save results');
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!currentSchoolInfo?.id) {
      toast.error('No school selected');
      return;
    }

    if (!selectedTerm) {
      toast.error('Please select a term first');
      return;
    }

    setIsSaving(true);
    try {
      const resultsToSave: any[] = [];
      
      for (const result of studentResults) {
        for (const subject of result.subjects) {
          if (subject.marks > 0) {
            resultsToSave.push({
              school_id: currentSchoolInfo.id,
              student_id: result.studentId,
              subject_id: subject.subjectId,
              term_id: selectedTerm,
              marks_obtained: subject.marks,
              total_marks: subject.totalMarks || 100,
              exam_type: 'final',
              teacher_remarks: subject.remarks || '',
            });
          }
        }
      }
      
      if (resultsToSave.length === 0) {
        toast.error('No marks entered to save');
        return;
      }
      
      console.log('[ResultEntry] Saving all results:', resultsToSave);
      
      const response = await resultService.bulkCreateResults(resultsToSave);
      console.log('[ResultEntry] Save all response:', response);
      
      setStudentResults(prev => prev.map(result => ({
        ...result,
        subjects: result.subjects.map(s => ({
          ...s,
          isSaved: true,
        })),
      })));
      
      toast.success(`Saved ${resultsToSave.length} results successfully!`);
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save results');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentSchoolInfo?.id) {
      toast.error('No school selected');
      return;
    }

    if (!selectedTerm) {
      toast.error('Please select a term first');
      return;
    }

    setIsPublishing(true);
    try {
      const data: any = {
        term_id: selectedTerm,
        school_code: currentSchoolInfo.code,
      };
      
      if (selectedStudent) {
        data.student_id = selectedStudent;
      }
      
      const response = await resultService.publishResults(data);
      console.log('[ResultEntry] Publish response:', response);
      
      toast.success(`Results published successfully! Students can now view their results.`);
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish results');
    } finally {
      setIsPublishing(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading data...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view and enter results
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {userEmail && (
              <button
                onClick={handleMySchool}
                disabled={isLoadingMySchool}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoadingMySchool ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue with my school
              </button>
            )}
          </div>
        </div>
      );
    }

    if (!currentSchoolInfo && hasSearched) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">School Not Found</h3>
          <p className="text-secondary-500 mt-1">
            {searchError || 'No school found with the code you entered.'}
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 px-4 py-2 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Students Found</h3>
        <p className="text-secondary-500 mt-1">
          No students found for this school. Please check the school code.
        </p>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to enter results</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading your school data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Result Entry
          </h1>
          <p className="text-secondary-500">Enter and manage student results</p>
          {currentSchoolInfo && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <School className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {currentSchoolInfo.name}
              </span>
              <span className="text-xs font-mono bg-primary-50 px-2 py-0.5 rounded text-primary-600 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {currentSchoolInfo.code}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {currentSchoolInfo && (
            <>
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={() => toast('Print feature coming soon', { icon: '🖨️' })}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button 
                onClick={() => toast('Export feature coming soon', { icon: '📥' })}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving || !selectedTerm}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save All
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !selectedTerm}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Publish Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          SEARCH BY SCHOOL CODE
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-secondary-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-secondary-700 mb-1 block">
                Search by School Code
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Enter school code (e.g., AY8NH)"
                    value={searchSchoolCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (/^[A-Z0-9]*$/.test(value) || value === '') {
                        setSearchSchoolCode(value);
                        setSearchError(null);
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all uppercase ${
                      searchError ? 'border-red-500' : 'border-secondary-200'
                    }`}
                    maxLength={10}
                  />
                  {searchError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !searchSchoolCode.trim()}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2.5 text-secondary-600 hover:text-secondary-800 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-1 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </form>
              {searchError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {searchError}
                </p>
              )}
              <p className="text-xs text-secondary-400 mt-1">
                Enter a 5-character school code
              </p>
            </div>
          </div>

          {/* My School Button */}
          {userEmail && !currentSchoolInfo && !isLoading && !isInitialLoading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-secondary-200" />
              <button
                onClick={handleMySchool}
                disabled={isLoadingMySchool}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isLoadingMySchool ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue with my school
              </button>
              <div className="h-px flex-1 bg-secondary-200" />
            </div>
          )}

          {/* Current School Info */}
          {currentSchoolInfo && !searchError && (
            <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {currentSchoolInfo.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    Code: {currentSchoolInfo.code} • ID: {currentSchoolInfo.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
                title="Refresh"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 text-primary-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {terms.length > 0 && (
              <select
                value={selectedTerm || ''}
                onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
                className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            )}
            <div className="text-sm text-secondary-400">
              {students.length} students
            </div>
          </div>
        )}

        {/* ==========================================
            STUDENT LIST
            ========================================== */}
        <div className="overflow-x-auto">
          {isLoading ? (
            renderLoadingState()
          ) : filteredStudents.length === 0 ? (
            renderEmptyState()
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Admission</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subjects</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Average</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Points</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredStudents.map((student) => {
                  const result = getStudentResult(student.id);
                  const isExpanded = selectedStudent === student.id;

                  return (
                    <React.Fragment key={student.id}>
                      <tr className="hover:bg-secondary-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-medium text-xs">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <span className="text-sm font-medium text-secondary-900">
                              {student.full_name || `${student.first_name} ${student.last_name}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">{student.admission_number}</td>
                        <td className="py-3 px-4 text-sm text-secondary-600">{student.student_class}</td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {result ? result.subjects.length : 0} subjects
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                          {result && result.subjects.length > 0 ? result.overallAverage.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {result && result.subjects.length > 0 && result.overallGrade !== 'N/A' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.overallGrade)}`}>
                              {result.overallGrade}
                            </span>
                          ) : (
                            <span className="text-sm text-secondary-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {result && result.subjects.length > 0 ? result.totalPoints.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewStudent(student.id)}
                            className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'Enter Results'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row - Subject Entry */}
                      {isExpanded && result && (
                        <tr>
                          <td colSpan={8} className="py-4 px-4 bg-secondary-50">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <h4 className="font-semibold text-secondary-900">
                                  Results for {student.full_name || `${student.first_name} ${student.last_name}`}
                                  {selectedTerm && ` - ${terms.find(t => t.id === selectedTerm)?.name || 'Term'}`}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getAvailableSubjects(student.id).length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={newSubjectId || ''}
                                        onChange={(e) => setNewSubjectId(parseInt(e.target.value) || null)}
                                        className="px-3 py-1.5 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                      >
                                        <option value="">Add Subject...</option>
                                        {getAvailableSubjects(student.id).map(sub => (
                                          <option key={sub.id} value={sub.id}>
                                            {sub.name} ({sub.code})
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          if (newSubjectId) {
                                            addSubjectToStudent(student.id, newSubjectId);
                                            setNewSubjectId(null);
                                          }
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => saveStudentResults(student.id)}
                                    disabled={savingStudentId === student.id || !selectedTerm}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary-600 text-white text-sm rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50"
                                  >
                                    {savingStudentId === student.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    Save
                                  </button>
                                </div>
                              </div>

                              {/* Subject Entry Table */}
                              <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-secondary-100">
                                    <tr>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Subject</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Code</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Marks</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Total</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">%</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Grade</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Remarks</th>
                                      <th className="text-right py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
                                      <th className="text-right py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-secondary-100">
                                    {result.subjects.map((subject) => (
                                      <tr key={subject.subjectId} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-2 px-3 text-sm text-secondary-700">{subject.subjectName}</td>
                                        <td className="py-2 px-3 text-sm text-secondary-500">{subject.subjectCode}</td>
                                        <td className="py-2 px-3">
                                          <input
                                            type="number"
                                            value={subject.marks}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value) || 0;
                                              updateMarks(student.id, subject.subjectId, Math.min(100, Math.max(0, val)));
                                            }}
                                            className="w-16 px-2 py-1 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            min="0"
                                            max="100"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-sm text-secondary-500">{subject.totalMarks}</td>
                                        <td className="py-2 px-3 text-sm font-medium text-secondary-700">
                                          {subject.marks > 0 ? subject.percentage.toFixed(1) + '%' : '-'}
                                        </td>
                                        <td className="py-2 px-3">
                                          {subject.marks > 0 ? (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(subject.grade)}`}>
                                              {subject.grade}
                                            </span>
                                          ) : (
                                            <span className="text-sm text-secondary-400">-</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          <input
                                            type="text"
                                            value={subject.remarks}
                                            onChange={(e) => updateRemarks(student.id, subject.subjectId, e.target.value)}
                                            placeholder="Add remarks"
                                            className="w-full px-2 py-1 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                          />
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          {subject.isSaved ? (
                                            <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                                              <CheckCircle className="w-4 h-4" />
                                              Saved
                                            </span>
                                          ) : subject.marks > 0 ? (
                                            <span className="text-xs text-yellow-600 flex items-center justify-end gap-1">
                                              <Clock className="w-4 h-4" />
                                              Draft
                                            </span>
                                          ) : (
                                            <span className="text-xs text-secondary-400">-</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <button
                                            onClick={() => removeSubjectFromStudent(student.id, subject.subjectId)}
                                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {result.subjects.length === 0 && (
                                      <tr>
                                        <td colSpan={9} className="py-8 text-center text-secondary-400">
                                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                                          <p>No subjects added yet. Click "Add Subject" to enter results.</p>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Summary */}
                              {result.subjects.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                    <p className="text-xs text-secondary-400">Subjects</p>
                                    <p className="text-lg font-bold text-secondary-900">{result.subjects.length}</p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                    <p className="text-xs text-secondary-400">Average</p>
                                    <p className="text-lg font-bold text-secondary-900">
                                      {result.overallAverage.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                    <p className="text-xs text-secondary-400">Overall Grade</p>
                                    <p className={`text-lg font-bold ${result.overallGrade !== 'N/A' ? getGradeColor(result.overallGrade) : 'text-secondary-400'}`}>
                                      {result.overallGrade}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                    <p className="text-xs text-secondary-400">Total Points</p>
                                    <p className="text-lg font-bold text-secondary-900">
                                      {result.totalPoints.toFixed(1)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultEntry;