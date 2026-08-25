// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/modals/ProtectedRoute';

// Dashboard Pages
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import StudentDashboard from './components/dashboard/StudentDashboard';
import SuperAdminDashboard from './components/dashboard/SuperAdminDashboard';

// Student Pages
import StudentList from './components/students/StudentList';
import StudentForm from './components/students/StudentForm';
import StudentDetails from './components/students/StudentDetails';

// Teacher Pages
import TeacherList from './components/teachers/TeacherList';
import TeacherForm from './components/teachers/TeacherForm';

// Subject Pages
import SubjectManager from './components/subjects/SubjectsManager';

// Result Pages
import ResultEntry from './components/results/ResultEntry';
import ResultView from './components/results/ResultView';
import ReportCard from './components/results/ReportCard';

// Analytics Pages
import CommonAnalytics from './components/analytics/StudentAnalytics';

// Settings Pages
import SchoolSettings from './components/settings/SchoolSettings';
import ProfileSettings from './components/settings/ProfileSettings';

// Super Admin Pages
import SystemSettings from './components/super-admin/SystemSettings';
import AllSchools from './components/super-admin/AllSchools';
import SchoolDetails from './components/super-admin/SchoolDetails';
import SystemAnalytics from './components/super-admin/SystemAnalytics';

// Common
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import Features from './pages/Features';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Footer from './components/Footer';
import BillingHistory from './components/billing/BillingHistory';
import VerifyEmail from './components/auth/VerifyEmail';
import ResetPassword from './components/auth/ResetPassword';
import RegisterSchool from './components/auth/RegisterSchool';
import TermManager from './components/results/TermManager';
import ResultManagement from './components/results/ResultManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import NotificationCenter from './pages/NotificationCenter';
import SubscriptionPlans from './components/billing/SubscriptionPlans';

import PaymentPage from './components/billing/PaymentPage';
import UsersAdmin from './components/super-admin/UsersAdmin';
import ContactManagement from './pages/ContactManagement';
import MyResults from './components/results/MyResults';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* ==========================================
              PUBLIC ROUTES (No Layout, No Auth Required)
              ========================================== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register-school" element={<RegisterSchool />} />

          {/* ==========================================
              PROTECTED ROUTES - WITH LAYOUT
              Using Django role names: super_admin, school_admin, teacher, student, parent
              ========================================== */}
          
          {/* Super Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SuperAdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/system/schools" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <AllSchools />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/system/schools/:id" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SchoolDetails />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/system/analytics" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SystemAnalytics />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/system/settings" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SystemSettings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/manage-users" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <UsersAdmin />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/manage/mails" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <ContactManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/manage-plans" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SubscriptionPlans />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/subscription" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Layout>
                <SubscriptionManagement />
              </Layout>
            </ProtectedRoute>
          } />

          {/* School Admin Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <Layout>
                <StudentList />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/students/new" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <StudentForm />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/students/:id" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <Layout>
                <StudentDetails />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/students/:id/edit" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <StudentForm />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/teachers" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <TeacherList />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/teachers/new" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <TeacherForm />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/teachers/:id/edit" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <TeacherForm />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/subjects" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <SubjectManager />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/terms" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <TermManager />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['school_admin', 'super_admin']}>
              <Layout>
                <BillingHistory />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/payment" element={
            <ProtectedRoute allowedRoles={['school_admin', 'super_admin']}>
              <Layout>
                <PaymentPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout>
                <TeacherDashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student-dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <StudentDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/student/my-results" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <MyResults />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Parent Routes */}
          <Route path="/parent-dashboard" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <Layout>
                {/* ParentDashboard component would need to be created */}
                <div>Parent Dashboard</div>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Shared Routes (Multiple Roles) */}
          <Route path="/results" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher']}>
              <Layout>
                <ResultEntry />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/view-results" element={
            <ProtectedRoute allowedRoles={['school_admin']}>
              <Layout>
                <ResultManagement />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/my-results" element={
            <ProtectedRoute allowedRoles={['student', 'school_admin', 'teacher', 'parent']}>
              <Layout>
                <ResultView />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/report-card/:studentId" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'parent']}>
              <Layout>
                <ReportCard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'super_admin', 'parent']}>
              <Layout>
                <CommonAnalytics />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'super_admin', 'parent']}>
              <Layout>
                <SchoolSettings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/profile" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'super_admin', 'parent']}>
              <Layout>
                <ProfileSettings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['school_admin', 'teacher', 'student', 'super_admin', 'parent']}>
              <Layout>
                <NotificationCenter />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch-all - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Footer - Only shown on public pages */}
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;