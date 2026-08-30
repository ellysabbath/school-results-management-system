// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  School,
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  Award,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  UserPlus2Icon,
  Smartphone,
  Lock,
  GraduationCap,
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  Tanzania's Leading Platform
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Manage Student Results
                <span className="block text-blue-200">Easily & Efficiently</span>
              </h1>
              <p className="text-blue-100 text-lg mb-8">
                A modern system for managing secondary school results in Tanzania. 
                Get reports, analyze data, and track student progress with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 shadow-lg">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/about" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition flex items-center justify-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Learn More
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm text-blue-200">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 14-Day Free Trial</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No Credit Card Required</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop" 
                  alt="Students studying in classroom"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop" 
                  alt="Students in classroom"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover mt-8"
                />
            
                <img 
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&h=300&fit=crop" 
                  alt="Students with books"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover mt-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">500+</div>
              <p className="text-gray-600">Schools Using Our System</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">10K+</div>
              <p className="text-gray-600">Students Registered</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">98%</div>
              <p className="text-gray-600">Customer Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <p className="text-gray-600">Technical Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">System Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our system provides all the tools you need to manage results effectively
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Student Management</h3>
              <p className="text-gray-600 text-sm">Easily manage and organize all your students</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Result Analytics</h3>
              <p className="text-gray-600 text-sm">Analyze and visualize result trends</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Comprehensive Reports</h3>
              <p className="text-gray-600 text-sm">Generate detailed student and class reports</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Tanzania Grading System</h3>
              <p className="text-gray-600 text-sm">Built-in Tanzania national grading system</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">SMS Notifications</h3>
              <p className="text-gray-600 text-sm">Send results via SMS directly to parents</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Data Security</h3>
              <p className="text-gray-600 text-sm">Your data is safe and securely stored</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Pricing Plans</h2>
            <p className="text-gray-600">Choose the plan that fits your school</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800">Basic</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 15,000</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Up to 50 Students</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Up to 5 Classes</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Basic Reports</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Email Support</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Choose Plan</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Recommended</span>
              <h3 className="text-xl font-bold text-gray-800">Premium</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 35,000</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Up to 200 Students</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Up to 15 Classes</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Detailed Reports</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> PDF Export</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> SMS Notifications</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Phone Support</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Choose Plan</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800">Enterprise</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 75,000</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Students</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Classes</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Detailed Reports</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> PDF Export</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> SMS Notifications</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> API Access</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> 24/7 Support</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Choose Plan</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">What Schools Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from schools that are already using our system
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-3">
                "This system has transformed how we manage student results. The reports are detailed and easy to understand."
              </p>
              <p className="font-semibold text-gray-800 text-sm">John M.</p>
              <p className="text-gray-500 text-xs">Head Teacher, Dar es Salaam</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-3">
                "The SMS notification feature is amazing. Parents receive results immediately and we've seen improved engagement."
              </p>
              <p className="font-semibold text-gray-800 text-sm">Sarah K.</p>
              <p className="text-gray-500 text-xs">School Administrator, Arusha</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-3">
                "Excellent support team and the system is very user-friendly. Highly recommended for any school."
              </p>
              <p className="font-semibold text-gray-800 text-sm">David M.</p>
              <p className="text-gray-500 text-xs">Principal, Mwanza</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Footer Section */}
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

export default Home;