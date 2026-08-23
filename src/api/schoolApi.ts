import axios from 'axios';

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const schoolApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ============================================
// REQUEST INTERCEPTOR - Add Token & Validate Auth
// ============================================

schoolApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    // If no token or no user, reject the request
    if (!token || !user) {
      return Promise.reject({
        response: {
          status: 401,
          data: { 
            status: 'error', 
            message: 'Authentication required. Please login.' 
          }
        }
      });
    }
    
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Token Refresh
// ============================================

schoolApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt refresh on 401 and not already retrying
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
        
        return schoolApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // If 401 and no refresh possible, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// SCHOOL SERVICES
// ============================================

export const schoolService = {
  /**
   * Get all schools with optional filters
   * @param params - Filter parameters (plan, status, search, etc.)
   */
  getSchools: async (params?: any) => {
    const response = await schoolApi.get('/schools/', { params });
    return response.data;
  },

  /**
   * Get a single school by ID
   * @param id - School ID
   */
  getSchool: async (id: number) => {
    const response = await schoolApi.get(`/schools/${id}/`);
    return response.data;
  },

  /**
   * Create a new school
   * @param data - School data
   */
  createSchool: async (data: any) => {
    const response = await schoolApi.post('/schools/', data);
    return response.data;
  },

  /**
   * Update an existing school
   * @param id - School ID
   * @param data - Updated school data
   */
  updateSchool: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a school
   * @param id - School ID
   */
  deleteSchool: async (id: number) => {
    const response = await schoolApi.delete(`/schools/${id}/`);
    return response.data;
  },

  /**
   * Search schools by query
   * @param query - Search term
   */
  searchSchools: async (query: string) => {
    const response = await schoolApi.get('/schools/search/', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Get school statistics
   */
  getSchoolStats: async () => {
    const response = await schoolApi.get('/schools/stats/');
    return response.data;
  },

  /**
   * Get dashboard statistics for a school
   * @param schoolId - School ID
   */
  getDashboardStats: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/dashboard-stats/', {
      params: { school_id: schoolId }
    });
    return response.data;
  },
};

// ============================================
// STUDENT SERVICES - WITH SCHOOL_CODE FILTER
// ============================================

// ============================================
// STUDENT SERVICES - WITH SCHOOL_CODE FILTER
// ============================================

export const studentService = {
  /**
   * Get all students with optional filters
   * @param params - Filter parameters (school, school_code, class, search, etc.)
   */
  getStudents: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/', { params });
    return response.data;
  },

  /**
   * Get a single student by ID
   * @param id - Student ID
   */
  getStudent: async (id: number) => {
    const response = await schoolApi.get(`/schools/students/${id}/`);
    return response.data;
  },

  /**
   * Create a new student
   * @param data - Student data
   */
  createStudent: async (data: any) => {
    const response = await schoolApi.post('/schools/students/', data);
    return response.data;
  },

  /**
   * Update an existing student
   * @param id - Student ID
   * @param data - Updated student data
   */
  updateStudent: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/students/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a student
   * @param id - Student ID
   */
  deleteStudent: async (id: number) => {
    const response = await schoolApi.delete(`/schools/students/${id}/`);
    return response.data;
  },

  /**
   * Get students by class
   * @param className - Class name
   * @param schoolId - Optional school ID
   * @param schoolCode - Optional school code
   */
  getStudentsByClass: async (className: string, schoolId?: string, schoolCode?: string) => {
    const params: any = { student_class: className };
    if (schoolId) params.school = schoolId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/schools/students/', { params });
    return response.data;
  },

  /**
   * Get students by school
   * @param schoolId - School ID
   * @param params - Additional filters
   */
  getStudentsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get students by school code
   * @param schoolCode - School code
   * @param params - Additional filters
   */
  getStudentsBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get students grouped by school
   * This uses the /by-school/ endpoint
   * @param params - Optional filters (school_code, etc.)
   */
  getStudentsGroupedBySchool: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/by-school/', { params });
    return response.data;
  },

  /**
   * Get students by email
   * @param email - Student email
   * @param params - Additional filters
   */
  getStudentsByEmail: async (email: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, email }
    });
    return response.data;
  },

  /**
   * Get students by guardian email
   * @param guardianEmail - Guardian email
   * @param params - Additional filters
   */
  getStudentsByGuardianEmail: async (guardianEmail: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, guardian_email: guardianEmail }
    });
    return response.data;
  },

  /**
   * Get student statistics
   * @param params - Optional filters (school, school_code)
   */
  getStudentStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/stats/', { params });
    return response.data;
  },

  /**
   * Search students by query
   * @param query - Search term
   * @param params - Additional filters (school_code, email, guardian_email, etc.)
   */
  searchStudents: async (query: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/search/', {
      params: { ...params, q: query }
    });
    return response.data;
  },
};

