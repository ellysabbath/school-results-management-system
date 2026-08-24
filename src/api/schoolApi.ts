import axios from 'axios';

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ============================================
// MAIN SCHOOL API - With Authentication
// ============================================

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
    // FIX: Check if error.config exists before accessing it
    if (!error.config) {
      return Promise.reject(error);
    }
    
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
// PAYMENT API - Separate instance for payments (No strict auth)
// ============================================

const paymentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Payment API Request Interceptor - Just add token if available
paymentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Payment API Response Interceptor - Handle 401 gracefully
paymentApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // FIX: Check if error.config exists
    if (!error.config) {
      return Promise.reject(error);
    }
    
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
        
        return paymentApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// ADMIN USER API - Separate instance for admin (No strict auth)
// ============================================

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Admin API Request Interceptor - Just add token if available
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Admin API Response Interceptor - Handle 401 gracefully
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.config) {
      return Promise.reject(error);
    }
    
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
        
        return adminApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// ADMIN USER SERVICES
// ============================================

export const adminUserService = {
  /**
   * Get all users with optional filters
   * GET /api/admin/users/
   */
  getUsers: async (params?: any) => {
    try {
      const response = await adminApi.get('/admin/users/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUsers error:', error);
      throw error;
    }
  },

  /**
   * Get a single user by ID
   * GET /api/admin/users/{id}/
   */
  getUser: async (id: number) => {
    try {
      const response = await adminApi.get(`/admin/users/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUser error:', error);
      throw error;
    }
  },

  /**
   * Create a new user
   * POST /api/admin/users/create/
   */
  createUser: async (data: any) => {
    try {
      console.log('[adminUserService] Creating user:', data);
      const response = await adminApi.post('/admin/users/create/', data);
      console.log('[adminUserService] Create user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] createUser error:', error);
      console.error('[adminUserService] Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Update a user
   * PUT /api/admin/users/{id}/update/
   */
  updateUser: async (id: number, data: any) => {
    try {
      console.log('[adminUserService] Updating user:', data);
      const response = await adminApi.put(`/admin/users/${id}/update/`, data);
      console.log('[adminUserService] Update user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] updateUser error:', error);
      console.error('[adminUserService] Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Delete a user
   * DELETE /api/admin/users/{id}/delete/
   */
  deleteUser: async (id: number) => {
    try {
      const response = await adminApi.delete(`/admin/users/${id}/delete/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] deleteUser error:', error);
      throw error;
    }
  },

  /**
   * Toggle user active status
   * POST /api/admin/users/{id}/toggle-active/
   */
  toggleUserActive: async (id: number) => {
    try {
      const response = await adminApi.post(`/admin/users/${id}/toggle-active/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] toggleUserActive error:', error);
      throw error;
    }
  },

  /**
   * Toggle user email verification
   * POST /api/admin/users/{id}/toggle-verified/
   */
  toggleUserVerified: async (id: number) => {
    try {
      const response = await adminApi.post(`/admin/users/${id}/toggle-verified/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] toggleUserVerified error:', error);
      throw error;
    }
  },

  /**
   * Change user password
   * POST /api/admin/users/{id}/change-password/
   */
  changeUserPassword: async (id: number, newPassword: string) => {
    try {
      const response = await adminApi.post(`/admin/users/${id}/change-password/`, {
        new_password: newPassword
      });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] changeUserPassword error:', error);
      throw error;
    }
  },

  /**
   * Get user activity logs
   * GET /api/admin/users/activity-logs/
   */
  getUserActivityLogs: async (params?: any) => {
    try {
      const response = await adminApi.get('/admin/users/activity-logs/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUserActivityLogs error:', error);
      throw error;
    }
  },

  /**
   * Get user statistics
   * GET /api/admin/users/stats/
   */
  getUserStats: async () => {
    try {
      const response = await adminApi.get('/admin/users/stats/');
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUserStats error:', error);
      throw error;
    }
  },

  /**
   * Bulk create users
   * POST /api/admin/users/bulk-create/
   */
  bulkCreateUsers: async (users: any[]) => {
    try {
      const response = await adminApi.post('/admin/users/bulk-create/', { users });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] bulkCreateUsers error:', error);
      throw error;
    }
  },
};

// ============================================
// SCHOOL SERVICES
// ============================================

