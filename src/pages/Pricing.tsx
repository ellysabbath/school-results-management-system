// src/pages/Pricing.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, CreditCard, Zap, Mail, Phone, MapPin, GraduationCap, LayoutDashboard, UserPlus } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Basic',
      price: '15,000',
      features: ['50 Students', '5 Classes', 'Basic Reports', 'Email Support'],
      recommended: false
    },
    {
      name: 'Premium',
      price: '35,000',
      features: ['200 Students', '15 Classes', 'Detailed Reports', 'PDF Export', 'SMS Notifications', 'Phone Support'],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: '75,000',
      features: ['Unlimited Students', 'Unlimited Classes', 'Detailed Reports', 'PDF Export', 'SMS Notifications', 'API Access', '24/7 Support'],
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">SchoolManager</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition">Home</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition">About</Link>
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition">Contact</Link>
              <Link to="/results" className="text-blue-600 font-medium hover:text-blue-700 transition">Results</Link>
              <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                Pricing Plans
              </h1>
              <p className="text-gray-600 mt-2">Choose the plan that fits your school</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl p-6 ${
                    plan.recommended 
                      ? 'border-2 border-blue-500 bg-blue-50' 
                      : 'border border-gray-200 bg-white'
                  }`}
                >
                  {plan.recommended && (
                    <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-4">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold text-blue-600">Tsh {plan.price}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/payment"
                    className={`block text-center py-2 rounded-lg transition ${
                      plan.recommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Choose
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t flex gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold">SchoolManager</span>
              </div>
              <p className="text-gray-400 text-sm">Modern school management system for secondary schools in Tanzania.</p>
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
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@schoolmanager.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +255 712 345 678</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dar es Salaam, Tanzania</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 SchoolManager - Secondary School Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;