// ============================================
// TEACHER SERVICES
// ============================================

export const teacherService = {
  /**
   * Get all teachers with optional filters
   * @param params - Filter parameters (school, department, search, etc.)
   */
  getTeachers: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  /**
   * Get a single teacher by ID
   * @param id - Teacher ID
   */
  getTeacher: async (id: number) => {
    const response = await schoolApi.get(`/schools/teachers/${id}/`);
    return response.data;
  },

  /**
   * Create a new teacher
   * @param data - Teacher data
   */
  createTeacher: async (data: any) => {
    const response = await schoolApi.post('/schools/teachers/', data);
    return response.data;
  },

  /**
   * Update an existing teacher
   * @param id - Teacher ID
   * @param data - Updated teacher data
   */
  updateTeacher: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/teachers/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a teacher
   * @param id - Teacher ID
   */
  deleteTeacher: async (id: number) => {
    const response = await schoolApi.delete(`/schools/teachers/${id}/`);
    return response.data;
  },

  /**
   * Get teachers by department
   * @param department - Department name
   * @param schoolId - Optional school ID
   */
  getTeachersByDepartment: async (department: string, schoolId?: string) => {
    const params: any = { department };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  /**
   * Get teachers by school
   * @param schoolId - School ID
   * @param params - Additional filters
   */
  getTeachersBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get teachers by school code
   * @param schoolCode - School code
   * @param params - Additional filters
   */
  getTeachersBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get teachers grouped by school
   * @param params - Optional filters
   */
  getTeachersGroupedBySchool: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/by-school/', { params });
    return response.data;
  },

  /**
   * Get teacher statistics
   * @param params - Optional filters (school, school_code)
   */
  getTeacherStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/stats/', { params });
    return response.data;
  },

  /**
   * Search teachers by query
   * @param query - Search term
   * @param params - Additional filters
   */
  searchTeachers: async (query: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/search/', {
      params: { ...params, q: query }
    });
    return response.data;
  },
};

// ============================================
// SUBJECT SERVICES
// ============================================

export const subjectService = {
  /**
   * Get all subjects with optional filters
   * @param params - Filter parameters (school, class, search, etc.)
   */
  getSubjects: async (params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  /**
   * Get a single subject by ID
   * @param id - Subject ID
   */
  getSubject: async (id: number) => {
    const response = await schoolApi.get(`/schools/subjects/${id}/`);
    return response.data;
  },

  /**
   * Create a new subject
   * @param data - Subject data
   */
  createSubject: async (data: any) => {
    const response = await schoolApi.post('/schools/subjects/', data);
    return response.data;
  },

  /**
   * Update an existing subject
   * @param id - Subject ID
   * @param data - Updated subject data
   */
  updateSubject: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/subjects/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a subject
   * @param id - Subject ID
   */
  deleteSubject: async (id: number) => {
    const response = await schoolApi.delete(`/schools/subjects/${id}/`);
    return response.data;
  },

  /**
   * Get subjects by class
   * @param className - Class name
   * @param schoolId - Optional school ID
   */
  getSubjectsByClass: async (className: string, schoolId?: string) => {
    const params: any = { student_class: className };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  /**
   * Get subjects by teacher
   * @param teacherId - Teacher ID
   */
  getSubjectsByTeacher: async (teacherId: number) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { teacher: teacherId }
    });
    return response.data;
  },

  /**
   * Get subjects by school
   * @param schoolId - School ID
   * @param params - Additional filters
   */
  getSubjectsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Search subjects by query
   * @param query - Search term
   * @param params - Additional filters
   */
  searchSubjects: async (query: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/search/', {
      params: { ...params, q: query }
    });
    return response.data;
  },
};

// ============================================
// TERM SERVICES
// ============================================

export const termService = {
  /**
   * Get all academic terms
   * @param params - Filter parameters (school, etc.)
   */
  getTerms: async (params?: any) => {
    const response = await schoolApi.get('/schools/terms/', { params });
    return response.data;
  },

  /**
   * Get terms by school
   * @param schoolId - School ID
   */
  getTermsBySchool: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/terms/', {
      params: { school: schoolId }
    });
    return response.data;
  },

  /**
   * Create a new academic term
   * @param data - Term data
   */
  createTerm: async (data: any) => {
    const response = await schoolApi.post('/schools/terms/', data);
    return response.data;
  },

  /**
   * Get the current academic term for a school
   * @param schoolId - School ID
   */
  getCurrentTerm: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/terms/', {
      params: { school: schoolId, is_current: true }
    });
    return response.data;
  },

  /**
   * Update an existing term
   * @param id - Term ID
   * @param data - Updated term data
   */
  updateTerm: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/terms/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a term
   * @param id - Term ID
   */
  deleteTerm: async (id: number) => {
    const response = await schoolApi.delete(`/schools/terms/${id}/`);
    return response.data;
  },
};

