// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const userRole = user?.role || 'guest';
    
    // Check if user's role matches any allowed role
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'super_admin') {
        return <Navigate to="/dashboard" replace />;
      } else if (userRole === 'admin') {
        return <Navigate to="/admin-dashboard" replace />;
      } else if (userRole === 'teacher') {
        return <Navigate to="/teacher-dashboard" replace />;
      } else if (userRole === 'student') {
        return <Navigate to="/student-dashboard" replace />;
      }
      
      // Fallback - redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
};

export default ProtectedRoute;