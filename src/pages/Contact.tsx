// src/pages/Contact.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin, Send, CheckCircle, GraduationCap, LayoutDashboard, UserPlus2Icon } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
        <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">Mfumo wa Matokeo</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition">Nyumbani</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition">Kuhusu</Link>
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition">Vipengele</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition">Bei</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition">Wasiliana</Link>
              <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Ingia
              </Link>
                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <UserPlus2Icon className="w-4 h-4" />
                sajili hapa
              </Link>
            </div>
          </div>
        </div>
      </nav>

    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Wasiliana Nasi
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 mb-6">
                Tupatie ujumbe wako na tutakujibu haraka iwezekanavyo.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Barua Pepe</p>
                    <p className="font-medium">info@mfumo.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Simu</p>
                    <p className="font-medium">+255 712 345 678</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Anwani</p>
                    <p className="font-medium">Dar es Salaam, Tanzania</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Tuungane kwenye Mitandao</p>
             
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Ujumbe Wewe Umetumwa!</h3>
                  <p className="text-gray-600 text-sm">Tutakujibu hivi karibuni.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jina Kamili</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Jina lako"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barua Pepe</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="mfano@shule.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mada</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Mada ya ujumbe"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ujumbe</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="Andika ujumbe wako hapa..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Tuma Ujumbe
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Home className="w-4 h-4" />
              Rudi Mwanzo
            </Link>
          </div>
        </div>
      </div>
    </div>
    

      {/* Contact/Footer Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold">Mfumo wa Matokeo</span>
              </div>
              <p className="text-gray-400 text-sm">Mfumo wa kisasa wa kusimamia matokeo ya shule za sekondari Tanzania.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Viungo</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition">Nyumbani</Link></li>
                <li><Link to="/about" className="hover:text-white transition">Kuhusu</Link></li>
                <li><Link to="/features" className="hover:text-white transition">Vipengele</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition">Bei</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Msaada</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/contact" className="hover:text-white transition">Wasiliana</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">Maswali</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Sera ya Faragha</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Wasiliana</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@mfumo.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +255 712 345 678</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dar es Salaam, Tanzania</li>
              </ul>
             
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Mfumo wa Matokeo - Shule za Sekondari Tanzania. Haki zote zimehifadhiwa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;