// ============================================
// RESULT SERVICES
// ============================================

export const resultService = {
  /**
   * Get all results with optional filters
   * @param params - Filter parameters (student, subject, term, etc.)
   */
  getResults: async (params?: any) => {
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get a single result by ID
   * @param id - Result ID
   */
  getResult: async (id: number) => {
    const response = await schoolApi.get(`/results/${id}/`);
    return response.data;
  },

  /**
   * Create a new result
   * @param data - Result data
   */
  createResult: async (data: any) => {
    const response = await schoolApi.post('/results/', data);
    return response.data;
  },

  /**
   * Update an existing result
   * @param id - Result ID
   * @param data - Updated result data
   */
  updateResult: async (id: number, data: any) => {
    const response = await schoolApi.put(`/results/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a result
   * @param id - Result ID
   */
  deleteResult: async (id: number) => {
    const response = await schoolApi.delete(`/results/${id}/`);
    return response.data;
  },

  /**
   * Get results by student
   * @param studentId - Student ID
   * @param termId - Optional term ID
   */
  getResultsByStudent: async (studentId: number, termId?: number) => {
    const params: any = { student: studentId };
    if (termId) params.term = termId;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get results by subject
   * @param subjectId - Subject ID
   * @param termId - Optional term ID
   */
  getResultsBySubject: async (subjectId: number, termId?: number) => {
    const params: any = { subject: subjectId };
    if (termId) params.term = termId;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get results by school
   * @param schoolId - School ID
   * @param params - Additional filters
   */
  getResultsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/results/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Bulk create results
   * @param data - Array of result data
   */
  bulkCreateResults: async (data: any[]) => {
    const response = await schoolApi.post('/results/bulk-create/', data);
    return response.data;
  },

  /**
   * Publish results for a student in a term
   * @param data - Student ID and Term ID
   */
  publishResults: async (data: { student_id: number; term_id: number }) => {
    const response = await schoolApi.post('/results/publish/', data);
    return response.data;
  },

  /**
   * Get student statistics
   * @param studentId - Student ID
   */
  getStudentStatistics: async (studentId: number) => {
    const response = await schoolApi.get(`/results/student/${studentId}/statistics/`);
    return response.data;
  },

  /**
   * Get result summaries
   * @param params - Filter parameters
   */
  getResultSummaries: async (params?: any) => {
    const response = await schoolApi.get('/results/summaries/', { params });
    return response.data;
  },
};

// ============================================
// AUTH SERVICES (Direct API calls without interceptor)
// ============================================

export const authApi = {
  /**
   * Login user
   * @param username - Username or email
   * @param password - Password
   */
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/login/`, {
      username,
      password
    });
    return response.data;
  },

  /**
   * Register user
   * @param data - User registration data
   */
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/register/`, data);
    return response.data;
  },

  /**
   * Refresh token
   * @param refreshToken - Refresh token
   */
  refresh: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
      refresh: refreshToken
    });
    return response.data;
  },

  /**
   * Logout user
   * @param refreshToken - Refresh token
   */
  logout: async (refreshToken: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/accounts/logout/`,
      { refresh: refreshToken },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  },

  /**
   * Get user profile
   */
  getProfile: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_BASE_URL}/accounts/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Update user profile
   * @param data - Profile data
   */
  updateProfile: async (data: any) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.put(`${API_BASE_URL}/accounts/profile/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Request password reset
   * @param email - User email
   */
  requestPasswordReset: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/request/`, {
      email
    });
    return response.data;
  },

  /**
   * Confirm password reset
   * @param data - Token, new password, confirm password
   */
  confirmPasswordReset: async (data: { token: string; new_password: string; confirm_password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/confirm/`, data);
    return response.data;
  },

  /**
   * Verify email
   * @param token - Verification token
   */
  verifyEmail: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
      params: { token }
    });
    return response.data;
  },

  /**
   * Resend verification email
   * @param email - User email
   */
  resendVerification: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification/`, {
      email
    });
    return response.data;
  },

  /**
   * Get user activity logs
   */
  getActivityLogs: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_BASE_URL}/accounts/activity-logs/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Check email verification status
   * @param email - User email
   */
  checkVerificationStatus: async (email: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/check-verification-status/`, {
      params: { email }
    });
    return response.data;
  },
};

export default schoolApi;