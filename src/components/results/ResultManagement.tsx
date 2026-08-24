import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Eye, Printer, Download, 
  Loader2, User, AlertCircle, RefreshCw, X,
  ChevronLeft, ChevronRight, School, Hash,
  FileText, Calendar, BookOpen, Users, 
  CheckCircle, XCircle, Clock, ArrowRight,
  Plus, Edit, Trash2, BarChart, Award,
  Mail, Send, Check, FileDown, MailCheck,
  ChevronDown, ChevronUp, FileSpreadsheet
} from 'lucide-react';
import { resultService, studentService, subjectService, schoolService, termService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

interface Result {
  id: number;
  student: number;
  subject: number;
  term: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  grade_point: number;
  exam_type: string;
  teacher_remarks: string;
  is_published: boolean;
  published_at: string | null;
  student_name?: string;
  subject_name?: string;
  term_name?: string;
  school_code?: string;
  school_name?: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  admission_number: string;
  student_class: string;
  email?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Term {
  id: number;
  name: string;
  academic_year: string;
  is_current: boolean;
}

interface StudentResultRow {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className: string;
  email?: string;
  subjectResults: {
    subjectId: number;
    subjectName: string;
    marks: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    gradePoint: number;
    resultId?: number;
    isPublished: boolean;
    remarks: string;
  }[];
  totalMarks: number;
  averagePercentage: number;
  overallGrade: string;
  totalPoints: number;
  resultCount: number;
}

// ============================================
// GRADE COLOR HELPER
// ============================================

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

const getStatusBadge = (isPublished: boolean): string => {
  return isPublished 
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700';
};

const getStatusText = (isPublished: boolean): string => {
  return isPublished ? 'Published' : 'Draft';
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

const ResultManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [studentResultRows, setStudentResultRows] = useState<StudentResultRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<StudentResultRow[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkDownloadFormat, setBulkDownloadFormat] = useState<'pdf' | 'excel'>('pdf');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [classes, setClasses] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;
  
  // School Search States
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Expanded Row State
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);
  
  // Checkbox States
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Matokeo Yako');
  const [emailMessage, setEmailMessage] = useState('Tafadhali angalia kiambatisho chako cha matokeo.');
  const [emailSentCount, setEmailSentCount] = useState(0);
  const [emailFailedCount, setEmailFailedCount] = useState(0);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [emailSendingComplete, setEmailSendingComplete] = useState(false);
  
  // Bulk Download Modal States
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);
  const [bulkDownloadOptions, setBulkDownloadOptions] = useState({
    format: 'pdf' as 'pdf' | 'excel',
    includeAllStudents: true,
    selectedStudentIds: [] as number[],
  });

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
      console.log('[ResultManagement] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[ResultManagement] My school response:', response);
      
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
          await fetchData(schoolCode);
          toast.success(`Loaded data from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[ResultManagement] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchData = useCallback(async (schoolCode: string) => {
    if (!schoolCode) {
      toast.error('School code is required');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[ResultManagement] Fetching data for school code:', schoolCode);
      
      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[ResultManagement] Students response:', studentsResponse);
      
      let studentData: Student[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          studentData = groupedData[0].students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        studentData = studentsResponse;
      } else if (studentsResponse.results) {
        studentData = studentsResponse.results;
      }
      setStudents(studentData);
      
      // Extract unique classes
      const classList = [...new Set(studentData.map(s => s.student_class).filter(Boolean))];
      setClasses(classList);
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[ResultManagement] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      setSubjects(subjectData);
      
      // Fetch terms
      if (userSchoolId) {
        try {
          const termsResponse = await termService.getTermsBySchool(userSchoolId.toString());
          console.log('[ResultManagement] Terms response:', termsResponse);
          
          if (termsResponse.results) {
            setTerms(termsResponse.results);
          } else if (Array.isArray(termsResponse)) {
            setTerms(termsResponse);
          }
        } catch (err) {
          console.log('Could not fetch terms:', err);
        }
      }
      
      // Fetch results
      const resultsResponse = await resultService.getResults({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[ResultManagement] Results response:', resultsResponse);
      
      let resultData: Result[] = [];
      if (resultsResponse.results) {
        resultData = resultsResponse.results;
      } else if (Array.isArray(resultsResponse)) {
        resultData = resultsResponse;
      } else if (resultsResponse.data) {
        resultData = resultsResponse.data;
      }
      
      // Add student and subject names
      const resultsWithNames = resultData.map(r => {
        const student = studentData.find(s => s.id === r.student);
        const subject = subjectData.find(s => s.id === r.subject);
        const term = terms.find(t => t.id === r.term);
        return {
          ...r,
          student_name: student?.full_name || `${student?.first_name} ${student?.last_name}` || 'Unknown',
          subject_name: subject?.name || 'Unknown',
          term_name: term?.name || 'Unknown',
        };
      });
      
      setResults(resultsWithNames);
      
      // Build student result rows
      const rows = buildStudentResultRows(resultsWithNames, studentData, subjectData);
      setStudentResultRows(rows);
      setFilteredRows(rows);
      setTotalResults(rows.length);
      setTotalPages(Math.ceil(rows.length / itemsPerPage));
      
      // Extract unique grades
      const gradeList = [...new Set(resultsWithNames.map(r => r.grade).filter(Boolean))];
      setGrades(gradeList);
      
      toast.success(`Loaded ${rows.length} students with results`);
      
    } catch (error: any) {
      console.error('[ResultManagement] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userSchoolId, terms]);

  // ============================================
  // BUILD STUDENT RESULT ROWS
  // ============================================

  const buildStudentResultRows = (resultsData: Result[], studentsData: Student[], subjectsData: Subject[]): StudentResultRow[] => {
    const studentMap = new Map<number, StudentResultRow>();
    
    // Initialize rows for all students
    studentsData.forEach(student => {
      studentMap.set(student.id, {
        studentId: student.id,
        studentName: student.full_name || `${student.first_name} ${student.last_name}`,
        admissionNumber: student.admission_number,
        className: student.student_class,
        email: student.email,
        subjectResults: [],
        totalMarks: 0,
        averagePercentage: 0,
        overallGrade: 'N/A',
        totalPoints: 0,
        resultCount: 0,
      });
    });
    
    // Add results to students
    resultsData.forEach(result => {
      const row = studentMap.get(result.student);
      if (row) {
        const subject = subjectsData.find(s => s.id === result.subject);
        if (subject) {
          row.subjectResults.push({
            subjectId: result.subject,
            subjectName: subject.name,
            marks: result.marks_obtained,
            totalMarks: result.total_marks,
            percentage: result.percentage,
            grade: result.grade,
            gradePoint: result.grade_point,
            resultId: result.id,
            isPublished: result.is_published,
            remarks: result.teacher_remarks,
          });
          row.totalMarks += result.marks_obtained;
          row.resultCount += 1;
        }
      }
    });
    
    // Calculate averages and grades
    studentMap.forEach(row => {
      if (row.resultCount > 0) {
        const totalPercentage = row.subjectResults.reduce((sum, s) => sum + s.percentage, 0);
        row.averagePercentage = totalPercentage / row.resultCount;
        row.totalPoints = row.subjectResults.reduce((sum, s) => sum + getGradePoint(s.grade), 0);
        
        // Calculate overall grade
        const avg = row.averagePercentage;
        let grade = '';
        if (avg >= 90) grade = 'A';
        else if (avg >= 80) grade = 'B+';
        else if (avg >= 70) grade = 'B';
        else if (avg >= 60) grade = 'C+';
        else if (avg >= 50) grade = 'C';
        else if (avg >= 40) grade = 'D';
        else if (avg >= 30) grade = 'E';
        else grade = 'F';
        row.overallGrade = grade;
      }
    });
    
    return Array.from(studentMap.values());
  };

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
  // FILTER RESULTS
  // ============================================

  useEffect(() => {
    let filtered = [...studentResultRows];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        row.studentName?.toLowerCase().includes(term) ||
        row.admissionNumber?.toLowerCase().includes(term) ||
        row.className?.toLowerCase().includes(term)
      );
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(row => row.className === selectedClass);
    }
    
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(row => row.overallGrade === selectedGrade);
    }
    
    if (selectedStatus !== 'all') {
      const isPublished = selectedStatus === 'published';
      filtered = filtered.filter(row => 
        row.subjectResults.some(s => s.isPublished === isPublished)
      );
    }
    
    setFilteredRows(filtered);
    setTotalResults(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
    // Reset selections when filters change
    setSelectedStudents(new Set());
    setSelectAll(false);
  }, [
    searchTerm, selectedClass, selectedGrade, selectedStatus, studentResultRows
  ]);

  // ============================================
  // CHECKBOX HANDLERS
  // ============================================

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      const currentPageIds = getPaginatedRows().map(r => r.studentId);
      setSelectedStudents(new Set(currentPageIds));
    }
    setSelectAll(!selectAll);
  };

  // ============================================
  // BULK DOWNLOAD HANDLERS
  // ============================================

  const openBulkDownloadModal = () => {
    if (filteredRows.length === 0) {
      toast.error('No results to download');
      return;
    }
    
    // Check if there are students with results
    const studentsWithResults = filteredRows.filter(r => r.resultCount > 0);
    if (studentsWithResults.length === 0) {
      toast.error('No students have results to download');
      return;
    }
    
    setBulkDownloadOptions({
      format: 'pdf',
      includeAllStudents: true,
      selectedStudentIds: Array.from(selectedStudents),
    });
    setIsBulkDownloadModalOpen(true);
  };

  const handleBulkDownload = async () => {
    if (!currentSchoolInfo) {
      toast.error('School information not found');
      return;
    }

    setIsBulkDownloading(true);
    
    try {
      let studentIds: number[] = [];
      
      if (bulkDownloadOptions.includeAllStudents) {
        // Get all students with results
        studentIds = filteredRows
          .filter(r => r.resultCount > 0)
          .map(r => r.studentId);
      } else {
        // Get selected students
        studentIds = bulkDownloadOptions.selectedStudentIds;
      }
      
      if (studentIds.length === 0) {
        toast.error('No students selected for download');
        setIsBulkDownloading(false);
        return;
      }

      console.log(`[ResultManagement] Bulk downloading ${studentIds.length} students in ${bulkDownloadOptions.format} format`);
      
      let blob: Blob;
      let fileName: string;
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (bulkDownloadOptions.format === 'pdf') {
        // Download as PDF
        blob = await resultService.getBulkResultsPDF({
          school_code: currentSchoolInfo.code,
          term_id: selectedTerm || undefined,
          student_ids: studentIds.join(',')
        });
        fileName = `bulk_results_${currentSchoolInfo.code}_${dateStr}.pdf`;
      } else {
        // Download as Excel
        blob = await resultService.getBulkResultsExcel({
          school_code: currentSchoolInfo.code,
          term_id: selectedTerm || undefined,
          student_ids: studentIds.join(',')
        });
        fileName = `bulk_results_${currentSchoolInfo.code}_${dateStr}.xlsx`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Successfully downloaded ${studentIds.length} student results!`);
    } catch (error: any) {
      console.error('[ResultManagement] Bulk download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download results');
    } finally {
      setIsBulkDownloading(false);
      setIsBulkDownloadModalOpen(false);
    }
  };

  // ============================================
  // EMAIL MODAL HANDLERS
  // ============================================

  const openEmailModal = () => {
    const selectedIds = Array.from(selectedStudents);
    if (selectedIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const selectedRows = filteredRows.filter(r => selectedIds.includes(r.studentId));
    const studentsWithEmail = selectedRows.filter(r => r.email);
    
    if (studentsWithEmail.length === 0) {
      toast.error('Selected students do not have email addresses');
      return;
    }

    setEmailSubject('Matokeo Yako');
    setEmailMessage('Tafadhali angalia kiambatisho chako cha matokeo.');
    setEmailSentCount(0);
    setEmailFailedCount(0);
    setEmailErrors([]);
    setEmailSendingComplete(false);
    setIsEmailModalOpen(true);
  };

  const handleSendEmails = async () => {
    if (!currentSchoolInfo) {
      toast.error('School information not found');
      return;
    }

    const selectedIds = Array.from(selectedStudents);
    const selectedRows = filteredRows.filter(r => selectedIds.includes(r.studentId));
    const studentIds = selectedRows.map(r => r.studentId);
    
    const studentsWithEmail = selectedRows.filter(r => r.email);
    
    if (studentsWithEmail.length === 0) {
      toast.error('No students with email addresses selected');
      return;
    }

    setIsSendingEmails(true);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const payload = {
        school_code: currentSchoolInfo.code,
        term_id: selectedTerm || undefined,
        student_ids: studentIds,
        subject: emailSubject,
        message: emailMessage,
      };
      
      console.log('[ResultManagement] Sending bulk emails:', payload);
      
      const response = await resultService.sendBulkResultsEmail(payload);
      console.log('[ResultManagement] Bulk email response:', response);
      
      if (response.status === 'success') {
        sent = response.data?.sent_count || 0;
        failed = response.data?.failed_count || 0;
        if (response.data?.errors) {
          errors.push(...response.data.errors);
        }
        
        setEmailSentCount(sent);
        setEmailFailedCount(failed);
        setEmailErrors(errors);
        setEmailSendingComplete(true);
        
        toast.success(`Successfully sent ${sent} emails${failed > 0 ? `, ${failed} failed` : ''}`);
      } else {
        toast.error(response.message || 'Failed to send emails');
      }
    } catch (error: any) {
      console.error('[ResultManagement] Error sending emails:', error);
      toast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setIsSendingEmails(false);
    }
  };

  // ============================================
  // SINGLE RESULT ACTIONS
  // ============================================

  const handleDownloadPDF = async (studentId: number) => {
    setIsDownloading(true);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Student not found');
        return;
      }
      
      const pdfBlob = await resultService.getStudentResultsPDF({
        student_id: studentId,
        term_id: selectedTerm || undefined
      });
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${student.full_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('[ResultManagement] Error downloading PDF:', error);
      toast.error(error.response?.data?.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendSingleEmail = async (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      toast.error('Student not found');
      return;
    }

    if (!student.email) {
      toast.error('Student does not have an email address');
      return;
    }

    // Get all results for this student
    const studentResults = results.filter(r => r.student === studentId);
    if (studentResults.length === 0) {
      toast.error('No results found for this student');
      return;
    }

    setIsSendingEmails(true);
    try {
      // Send first result as single email (or you can implement bulk for single student)
      const payload = {
        result_id: studentResults[0].id,
        email: student.email,
        subject: 'Matokeo Yako',
        message: 'Tafadhali angalia kiambatisho chako cha matokeo.',
      };
      
      const response = await resultService.sendSingleResultEmail(payload);
      
      if (response.status === 'success') {
        toast.success(`Result sent to ${student.email} successfully!`);
      } else {
        toast.error(response.message || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('[ResultManagement] Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSendingEmails(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchData(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setResults([]);
    setFilteredResults([]);
    setStudents([]);
    setSubjects([]);
    setTerms([]);
    setClasses([]);
    setGrades([]);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedTerm(null);
    setSelectedGrade('all');
    setSelectedStatus('all');
    setSearchError(null);
    setSelectedStudents(new Set());
    setSelectAll(false);
    setStudentResultRows([]);
    setFilteredRows([]);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchData(currentSchoolInfo.code);
    }
  };

  const handleCreateResults = () => {
    navigate('/results/create');
  };

  const toggleExpandStudent = (studentId: number) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExport = async () => {
    if (filteredRows.length === 0) {
      toast.error('No results to export');
      return;
    }

    setIsExporting(true);
    try {
      const headers = ['Student', 'Admission', 'Class', ...subjects.map(s => s.name), 'Average', 'Grade', 'Points'];
      const rows = filteredRows.map(row => {
        const subjectMarks = subjects.map(subject => {
          const result = row.subjectResults.find(s => s.subjectId === subject.id);
          return result ? `${result.marks}/${result.totalMarks} (${result.grade})` : '-';
        });
        return [
          row.studentName,
          row.admissionNumber,
          row.className,
          ...subjectMarks,
          row.averagePercentage.toFixed(1) + '%',
          row.overallGrade,
          row.totalPoints.toFixed(1)
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${currentSchoolInfo?.code}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaginatedRows = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading results...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view results
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {userEmail && (
              <button
                onClick={fetchMySchoolByAdminEmail}
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
        <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Results Found</h3>
        <p className="text-secondary-500 mt-1">
          No results found for this school. Start by creating results.
        </p>
        <button
          onClick={handleCreateResults}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create Results
        </button>
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
          <p className="text-secondary-500">You need to be logged in to view results</p>
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
            <BarChart className="w-6 h-6 text-primary-600" />
            Results Management
          </h1>
          <p className="text-secondary-500">View and manage all student results</p>
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
              {/* Bulk Actions */}
              {selectedStudents.size > 0 && (
                <button
                  onClick={openEmailModal}
                  disabled={isSendingEmails}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Send to {selectedStudents.size} Selected
                </button>
              )}
              <button 
                onClick={openBulkDownloadModal}
                disabled={isBulkDownloading || filteredRows.filter(r => r.resultCount > 0).length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
              >
                {isBulkDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                Bulk Download
              </button>
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting || filteredRows.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export
              </button>
              <button 
                onClick={() => toast.info('Print feature coming soon')}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleCreateResults}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
              >
                <Plus className="w-4 h-4" />
                Create Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {studentResultRows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : studentResultRows.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">With Results</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : studentResultRows.filter(r => r.resultCount > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Avg. Performance</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {isLoading ? '...' : (() => {
                const avg = studentResultRows.reduce((sum, r) => sum + r.averagePercentage, 0) / studentResultRows.length || 0;
                return avg.toFixed(1) + '%';
              })()}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Published</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {isLoading ? '...' : studentResultRows.filter(r => r.subjectResults.some(s => s.isPublished)).length}
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          SEARCH AND FILTERS
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
                onClick={fetchMySchoolByAdminEmail}
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
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by student name, admission..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            
            <select
              value={selectedTerm || ''}
              onChange={(e) => {
                setSelectedTerm(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.is_current && '(Current)'}
                </option>
              ))}
            </select>
            
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            
            {(searchTerm || selectedClass !== 'all' || selectedTerm || selectedGrade !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('all');
                  setSelectedTerm(null);
                  setSelectedGrade('all');
                  setSelectedStatus('all');
                }}
                className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ==========================================
            RESULTS TABLE - Single Row Per Student
            ========================================== */}
        <div className="overflow-x-auto">
          {isLoading ? (
            renderLoadingState()
          ) : filteredRows.length === 0 ? (
            renderEmptyState()
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Class</th>
                  {subjects.map(subject => (
                    <th key={subject.id} className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      {subject.name}
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Avg</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Points</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {getPaginatedRows().map((row, index) => {
                  const globalIndex = ((currentPage - 1) * itemsPerPage) + index + 1;
                  const isSelected = selectedStudents.has(row.studentId);
                  const isExpanded = expandedStudent === row.studentId;
                  const hasEmail = !!row.email;
                  
                  return (
                    <React.Fragment key={row.studentId}>
                      <tr className="hover:bg-secondary-50 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(row.studentId)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            disabled={row.resultCount === 0}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-500">
                          {globalIndex}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-medium text-xs">
                              {row.studentName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-secondary-900">{row.studentName}</p>
                              <p className="text-xs text-secondary-400">{row.admissionNumber}</p>
                            </div>
                            {hasEmail && (
                              <span className="text-xs text-secondary-400" title={`Email: ${row.email}`}>
                                <Mail className="w-3 h-3 inline" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {row.className}
                        </td>
                        {subjects.map(subject => {
                          const result = row.subjectResults.find(s => s.subjectId === subject.id);
                          return (
                            <td key={subject.id} className="py-3 px-4">
                              {result ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-secondary-700">
                                    {result.marks}/{result.totalMarks}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                    {result.grade}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-secondary-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                          {row.resultCount > 0 ? row.averagePercentage.toFixed(1) + '%' : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {row.resultCount > 0 && row.overallGrade !== 'N/A' ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(row.overallGrade)}`}>
                              {row.overallGrade}
                            </span>
                          ) : (
                            <span className="text-sm text-secondary-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {row.resultCount > 0 ? row.totalPoints.toFixed(1) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownloadPDF(row.studentId)}
                              disabled={isDownloading || row.resultCount === 0}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <FileDown className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                            </button>
                            {hasEmail && row.resultCount > 0 && (
                              <button
                                onClick={() => handleSendSingleEmail(row.studentId)}
                                disabled={isSendingEmails}
                                className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                                title="Send to Email"
                              >
                                <MailCheck className="w-4 h-4 text-green-500 hover:text-green-700" />
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpandStudent(row.studentId)}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title={isExpanded ? 'Hide Details' : 'View Details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row - Subject Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={subjects.length + 8} className="py-4 px-4 bg-secondary-50">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-secondary-900">
                                Detailed Results for {row.studentName}
                                {selectedTerm && ` - ${terms.find(t => t.id === selectedTerm)?.name || 'Term'}`}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {row.subjectResults.map((subject) => (
                                  <div key={subject.subjectId} className="bg-white rounded-lg p-3 border border-secondary-200">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-secondary-900">{subject.subjectName}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                      </span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm text-secondary-600">
                                        Marks: {subject.marks}/{subject.totalMarks}
                                      </p>
                                      <p className="text-sm text-secondary-600">
                                        Percentage: {subject.percentage.toFixed(1)}%
                                      </p>
                                      <p className="text-sm text-secondary-600">
                                        Points: {subject.gradePoint.toFixed(1)}
                                      </p>
                                      <p className="text-xs text-secondary-400">
                                        Status: {subject.isPublished ? 'Published' : 'Draft'}
                                      </p>
                                      {subject.remarks && (
                                        <p className="text-xs text-secondary-500 mt-1">
                                          Remarks: {subject.remarks}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {row.subjectResults.length === 0 && (
                                  <div className="col-span-3 text-center text-secondary-400 py-8">
                                    No subject results available
                                  </div>
                                )}
                              </div>
                              {row.subjectResults.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                  <div className="bg-white rounded-lg p-3 text-center border border-secondary-200">
                                    <p className="text-xs text-secondary-400">Subjects</p>
                                    <p className="text-lg font-bold text-secondary-900">{row.subjectResults.length}</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 text-center border border-secondary-200">
                                    <p className="text-xs text-secondary-400">Average</p>
                                    <p className="text-lg font-bold text-secondary-900">
                                      {row.averagePercentage.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 text-center border border-secondary-200">
                                    <p className="text-xs text-secondary-400">Overall Grade</p>
                                    <p className={`text-lg font-bold ${getGradeColor(row.overallGrade)}`}>
                                      {row.overallGrade}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 text-center border border-secondary-200">
                                    <p className="text-xs text-secondary-400">Total Points</p>
                                    <p className="text-lg font-bold text-secondary-900">
                                      {row.totalPoints.toFixed(1)}
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

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && filteredRows.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-secondary-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} students
              </p>
              {selectedStudents.size > 0 && (
                <span className="text-sm text-primary-600 font-medium">
                  {selectedStudents.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-secondary-400" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-secondary-100 text-secondary-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-secondary-400">...</span>}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-secondary-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          BULK DOWNLOAD MODAL
          ========================================== */}
      {isBulkDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
            <div className="border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-purple-600" />
                  Bulk Download Results
                </h2>
                <p className="text-sm text-secondary-500">
                  Download results for multiple students
                </p>
              </div>
              <button
                onClick={() => setIsBulkDownloadModalOpen(false)}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Download Options
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="includeAll"
                      checked={bulkDownloadOptions.includeAllStudents}
                      onChange={() => setBulkDownloadOptions({
                        ...bulkDownloadOptions,
                        includeAllStudents: true,
                      })}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="includeAll" className="text-sm text-secondary-700">
                      All {filteredRows.filter(r => r.resultCount > 0).length} students with results
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="includeSelected"
                      checked={!bulkDownloadOptions.includeAllStudents}
                      onChange={() => setBulkDownloadOptions({
                        ...bulkDownloadOptions,
                        includeAllStudents: false,
                      })}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      disabled={selectedStudents.size === 0}
                    />
                    <label htmlFor="includeSelected" className="text-sm text-secondary-700">
                      Selected students ({selectedStudents.size} selected)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBulkDownloadOptions({
                      ...bulkDownloadOptions,
                      format: 'pdf'
                    })}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      bulkDownloadOptions.format === 'pdf'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-secondary-200 hover:border-purple-300'
                    }`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-1 ${
                      bulkDownloadOptions.format === 'pdf' ? 'text-purple-600' : 'text-secondary-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      bulkDownloadOptions.format === 'pdf' ? 'text-purple-700' : 'text-secondary-600'
                    }`}>
                      PDF
                    </p>
                  </button>
                  <button
                    onClick={() => setBulkDownloadOptions({
                      ...bulkDownloadOptions,
                      format: 'excel'
                    })}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${
                      bulkDownloadOptions.format === 'excel'
                        ? 'border-green-600 bg-green-50'
                        : 'border-secondary-200 hover:border-green-300'
                    }`}
                  >
                    <FileSpreadsheet className={`w-6 h-6 mx-auto mb-1 ${
                      bulkDownloadOptions.format === 'excel' ? 'text-green-600' : 'text-secondary-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      bulkDownloadOptions.format === 'excel' ? 'text-green-700' : 'text-secondary-600'
                    }`}>
                      Excel
                    </p>
                  </button>
                </div>
              </div>

              {selectedTerm && (
                <div className="bg-secondary-50 rounded-lg p-3">
                  <p className="text-sm text-secondary-600">
                    <span className="font-medium">Term:</span>{' '}
                    {terms.find(t => t.id === selectedTerm)?.name || 'Selected Term'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => setIsBulkDownloadModalOpen(false)}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDownload}
                  disabled={isBulkDownloading}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          EMAIL MODAL
          ========================================== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  Send Results via Email
                </h2>
                <p className="text-sm text-secondary-500">
                  Sending to {selectedStudents.size} selected students
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setEmailSendingComplete(false);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter email subject"
                    disabled={isSendingEmails || emailSendingComplete}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter email message"
                    disabled={isSendingEmails || emailSendingComplete}
                  />
                </div>
              </div>

              {isSendingEmails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Sending emails...</p>
                      <p className="text-xs text-blue-600">
                        Sent: {emailSentCount} | Failed: {emailFailedCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {emailSendingComplete && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Emails sent successfully!</p>
                      <p className="text-xs text-green-600">
                        Sent: {emailSentCount} | Failed: {emailFailedCount}
                      </p>
                      {emailErrors.length > 0 && (
                        <div className="mt-2">
                          {emailErrors.map((err, idx) => (
                            <p key={idx} className="text-xs text-red-600">{err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setEmailSendingComplete(false);
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isSendingEmails}
                >
                  {emailSendingComplete ? 'Close' : 'Cancel'}
                </button>
                {!emailSendingComplete && (
                  <button
                    type="button"
                    onClick={handleSendEmails}
                    disabled={isSendingEmails}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSendingEmails ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Emails
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultManagement;