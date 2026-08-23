// ============================================
// USER & AUTH TYPES
// ============================================
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  schoolId: string;
  avatar?: string;
  phone?: string;
}

// ============================================
// SCHOOL / TENANT TYPES
// ============================================
export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  subscription: {
    plan: 'trial' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'expired' | 'suspended';
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalResults: number;
  };
}

export interface SchoolWithDetails extends School {
  adminName: string;
  adminEmail: string;
  createdAt: string;
  lastActive: string;
  usage: {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalResults: number;
  };
}

// ============================================
// STUDENT TYPES
// ============================================
export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  class: string;
  section?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  enrollmentDate: string;
  avatar?: string;
}

// ============================================
// TEACHER TYPES
// ============================================
export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  qualification: string;
  joiningDate: string;
  phone: string;
  subjects: string[];
}

// ============================================
// SUBJECT TYPES
// ============================================
export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  maxMarks: number;
  passingMarks: number;
  teacherId: string;
  teacherName: string;
  class: string;
}

// ============================================
// RESULT TYPES
// ============================================
export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  term: string;
  examType: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  teacherRemarks?: string;
  isPublished: boolean;
  publishedAt?: string;
}

// ============================================
// ACADEMIC TERM TYPES
// ============================================
export interface AcademicTerm {
  id: string;
  name: string;
  code: string;
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// ============================================
// SUBSCRIPTION & BILLING TYPES
// ============================================
export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  studentLimit: number;
  teacherLimit: number;
  storage: number;
  isPopular?: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId: string;
  date: string;
  description: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

// ============================================
// BREADCRUMB TYPES
// ============================================
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// ============================================
// SUPER ADMIN / SYSTEM TYPES
// ============================================

export interface SystemStats {
  totalSchools: number;
  activeSchools: number;
  expiredSchools: number;
  suspendedSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  growthRate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

export interface SystemActivity {
  id: string;
  type: 'school_registered' | 'subscription_activated' | 'subscription_expired' | 'payment_received' | 'school_suspended' | 'school_reactivated';
  schoolName: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  schoolId?: string;
  isResolved: boolean;
}

export interface TopPerformingSchool {
  schoolId: string;
  schoolName: string;
  plan: string;
  studentCount: number;
  revenue: number;
  growth: number;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultTrialDays: number;
  currency: string;
  paymentGateway: 'stripe' | 'paypal' | 'both';
  emailSettings: {
    fromEmail: string;
    fromName: string;
    smtpHost: string;
    smtpPort: number;
  };
  notifications: {
    newRegistration: boolean;
    paymentSuccess: boolean;
    paymentFailure: boolean;
    subscriptionExpiry: boolean;
  };
}

// ============================================
// HELPER FUNCTIONS TYPES (for mock data)
// ============================================
export type PlanColorMap = {
  [key: string]: string;
};

export type StatusColorMap = {
  [key: string]: string;
};

export type GradeColorMap = {
  [key: string]: string;
};