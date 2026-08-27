import axios from 'axios';

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://resultmanagement.pythonanywhere.com/api';

// ============================================
// MAIN SCHOOL API - With Authentication
// ============================================

const schoolApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 500000,
});

// ============================================
// REQUEST INTERCEPTOR - Add Token & Validate Auth
// ============================================

// ============================================
// REQUEST INTERCEPTOR - Add Token (FIXED)
// ============================================

schoolApi.interceptors.request.use(
  (config) => {
    // Try to get token from multiple sources
    let token = localStorage.getItem('access_token');
    
    // If not in localStorage, try sessionStorage
    if (!token) {
      token = sessionStorage.getItem('access_token');
    }
    
    // If still no token, try to get from auth_data
    if (!token) {
      try {
        const authData = localStorage.getItem('auth_data');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.access_token || parsed?.token || null;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // If we have a token, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token attached to request:', config.url);
    } else {
      console.warn('[API] No token found for request:', config.url);
      // Don't add Authorization header if no token
      delete config.headers.Authorization;
    }
    
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
        
        return schoolApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
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
// PAYMENT API - Separate instance for payments
// ============================================

const paymentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

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

paymentApi.interceptors.response.use(
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
// ADMIN USER API - Separate instance for admin
// ============================================

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

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
  getUsers: async (params?: any) => {
    try {
      const response = await adminApi.get('/admin/users/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUsers error:', error);
      throw error;
    }
  },

  getUser: async (id: number) => {
    try {
      const response = await adminApi.get(`/admin/users/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUser error:', error);
      throw error;
    }
  },

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

  deleteUser: async (id: number) => {
    try {
      const response = await adminApi.delete(`/admin/users/${id}/delete/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] deleteUser error:', error);
      throw error;
    }
  },

  toggleUserActive: async (id: number) => {
    try {
      const response = await adminApi.post(`/admin/users/${id}/toggle-active/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] toggleUserActive error:', error);
      throw error;
    }
  },

  toggleUserVerified: async (id: number) => {
    try {
      const response = await adminApi.post(`/admin/users/${id}/toggle-verified/`);
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] toggleUserVerified error:', error);
      throw error;
    }
  },

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

  getUserActivityLogs: async (params?: any) => {
    try {
      const response = await adminApi.get('/admin/users/activity-logs/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUserActivityLogs error:', error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await adminApi.get('/admin/users/stats/');
      return response.data;
    } catch (error: any) {
      console.error('[adminUserService] getUserStats error:', error);
      throw error;
    }
  },

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
  getSchools: async (params?: any) => {
    const response = await schoolApi.get('/schools/', { params });
    return response.data;
  },

  getSchool: async (id: number) => {
    const response = await schoolApi.get(`/schools/${id}/`);
    return response.data;
  },

  createSchool: async (data: any) => {
    const response = await schoolApi.post('/schools/', data);
    return response.data;
  },

  updateSchool: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/${id}/`, data);
    return response.data;
  },

  deleteSchool: async (id: number) => {
    const response = await schoolApi.delete(`/schools/${id}/`);
    return response.data;
  },

  searchSchools: async (query: string) => {
    const response = await schoolApi.get('/schools/search/', {
      params: { q: query }
    });
    return response.data;
  },

  getSchoolStats: async () => {
    const response = await schoolApi.get('/schools/stats/');
    return response.data;
  },

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

  getStudents: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/', { params });
    return response.data;
  },

  getStudent: async (id: number) => {
    const response = await schoolApi.get(`/schools/students/${id}/`);
    return response.data;
  },

  createStudent: async (data: any) => {
    const response = await schoolApi.post('/schools/students/', data);
    return response.data;
  },

  updateStudent: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/students/${id}/`, data);
    return response.data;
  },

  deleteStudent: async (id: number) => {
    const response = await schoolApi.delete(`/schools/students/${id}/`);
    return response.data;
  },

  getStudentsByClass: async (className: string, schoolId?: string, schoolCode?: string) => {
    const params: any = { student_class: className };
    if (schoolId) params.school = schoolId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/schools/students/', { params });
    return response.data;
  },

  getStudentsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  getStudentsByEmail: async (email: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, email }
    });
    return response.data;
  },

  getStudentsByGuardianEmail: async (guardianEmail: string, params?: any) => {
    const response = await schoolApi.get('/schools/students/', {
      params: { ...params, guardian_email: guardianEmail }
    });
    return response.data;
  },

  getStudentStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/students/stats/', { params });
    return response.data;
  },

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
  getTeachers: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  getTeacher: async (id: number) => {
    const response = await schoolApi.get(`/schools/teachers/${id}/`);
    return response.data;
  },

  createTeacher: async (data: any) => {
    const response = await schoolApi.post('/schools/teachers/', data);
    return response.data;
  },

  updateTeacher: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/teachers/${id}/`, data);
    return response.data;
  },

  deleteTeacher: async (id: number) => {
    const response = await schoolApi.delete(`/schools/teachers/${id}/`);
    return response.data;
  },

  getTeachersByDepartment: async (department: string, schoolId?: string) => {
    const params: any = { department };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/teachers/', { params });
    return response.data;
  },

  getTeachersBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  getTeachersBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/teachers/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

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

  getTeacherStats: async (params?: any) => {
    const response = await schoolApi.get('/schools/teachers/stats/', { params });
    return response.data;
  },

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
  getSubjects: async (params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  getSubject: async (id: number) => {
    const response = await schoolApi.get(`/schools/subjects/${id}/`);
    return response.data;
  },

  createSubject: async (data: any) => {
    const response = await schoolApi.post('/schools/subjects/', data);
    return response.data;
  },

  updateSubject: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/subjects/${id}/`, data);
    return response.data;
  },

  deleteSubject: async (id: number) => {
    const response = await schoolApi.delete(`/schools/subjects/${id}/`);
    return response.data;
  },

  getSubjectsByClass: async (className: string, schoolId?: string) => {
    const params: any = { student_class: className };
    if (schoolId) params.school = schoolId;
    const response = await schoolApi.get('/schools/subjects/', { params });
    return response.data;
  },

  getSubjectsByTeacher: async (teacherId: number) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { teacher: teacherId }
    });
    return response.data;
  },

  getSubjectsBySchool: async (schoolId: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { ...params, school: schoolId }
    });
    return response.data;
  },

  getSubjectsBySchoolCode: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/schools/subjects/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

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
  getTerms: async (params?: any) => {
    const response = await schoolApi.get('/schools/terms/', { params });
    return response.data;
  },

  getTermsBySchool: async (schoolId: string) => {
    const response = await schoolApi.get('/schools/terms/', {
      params: { school: schoolId }
    });
    return response.data;
  },

  createTerm: async (data: any) => {
    const response = await schoolApi.post('/schools/terms/', data);
    return response.data;
  },

  getTerm: async (id: number) => {
    const response = await schoolApi.get(`/schools/terms/${id}/`);
    return response.data;
  },

  updateTerm: async (id: number, data: any) => {
    const response = await schoolApi.put(`/schools/terms/${id}/`, data);
    return response.data;
  },

  deleteTerm: async (id: number) => {
    const response = await schoolApi.delete(`/schools/terms/${id}/`);
    return response.data;
  },

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
  getPlans: async () => {
    const response = await schoolApi.get('/subscriptions/plans/');
    return response.data;
  },

  getPlan: async (id: number) => {
    const response = await schoolApi.get(`/subscriptions/plans/${id}/`);
    return response.data;
  },

  getSubscriptions: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/', { params });
    return response.data;
  },

  createSubscription: async (data: any) => {
    const response = await schoolApi.post('/subscriptions/create/', data);
    return response.data;
  },

  getSubscription: async (id: number) => {
    const response = await schoolApi.get(`/subscriptions/${id}/`);
    return response.data;
  },

  updateSubscription: async (id: number, data: any) => {
    const response = await schoolApi.put(`/subscriptions/${id}/`, data);
    return response.data;
  },

  checkExpiry: async (schoolCode: string) => {
    const response = await schoolApi.get('/subscriptions/check-expiry/', {
      params: { school_code: schoolCode }
    });
    return response.data;
  },

  getPayments: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/payments/', { params });
    return response.data;
  },

  createPayment: async (data: any) => {
    const response = await schoolApi.post('/subscriptions/payments/create/', data);
    return response.data;
  },

  getInvoices: async (params?: any) => {
    const response = await schoolApi.get('/subscriptions/invoices/', { params });
    return response.data;
  },
};

// ============================================
// SYSTEM SERVICES
// ============================================

export const systemService = {
  getSettings: async (params?: any) => {
    const response = await schoolApi.get('/system/settings/', { params });
    return response.data;
  },

  updateSetting: async (id: number, data: any) => {
    const response = await schoolApi.put(`/system/settings/${id}/`, data);
    return response.data;
  },

  bulkUpdateSettings: async (settings: any[]) => {
    const response = await schoolApi.post('/system/settings/bulk-update/', { settings });
    return response.data;
  },

  getActivities: async (params?: any) => {
    const response = await schoolApi.get('/system/activities/', { params });
    return response.data;
  },

  getAlerts: async (params?: any) => {
    const response = await schoolApi.get('/system/alerts/', { params });
    return response.data;
  },

  resolveAlert: async (id: number) => {
    const response = await schoolApi.post(`/system/alerts/${id}/resolve/`);
    return response.data;
  },

  getFeatures: async (params?: any) => {
    const response = await schoolApi.get('/system/features/', { params });
    return response.data;
  },
};

// ============================================
// NOTIFICATION SERVICES
// ============================================

export const notificationService = {
  getNotifications: async (params?: any) => {
    const response = await schoolApi.get('/notifications/', { params });
    return response.data;
  },

  createNotification: async (data: any) => {
    const response = await schoolApi.post('/notifications/create/', data);
    return response.data;
  },

  getNotification: async (id: number) => {
    const response = await schoolApi.get(`/notifications/${id}/`);
    return response.data;
  },

  deleteNotification: async (id: number) => {
    const response = await schoolApi.delete(`/notifications/${id}/`);
    return response.data;
  },

  markAsRead: async (notificationIds?: number[], markAll?: boolean) => {
    const response = await schoolApi.post('/notifications/mark-read/', {
      notification_ids: notificationIds,
      mark_all: markAll
    });
    return response.data;
  },

  getPreferences: async () => {
    const response = await schoolApi.get('/notifications/preferences/');
    return response.data;
  },

  updatePreferences: async (data: any) => {
    const response = await schoolApi.put('/notifications/preferences/', data);
    return response.data;
  },

  getTemplates: async () => {
    const response = await schoolApi.get('/notifications/templates/');
    return response.data;
  },
};

// ============================================
// PAYMENT SERVICES
// ============================================

export const paymentService = {
  getTransactions: async (params?: any) => {
    try {
      const response = await paymentApi.get('/payments/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransactions error:', error);
      throw error;
    }
  },

  getTransaction: async (id: number) => {
    try {
      const response = await paymentApi.get(`/payments/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransaction error:', error);
      throw error;
    }
  },

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

  updateTransaction: async (id: number, data: any) => {
    try {
      const response = await paymentApi.put(`/payments/${id}/update/`, data);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] updateTransaction error:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: number) => {
    try {
      const response = await paymentApi.delete(`/payments/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] deleteTransaction error:', error);
      throw error;
    }
  },

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

  getTransactionStats: async (params?: any) => {
    try {
      const response = await paymentApi.get('/payments/stats/', { params });
      return response.data;
    } catch (error: any) {
      console.error('[paymentService] getTransactionStats error:', error);
      throw error;
    }
  },

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
// RESULT SERVICES - With proper error handling
// ============================================

export const resultService = {
  getResults: async (params?: any) => {
    const response = await schoolApi.get('/report/', { params });
    return response.data;
  },

  getResult: async (id: number) => {
    const response = await schoolApi.get(`/report/${id}/`);
    return response.data;
  },

  createResult: async (data: any) => {
    const response = await schoolApi.post('/report/create/', data);
    return response.data;
  },

  updateResult: async (id: number, data: any) => {
    const response = await schoolApi.put(`/report/${id}/update/`, data);
    return response.data;
  },

  deleteResult: async (id: number) => {
    const response = await schoolApi.delete(`/report/${id}/delete/`);
    return response.data;
  },

  publishResults: async (data: { result_ids: number[]; publish: boolean }) => {
    const response = await schoolApi.post('/report/publish/', data);
    return response.data;
  },

  getSingleResultPDF: async (resultId: number) => {
    try {
      const response = await schoolApi.get(`/report/pdf/single/${resultId}/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('[resultService] getSingleResultPDF error:', error);
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download PDF');
        } catch (e) {
          throw new Error('Failed to download PDF. Please try again.');
        }
      }
      throw error;
    }
  },

  getStudentResultsPDF: async (params: { student_id: number; term_id?: number }) => {
    try {
      const response = await schoolApi.get('/report/pdf/student/', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('[resultService] getStudentResultsPDF error:', error);
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download PDF');
        } catch (e) {
          throw new Error('Failed to download PDF. Please try again.');
        }
      }
      throw error;
    }
  },

  getBulkResultsPDF: async (params: { school_code: string; term_id?: number; student_ids?: string }) => {
    try {
      const response = await schoolApi.get('/report/pdf/bulk/', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('[resultService] getBulkResultsPDF error:', error);
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download PDF');
        } catch (e) {
          throw new Error('Failed to download PDF. Please try again.');
        }
      }
      throw error;
    }
  },

  getBulkResultsExcel: async (params: { school_code: string; term_id?: number; student_ids?: string }) => {
    try {
      const response = await schoolApi.get('/report/excel/bulk/', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('[resultService] getBulkResultsExcel error:', error);
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download Excel');
        } catch (e) {
          throw new Error('Failed to download Excel. Please try again.');
        }
      }
      throw error;
    }
  },

  sendSingleResultEmail: async (data: { result_id: number; email?: string; subject?: string; message?: string }) => {
    const response = await schoolApi.post('/report/email/single/', data);
    return response.data;
  },

  sendBulkResultsEmail: async (data: { 
    school_code: string; 
    term_id?: number; 
    student_ids?: number[]; 
    subject?: string; 
    message?: string 
  }) => {
    const response = await schoolApi.post('/report/email/bulk/', data);
    return response.data;
  },

  getStudentResultSummary: async (params: { student_id: number; term_id?: number }) => {
    const response = await schoolApi.get('/results/summary/', { params });
    return response.data;
  },

  getResultsByStudent: async (studentId: number, termId?: number, schoolCode?: string) => {
    const params: any = { student: studentId };
    if (termId) params.term = termId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  getResultsBySubject: async (subjectId: number, termId?: number, schoolCode?: string) => {
    const params: any = { subject: subjectId };
    if (termId) params.term = termId;
    if (schoolCode) params.school_code = schoolCode;
    const response = await schoolApi.get('/results/', { params });
    return response.data;
  },

  getResultsBySchool: async (schoolCode: string, params?: any) => {
    const response = await schoolApi.get('/results/', {
      params: { ...params, school_code: schoolCode }
    });
    return response.data;
  },

  getResultsBySchoolGrouped: async (schoolCode: string, termId?: number) => {
    const params: any = { school_code: schoolCode };
    if (termId) params.term = termId;
    const response = await schoolApi.get('/results/by-school/', { params });
    return response.data;
  },

  getResultStats: async (params?: any) => {
    const response = await schoolApi.get('/results/stats/', { params });
    return response.data;
  },

  searchResults: async (query: string, params?: any) => {
    const response = await schoolApi.get('/results/search/', {
      params: { ...params, q: query }
    });
    return response.data;
  },

  bulkCreateResults: async (data: any[]) => {
    const response = await schoolApi.post('/results/bulk-create/', data);
    return response.data;
  },

  getStudentStatistics: async (studentId: number) => {
    const response = await schoolApi.get(`/results/student/${studentId}/statistics/`);
    return response.data;
  },

  getResultSummaries: async (params?: any) => {
    const response = await schoolApi.get('/results/summaries/', { params });
    return response.data;
  },
};

// ============================================
// AUTH SERVICES
// ============================================

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/login/`, {
      username,
      password
    });
    return response.data;
  },

  register: async (data: any) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/register/`, data);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/refresh/`, {
      refresh: refreshToken
    });
    return response.data;
  },

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

  getProfile: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_BASE_URL}/accounts/profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  updateProfile: async (data: any) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.put(`${API_BASE_URL}/accounts/profile/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/request/`, {
      email
    });
    return response.data;
  },

  confirmPasswordReset: async (data: { token: string; new_password: string; confirm_password: string }) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/password-reset/confirm/`, data);
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/verify-email/`, {
      params: { token }
    });
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/accounts/resend-verification/`, {
      email
    });
    return response.data;
  },

  getActivityLogs: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_BASE_URL}/accounts/activity-logs/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  checkVerificationStatus: async (email: string) => {
    const response = await axios.get(`${API_BASE_URL}/accounts/check-verification-status/`, {
      params: { email }
    });
    return response.data;
  },
};

export default schoolApi;