

// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  LayoutDashboard, 

  CheckCircle,

  Mail,
  Phone,
  MapPin,
  UserPlus2Icon,

} from 'lucide-react';
import Home from './Home';

const About: React.FC = () => {
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




      {/* ABOUT      SPECIFIC   ABOUT     */}
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Kuhusu Mfumo</h1>
          </div>
          
          <div className="space-y-6">
            <p className="text-gray-600">
              Mfumo wa Matokeo ni suluhisho la kisasa la kusimamia matokeo ya wanafunzi 
              katika shule za sekondari Tanzania. Mfumo huu umebuniwa kwa kuzingatia 
              mahitaji ya shule na mfumo wa elimu wa Tanzania.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800">Vipengele</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Usimamizi wa wanafunzi na alama zao</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Kuhesabu Division (I, II, III, IV, 0)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Dashboard ya takwimu na uchambuzi</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Ripoti za mwanafunzi mmoja mmoja</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Ripoti za darasa zima</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Uhifadhi wa data kwenye localStorage</span>
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-800">Mfumo wa Grading</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Alama</th>
                    <th className="text-left py-2">Gredi</th>
                    <th className="text-left py-2">Pointi</th>
                    <th className="text-left py-2">Maoni</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="py-1">80-100</td><td>A</td><td>1</td><td>Excellent</td></tr>
                  <tr><td className="py-1">70-79</td><td>B</td><td>2</td><td>Very Good</td></tr>
                  <tr><td className="py-1">60-69</td><td>C</td><td>3</td><td>Good</td></tr>
                  <tr><td className="py-1">50-59</td><td>D</td><td>4</td><td>Satisfactory</td></tr>
                  <tr><td className="py-1">40-49</td><td>E</td><td>5</td><td>Pass</td></tr>
                  <tr><td className="py-1">0-39</td><td>F</td><td>7</td><td>Fail</td></tr>
                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t">
          
            </div>
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

export default About;