import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';



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

const App: React.FC = () => {
  // Mock user for sidebar display
  const mockUser = {
    id: 'u1',
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@system.com',
    role: 'super_admin',
    schoolId: '1',
    phone: '+1-555-123-4567',
  };
  localStorage.setItem('user', JSON.stringify(mockUser));

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
              PUBLIC ROUTES (No Layout)
              ========================================== */}
          
          {/* Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* About Page */}
          <Route path="/about" element={<About />} />
          
          {/* Contact Page */}
          <Route path="/contact" element={<Contact />} />
         <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register-school" element={<RegisterSchool />} />
          
          {/* Billing/Pricing Page */}
          <Route path="/pricing" element={<Pricing />} />
           {/* Billing/Pricing Page */}
          
          {/* ==========================================
              AUTH ROUTES
              ========================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/features" element={<Features />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* ==========================================
              DASHBOARD ROUTES - WITH LAYOUT
              ========================================== */}
          
          {/* Root - Super Admin Dashboard */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <SuperAdminDashboard />
              </Layout>
            }
          />
          
          {/* School Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <Layout>
                <AdminDashboard />
              </Layout>
            }
          />
          
          {/* Teacher Dashboard */}
          <Route
            path="/teacher-dashboard"
            element={
              <Layout>
                <TeacherDashboard />
              </Layout>
            }
          />

          <Route path="/billing" element={
            <Layout>

               <BillingHistory />

            </Layout>
            
           
            
            } />
          
          {/* Student Dashboard */}
          <Route
            path="/student-dashboard"
            element={
              <Layout>
                <StudentDashboard />
              </Layout>
            }
          />
          
          {/* ==========================================
              STUDENT MANAGEMENT ROUTES
              ========================================== */}
          <Route
            path="/students"
            element={
              <Layout>
                <StudentList />
              </Layout>
            }
          />
          
          <Route
            path="/students/new"
            element={
              <Layout>
                <StudentForm />
              </Layout>
            }
          />
          
          <Route
            path="/students/:id"
            element={
              <Layout>
                <StudentDetails />
              </Layout>
            }
          />
          
          <Route
            path="/students/:id/edit"
            element={
              <Layout>
                <StudentForm />
              </Layout>
            }
          />
          
          {/* ==========================================
              TEACHER MANAGEMENT ROUTES
              ========================================== */}
          <Route
            path="/teachers"
            element={
              <Layout>
                <TeacherList />
              </Layout>
            }
          />
          
          <Route
            path="/teachers/new"
            element={
              <Layout>
                <TeacherForm />
              </Layout>
            }
          />
          
          <Route
            path="/teachers/:id/edit"
            element={
              <Layout>
                <TeacherForm />
              </Layout>
            }
          />
          
          {/* ==========================================
              SUBJECT MANAGEMENT ROUTES
              ========================================== */}
          <Route
            path="/subjects"
            element={
              <Layout>
                <SubjectManager />
              </Layout>
            }
          />
          
          {/* ==========================================
              RESULT MANAGEMENT ROUTES
              ========================================== */}
          <Route
            path="/results"
            element={
              <Layout>
                <ResultEntry />
              </Layout>
            }
          />
          
          <Route
            path="/my-results"
            element={
              <Layout>
                <ResultView />
              </Layout>
            }
          />
          
          <Route
            path="/report-card/:studentId"
            element={
              <Layout>
                <ReportCard />
              </Layout>
            }
          />
          
          {/* ==========================================
              ANALYTICS ROUTES
              ========================================== */}
          <Route
            path="/analytics"
            element={
              <Layout>
                <CommonAnalytics />
              </Layout>
            }
          />
          
          {/* ==========================================
              SETTINGS ROUTES
              ========================================== */}
          <Route
            path="/settings"
            element={
              <Layout>
                <SchoolSettings />
              </Layout>
            }
          />
          
          <Route
            path="/settings/profile"
            element={
              <Layout>
                <ProfileSettings />
              </Layout>
            }
          />
          
          {/* ==========================================
              SUPER ADMIN ROUTES
              ========================================== */}
          <Route
            path="/system/settings"
            element={
              <Layout>
                <SystemSettings />
              </Layout>
            }
          />
          
          <Route
            path="/system/schools"
            element={
              <Layout>
                <AllSchools />
              </Layout>
            }
          />
          
          <Route
            path="/system/schools/:id"
            element={
              <Layout>
                <SchoolDetails />
              </Layout>
            }
          />
          
          <Route
            path="/system/analytics"
            element={
              <Layout>
                <SystemAnalytics />
              </Layout>
            }
          />
        </Routes>
        
        {/* Footer - Only shown on public pages */}
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;