export const schoolService = {
  /**
   * Get all schools with optional filters
   */
  getSchools: async (params?: any) => {
    const response = await schoolApi.get('/schools/', { params });
    return response.data;
  },

  /**
   * Get a single school by ID
   */
  getSchool: async (id: number) => {
    const response = await schoolApi.get(`/schools/${id}/`);
    return response.data;
  },

  /**
   * Create a new school
   */
  createSchool: async (data: any) => {
    const response = await schoolApi.post('/schools/', data);
    return response.data;
  },

  /**
   * Update an existing school
   */
  updateSchool: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a school
   */
  deleteSchool: async (id: number) => {
    const response = await schoolApi.delete(`/schools/${id}/`);
    return response.data;
  },

  /**
   * Search schools by query
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
   */
  getDashboardStats: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/dashboard-stats/', {
      params: { school_id: schoolId }
    });
    return response.data;
  },
};

// ============================================
// STUDENT SERVICES
// ============================================

export const studentService = {
  /**
   * Get students by school code
   */
  getStudentsBySchoolCode: async (schoolCode: string) => {
    if (!schoolCode || schoolCode.trim() === '') {
      throw new Error('School code is required');
    }
    
    const url = `/schools/students/by-school/?school_code=${encodeURIComponent(schoolCode.trim().toUpperCase())}`;
    console.log('[studentService] Fetching students for school:', schoolCode);
    console.log('[studentService] URL:', url);
    
    const response = await schoolApi.get(url);
    console.log('[studentService] Response:', response.data);
    return response.data;
  },

  /**
   * Get all students with optional filters
   */
  getStudents: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/', { params });
    return response.data;
  },

  /**
   * Get a single student by ID
   */
  getStudent: async (id: number) => {
    const response = await schoolApi.get(`/schools/students/${id}/`);
    return response.data;
  },

  /**
   * Create a new student
   */
  createStudent: async (data: any) => {
    const response = await schoolApi.post('/schools/students/', data);
    return response.data;
  },

  /**
   * Update an existing student
   */
  updateStudent: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/students/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a student
   */
  deleteStudent: async (id: number) => {
    const response = await schoolApi.delete(`/schools/students/${id}/`);
    return response.data;
  },

  /**
   * Get students by class
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
   */
  getStudentsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get students by email
   */
  getStudentsByEmail: async (email: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, email }
    });
    return response.data;
  },

  /**
   * Get students by guardian email
   */
  getStudentsByGuardianEmail: async (guardianEmail: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, guardian_email: guardianEmail }
    });
    return response.data;
  },

  /**
   * Get student statistics
   */
  getStudentStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/stats/', { params });
    return response.data;
  },

  /**
   * Search students by query
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
   */
  getTeachers: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  /**
   * Get a single teacher by ID
   */
  getTeacher: async (id: number) => {
    const response = await schoolApi.get(`/schools/teachers/${id}/`);
    return response.data;
  },

  /**
   * Create a new teacher
   */
  createTeacher: async (data: any) => {
    const response = await schoolApi.post('/schools/teachers/', data);
    return response.data;
  },

  /**
   * Update an existing teacher
   */
  updateTeacher: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/teachers/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a teacher
   */
  deleteTeacher: async (id: number) => {
    const response = await schoolApi.delete(`/schools/teachers/${id}/`);
    return response.data;
  },

  /**
   * Get teachers by department
   */
  getTeachersByDepartment: async (department: string, schoolId?: string) => {
    const params: any = { department };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  /**
   * Get teachers by school
   */
  getTeachersBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get teachers by school code
   */
  getTeachersBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get teachers grouped by school
   */
  getTeachersGroupedBySchool: async (schoolCode?: string) => {
    let url = '/schools/teachers/by-school/';
    
    if (schoolCode && schoolCode.trim() !== '' && schoolCode !== 'all') {
      url = `/schools/teachers/by-school/?school_code=${encodeURIComponent(schoolCode.trim().toUpperCase())}`;
    }
    
    console.log('[teacherService] Request URL:', url);
    
    const response = await schoolApi.get(url);
    console.log('[teacherService] Response:', response.data);
    return response.data;
  },

  /**
   * Get teacher statistics
   */
  getTeacherStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/stats/', { params });
    return response.data;
  },

  /**
   * Search teachers by query
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
   */
  getSubjects: async (params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  /**
   * Get a single subject by ID
   */
  getSubject: async (id: number) => {
    const response = await schoolApi.get(`/schools/subjects/${id}/`);
    return response.data;
  },

  /**
   * Create a new subject
   */
  createSubject: async (data: any) => {
    const response = await schoolApi.post('/schools/subjects/', data);
    return response.data;
  },

  /**
   * Update an existing subject
   */
  updateSubject: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/subjects/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a subject
   */
  deleteSubject: async (id: number) => {
    const response = await schoolApi.delete(`/schools/subjects/${id}/`);
    return response.data;
  },

  /**
   * Get subjects by class
   */
  getSubjectsByClass: async (className: string, schoolId?: string) => {
    const params: any = { student_class: className };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  /**
   * Get subjects by teacher
   */
  getSubjectsByTeacher: async (teacherId: number) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { teacher: teacherId }
    });
    return response.data;
  },

  /**
   * Get subjects by school
   */
  getSubjectsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get subjects by school code
   */
  getSubjectsBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get subjects grouped by school
   */
  getSubjectsGroupedBySchool: async (schoolCode?: string) => {
    let url = '/schools/subjects/by-school/';
    
    if (schoolCode && schoolCode.trim() !== '' && schoolCode !== 'all') {
      url = `/schools/subjects/by-school/?school_code=${encodeURIComponent(schoolCode.trim().toUpperCase())}`;
    }
    
    console.log('[subjectService] Request URL:', url);
    
    const response = await schoolApi.get(url);
    console.log('[subjectService] Response:', response.data);
    return response.data;
  },

  /**
   * Search subjects by query
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
   */
  getTerms: async (params?: any) => {
    const response = await schoolApi.get('/schools/terms/', { params });
    return response.data;
  },

  /**
   * Get terms by school
   */
  getTermsBySchool: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/terms/', {
      params: { school: schoolId }
    });
    return response.data;
  },

  /**
   * Create a new academic term
   */
  createTerm: async (data: any) => {
    const response = await schoolApi.post('/schools/terms/', data);
    return response.data;
  },

  /**
   * Get a single term by ID
   */
  getTerm: async (id: number) => {
    const response = await schoolApi.get(`/schools/terms/${id}/`);
    return response.data;
  },

  /**
   * Update an existing term
   */
  updateTerm: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/terms/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a term
   */
  deleteTerm: async (id: number) => {
    const response = await schoolApi.delete(`/schools/terms/${id}/`);
    return response.data;
  },

  /**
   * Get the current academic term for a school
   */
  getCurrentTerm: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/terms/', {
      params: { school: schoolId, is_current: true }
    });
    return response.data;
  },
};

