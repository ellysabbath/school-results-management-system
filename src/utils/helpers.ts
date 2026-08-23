import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

export const getDaysRemaining = (targetDate: string): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return re.test(phone);
};

// ============================================
// COLOR HELPER FUNCTIONS
// ============================================

export const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-700',
    'A': 'bg-green-50 text-green-600',
    'A-': 'bg-green-50 text-green-600',
    'B+': 'bg-blue-50 text-blue-600',
    'B': 'bg-blue-50 text-blue-600',
    'B-': 'bg-blue-50 text-blue-600',
    'C+': 'bg-yellow-50 text-yellow-600',
    'C': 'bg-yellow-50 text-yellow-600',
    'C-': 'bg-yellow-50 text-yellow-600',
    'D+': 'bg-orange-50 text-orange-600',
    'D': 'bg-orange-50 text-orange-600',
    'F': 'bg-red-50 text-red-600',
  };
  return colors[grade] || 'bg-secondary-50 text-secondary-600';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'active': 'bg-green-50 text-green-600',
    'expired': 'bg-red-50 text-red-600',
    'suspended': 'bg-yellow-50 text-yellow-600',
    'paid': 'bg-green-50 text-green-600',
    'pending': 'bg-yellow-50 text-yellow-600',
    'failed': 'bg-red-50 text-red-600',
    'refunded': 'bg-gray-50 text-gray-600',
    'cancelled': 'bg-gray-50 text-gray-600',
    'trial': 'bg-blue-50 text-blue-600',
  };
  return colors[status] || 'bg-secondary-50 text-secondary-600';
};

export const getPlanColor = (plan: string): string => {
  const colors: Record<string, string> = {
    'trial': 'bg-blue-50 text-blue-600',
    'starter': 'bg-green-50 text-green-600',
    'professional': 'bg-purple-50 text-purple-600',
    'enterprise': 'bg-yellow-50 text-yellow-600',
  };
  return colors[plan] || 'bg-secondary-50 text-secondary-600';
};

export const getPlanLabel = (plan: string): string => {
  const labels: Record<string, string> = {
    'trial': 'Trial',
    'starter': 'Starter',
    'professional': 'Professional',
    'enterprise': 'Enterprise',
  };
  return labels[plan] || plan;
};

// ============================================
// FORMATTING HELPERS
// ============================================

export const formatTime = (date: string): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
};

// ============================================
// NUMBER HELPERS
// ============================================

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// ============================================
// STRING HELPERS
// ============================================

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
};

// ============================================
// ARRAY HELPERS
// ============================================

export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((acc, item) => {
    const groupKey = key(item);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// ============================================
// FILE HELPERS
// ============================================

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || '';
};

export const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============================================
// VALIDATION HELPERS
// ============================================

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ============================================
// THEME HELPERS
// ============================================

export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'expired': 'bg-red-100 text-red-800',
    'suspended': 'bg-yellow-100 text-yellow-800',
    'trial': 'bg-blue-100 text-blue-800',
    'starter': 'bg-green-100 text-green-800',
    'professional': 'bg-purple-100 text-purple-800',
    'enterprise': 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPlanBadgeColor = (plan: string): string => {
  const colors: Record<string, string> = {
    'trial': 'bg-blue-100 text-blue-800',
    'starter': 'bg-green-100 text-green-800',
    'professional': 'bg-purple-100 text-purple-800',
    'enterprise': 'bg-yellow-100 text-yellow-800',
  };
  return colors[plan] || 'bg-gray-100 text-gray-800';
};