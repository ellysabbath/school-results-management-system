// src/pages/About.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  School,
  LayoutDashboard, 
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  UserPlus2Icon,
  Award,
  BarChart3,
  FileText,
  Users,
  BookOpen,
  Smartphone,
  Lock,
  TrendingUp,
  Calendar,
  ClipboardList,
  Star
} from 'lucide-react';

const About: React.FC = () => {
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

      {/* About Section */}
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <School className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">About Our System</h1>
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-600 text-lg">
                The Results Management System is a modern solution for managing student results 
                in secondary schools across Tanzania. This system has been developed with careful 
                consideration of the needs of schools and the Tanzanian education system.
              </p>
              
              {/* Mission & Vision */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    Our Mission
                  </h3>
                  <p className="text-gray-600 text-sm">
                    To provide schools with an efficient, reliable, and user-friendly system 
                    for managing student results and improving educational outcomes.
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Our Vision
                  </h3>
                  <p className="text-gray-600 text-sm">
                    To become the leading results management platform in Tanzania, 
                    empowering schools with data-driven insights for student success.
                  </p>
                </div>
              </div>

              {/* Key Features */}
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Key Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Student management with detailed records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Calculate Division (I, II, III, IV, 0)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Statistics dashboard and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Individual student reports</span>
                  </li>
                </ul>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Full class performance reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Secure data storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>SMS notifications for parents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>PDF and Excel report export</span>
                  </li>
                </ul>
              </div>

              {/* Grading System */}
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Tanzania Grading System
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2 px-3 font-semibold">Marks (%)</th>
                      <th className="text-left py-2 px-3 font-semibold">Grade</th>
                      <th className="text-left py-2 px-3 font-semibold">Points</th>
                      <th className="text-left py-2 px-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">80-100</td>
                      <td className="py-2 px-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">A</span></td>
                      <td className="py-2 px-3">1</td>
                      <td className="py-2 px-3 text-gray-600">Excellent</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">70-79</td>
                      <td className="py-2 px-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">B</span></td>
                      <td className="py-2 px-3">2</td>
                      <td className="py-2 px-3 text-gray-600">Very Good</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">60-69</td>
                      <td className="py-2 px-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">C</span></td>
                      <td className="py-2 px-3">3</td>
                      <td className="py-2 px-3 text-gray-600">Good</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">50-59</td>
                      <td className="py-2 px-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">D</span></td>
                      <td className="py-2 px-3">4</td>
                      <td className="py-2 px-3 text-gray-600">Satisfactory</td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">40-49</td>
                      <td className="py-2 px-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">E</span></td>
                      <td className="py-2 px-3">5</td>
                      <td className="py-2 px-3 text-gray-600">Pass</td>
                    </tr>
                    <tr className="hover:bg-blue-50 transition">
                      <td className="py-2 px-3 font-medium">0-39</td>
                      <td className="py-2 px-3"><span className="bg-red-200 text-red-800 px-2 py-0.5 rounded">F</span></td>
                      <td className="py-2 px-3">7</td>
                      <td className="py-2 px-3 text-gray-600">Fail</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Why Choose Us */}
              <div className="pt-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  Why Choose Us
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <School className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Tanzania Focused</h4>
                    <p className="text-gray-500 text-xs">Built specifically for Tanzanian schools</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Mobile Ready</h4>
                    <p className="text-gray-500 text-xs">Access results from any device</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Lock className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Secure & Reliable</h4>
                    <p className="text-gray-500 text-xs">Your data is safe and protected</p>
                  </div>
                </div>
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

export default About;