// ============================================
// SUBSCRIPTION SERVICES
// ============================================

export const subscriptionService = {
  /**
   * Get all plans
   */
  getPlans: async () => {
    const response = await schoolApi.get('/subscriptions/plans/');
    return response.data;
  },

  /**
   * Get a plan by ID
   */
  getPlan: async (id: number) => {
    const response = await schoolApi.get(`/subscriptions/plans/${id}/`);
    return response.data;
  },

  /**
   * Get subscriptions
   */
  getSubscriptions: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/', { params });
    return response.data;
  },

  /**
   * Create subscription
   */
  createSubscription: async (data: any) => {
    const response = await schoolApi.post('/subscriptions/create/', data);
    return response.data;
  },

  /**
   * Get subscription by ID
   */
  getSubscription: async (id: number) => {
    const response = await schoolApi.get(`/subscriptions/${id}/`);
    return response.data;
  },

  /**
   * Update subscription
   */
  updateSubscription: async (id: number, data: any) => {
    const response = await schoolApi.put(`/subscriptions/${id}/`, data);
    return response.data;
  },

  /**
   * Check expiry for a school
   */
  checkExpiry: async (schoolCode: string) => {
    const response = await schoolApi.get('/subscriptions/check-expiry/', {
      params: { school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get payments
   */
  getPayments: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/payments/', { params });
    return response.data;
  },

  /**
   * Create payment
   */
  createPayment: async (data: any) => {
    const response = await schoolApi.post('/subscriptions/payments/create/', data);
    return response.data;
  },

  /**
   * Get invoices
   */
  getInvoices: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/invoices/', { params });
    return response.data;
  },
};

// ============================================
// SYSTEM SERVICES
// ============================================

export const systemService = {
  /**
   * Get system settings
   */
  getSettings: async (params?: any) => {
    const response = await schoolApi.get('/system/settings/', { params });
    return response.data;
  },

  /**
   * Update system setting
   */
  updateSetting: async (id: number, data: any) => {
    const response = await schoolApi.put(`/system/settings/${id}/`, data);
    return response.data;
  },

  /**
   * Bulk update settings
   */
  bulkUpdateSettings: async (settings: any[]) => {
    const response = await schoolApi.post('/system/settings/bulk-update/', { settings });
    return response.data;
  },

  /**
   * Get activity logs
   */
  getActivities: async (params?: any) => {
    const response = await schoolApi.get('/system/activities/', { params });
    return response.data;
  },

  /**
   * Get system alerts
   */
  getAlerts: async (params?: any) => {
    const response = await schoolApi.get('/system/alerts/', { params });
    return response.data;
  },

  /**
   * Resolve alert
   */
  resolveAlert: async (id: number) => {
    const response = await schoolApi.post(`/system/alerts/${id}/resolve/`);
    return response.data;
  },

  /**
   * Get feature flags
   */
  getFeatures: async (params?: any) => {
    const response = await schoolApi.get('/system/features/', { params });
    return response.data;
  },
};

// ============================================
// NOTIFICATION SERVICES
// ============================================

export const notificationService = {
  /**
   * Get notifications
   */
  getNotifications: async (params?: any) => {
    const response = await schoolApi.get('/notifications/', { params });
    return response.data;
  },

  /**
   * Create notification
   */
  createNotification: async (data: any) => {
    const response = await schoolApi.post('/notifications/create/', data);
    return response.data;
  },

  /**
   * Get notification by ID
   */
  getNotification: async (id: number) => {
    const response = await schoolApi.get(`/notifications/${id}/`);
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id: number) => {
    const response = await schoolApi.delete(`/notifications/${id}/`);
    return response.data;
  },

  /**
   * Mark notifications as read
   */
  markAsRead: async (notificationIds?: number[], markAll?: boolean) => {
    const response = await schoolApi.post('/notifications/mark-read/', {
      notification_ids: notificationIds,
      mark_all: markAll
    });
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async () => {
    const response = await schoolApi.get('/notifications/preferences/');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (data: any) => {
    const response = await schoolApi.put('/notifications/preferences/', data);
    return response.data;
  },

  /**
   * Get notification templates
   */
  getTemplates: async () => {
    const response = await schoolApi.get('/notifications/templates/');
    return response.data;
  },
};

// ============================================
// TESLA / PAYMENT SERVICES - Using paymentApi
// ============================================

export const paymentService = {
  /**
   * Get all Tesla transactions
   * GET /api/payments/
   */
  getTransactions: async (params?: any) => {
    try {
      const response = await paymentApi.get('/payments/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransactions error:', error);
      throw error;
    }
  },

  /**
   * Get a single Tesla transaction by ID
   * GET /api/payments/{id}/
   */
  getTransaction: async (id: number) => {
    try {
      const response = await paymentApi.get(`/payments/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransaction error:', error);
      throw error;
    }
  },

  /**
   * Create a new Tesla transaction
   * POST /api/payments/create/
   */
  createTransaction: async (data: any) => {
    try {
      console.log('[paymentService] Creating transaction with data:', data);
      const response = await paymentApi.post('/payments/create/', data);
      console.log('[paymentService] Create transaction response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] createTransaction error:', error);
      console.error('[paymentService] Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Update a Tesla transaction
   * PUT /api/payments/{id}/update/
   */
  updateTransaction: async (id: number, data: any) => {
    try {
      const response = await paymentApi.put(`/payments/${id}/update/`, data);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] updateTransaction error:', error);
      throw error;
    }
  },

  /**
   * Delete a Tesla transaction
   * DELETE /api/payments/{id}/
   */
  deleteTransaction: async (id: number) => {
    try {
      const response = await paymentApi.delete(`/payments/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] deleteTransaction error:', error);
      throw error;
    }
  },

  /**
   * Process a Tesla transaction (start, confirm, complete, fail, cancel)
   * POST /api/payments/{id}/process/
   */
  processTransaction: async (id: number, action: string, data?: any) => {
    try {
      const response = await paymentApi.post(`/payments/${id}/process/`, {
        action,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] processTransaction error:', error);
      throw error;
    }
  },

  /**
   * Get Tesla transaction statistics
   * GET /api/payments/stats/
   */
  getTransactionStats: async (params?: any) => {
    try {
      const response = await paymentApi.get('/payments/stats/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransactionStats error:', error);
      throw error;
    }
  },

  /**
   * Get Tesla transactions by school
   * GET /api/payments/school/{school_code}/
   */
  getTransactionsBySchool: async (schoolCode: string) => {
    try {
      const response = await paymentApi.get(`/payments/school/${schoolCode}/`);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransactionsBySchool error:', error);
      throw error;
    }
  },
};

// ============================================
// RESULT SERVICES
// ============================================

export const resultService = {
  /**
   * Get all results with optional filters
   */
  getResults: async (params?: any) => {
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get a single result by ID
   */
  getResult: async (id: number) => {
    const response = await schoolApi.get(`/results/${id}/`);
    return response.data;
  },

  /**
   * Create a new result
   */
  createResult: async (data: any) => {
    const response = await schoolApi.post('/results/', data);
    return response.data;
  },

  /**
   * Update an existing result
   */
  updateResult: async (id: number, data: any) => {
    const response = await schoolApi.put(`/results/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a result
   */
  deleteResult: async (id: number) => {
    const response = await schoolApi.delete(`/results/${id}/`);
    return response.data;
  },

  /**
   * Get results by student
   */
  getResultsByStudent: async (studentId: number, termId?: number, schoolCode?: string) => {
    const params: any = { student: studentId };
    if (termId) params.term = termId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get results by subject
   */
  getResultsBySubject: async (subjectId: number, termId?: number, schoolCode?: string) => {
    const params: any = { subject: subjectId };
    if (termId) params.term = termId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  /**
   * Get results by school
   */
  getResultsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/results/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  /**
   * Get results by school code
   */
  getResultsBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/results/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  /**
   * Get results grouped by school
   */
  getResultsBySchoolGrouped: async (schoolCode: string, termId?: number) => {
    const params: any = { school_code: schoolCode };
    if (termId) params.term = termId;
    const response = await schoolApi.get('/results/by-school/', { params });
    return response.data;
  },

  /**
   * Get result statistics
   */
  getResultStats: async (params?: any) => {
    const response = await schoolApi.get('/results/stats/', { params });
    return response.data;
  },

  /**
   * Search results
   */
  searchResults: async (query: string, params?: any) => {
    const response = await schoolApi.get('/results/search/', {
      params: { ...params, q: query }
    });
    return response.data;
  },

  /**
   * Bulk create results
   */
  bulkCreateResults: async (data: any[]) => {
    const response = await schoolApi.post('/results/bulk-create/', data);
    return response.data;
  },

  /**
   * Publish results
   */
  publishResults: async (data: { student_id?: number; term_id: number; school_code?: string }) => {
    const response = await schoolApi.post('/results/publish/', data);
    return response.data;
  },

  /**
   * Get student statistics
   */
  getStudentStatistics: async (studentId: number) => {
    const response = await schoolApi.get(`/results/student/${studentId}/statistics/`);
    return response.data;
  },

  /**
   * Get result summaries
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
   */
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/register/`, data);
    return response.data;
  },

  /**
   * Refresh token
   */
  refresh: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
      refresh: refreshToken
    });
    return response.data;
  },

  /**
   * Logout user
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
   */
  requestPasswordReset: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/request/`, {
      email
    });
    return response.data;
  },

  /**
   * Confirm password reset
   */
  confirmPasswordReset: async (data: { token: string; new_password: string; confirm_password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/confirm/`, data);
    return response.data;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
      params: { token }
    });
    return response.data;
  },

  /**
   * Resend verification email
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
   */
  checkVerificationStatus: async (email: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/check-verification-status/`, {
      params: { email }
    });
    return response.data;
  },
};

export default schoolApi;