// src/pages/Features.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Award, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle,
  School,
  Mail,
  Phone,
  MapPin,
  LayoutDashboard,
  UserPlus2Icon,
  Smartphone,
  Lock,
  TrendingUp,
  BookOpen,
  ClipboardList,
  Star,
  Clock,
  Headphones
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Easily manage and organize all students. Record their details, marks, and track progress over time.'
    },
    {
      icon: BarChart3,
      title: 'Result Analytics',
      description: 'Deep analysis of results, identify performance trends and areas that need improvement.'
    },
    {
      icon: FileText,
      title: 'Comprehensive Reports',
      description: 'Generate detailed individual student reports and full class performance reports with ease.'
    },
    {
      icon: Award,
      title: 'Tanzania Grading System',
      description: 'Built-in grading system following Tanzanian standards (A-F) with automatic Division calculation.'
    },
    {
      icon: Bell,
      title: 'SMS Notifications',
      description: 'Send results and important information to parents directly via SMS notifications.'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'All data is securely stored using local storage with encryption for maximum protection.'
    },
    {
      icon: Zap,
      title: 'Speed & Efficiency',
      description: 'Modern system ensuring speed and efficiency in results management and processing.'
    },
    {
      icon: School,
      title: 'All Schools Ready',
      description: 'Suitable for all secondary schools across Tanzania, both large and small institutions.'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Improved Performance',
      description: 'Track and improve student performance with data-driven insights'
    },
    {
      icon: Clock,
      title: 'Time Saving',
      description: 'Automate result processing and reduce manual work significantly'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support team available around the clock to assist you'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <School className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">Results Management System</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition">About</Link>
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition">Contact</Link>
              <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <UserPlus2Icon className="w-4 h-4" />
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Features Section */}
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                System Features
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The Results Management System provides all the tools you need to 
                manage student results effectively and efficiently.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition border border-gray-100 hover:border-blue-200 group">
                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Benefits Section */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Why Choose Our System?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800">{benefit.title}</h4>
                      <p className="text-gray-500 text-sm mt-1">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 pt-6 border-t flex flex-wrap gap-4 items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition font-medium"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <div className="flex gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-5 py-2 rounded-lg hover:bg-blue-50 transition"
                >
                  View Pricing
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <School className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold">Results Management System</span>
              </div>
              <p className="text-gray-400 text-sm">A modern system for managing secondary school results in Tanzania.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@resultsms.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +255 712 345 678</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dar es Salaam, Tanzania</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Results Management System - Secondary Schools Tanzania. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;