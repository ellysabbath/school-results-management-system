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
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  LayoutDashboard,
  UserPlus2Icon
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Usimamizi wa Wanafunzi',
      description: 'Weka na usimamie wanafunzi wote kwa urahisi. Rekodi maelezo yao, alama, na maendeleo.'
    },
    {
      icon: BarChart3,
      title: 'Uchambuzi wa Matokeo',
      description: 'Chambua matokeo kwa kina, uone mitazamo ya ufaulu na maeneo yanayohitaji uboreshaji.'
    },
    {
      icon: FileText,
      title: 'Ripoti za Kina',
      description: 'Pata ripoti za mwanafunzi mmoja mmoja na ripoti za darasa zima kwa urahisi.'
    },
    {
      icon: Award,
      title: 'Mfumo wa Grading',
      description: 'Mfumo wa grading unaofuata viwango vya Tanzania (A-F) na kuhesabu Division.'
    },
    {
      icon: Bell,
      title: 'Arifa za SMS',
      description: 'Tuma matokeo na taarifa muhimu kwa wazazi kupitia SMS moja kwa moja.'
    },
    {
      icon: Shield,
      title: 'Usalama wa Data',
      description: 'Data yote imehifadhiwa salama kwa kutumia localStorage na encryption.'
    },
    {
      icon: Zap,
      title: 'Kasi na Ufanisi',
      description: 'Mfumo wa kisasa unaohakikisha kasi na ufanisi katika usimamizi wa matokeo.'
    },
    {
      icon: GraduationCap,
      title: 'Inafaa Shule zote',
      description: 'Inafaa kwa shule za sekondari zote nchini Tanzania, kubwa na ndogo.'
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Vipengele vya Mfumo
          </h1>
          <p className="text-gray-600 mb-8">
            Mfumo wa Matokeo unakupa zana zote unazohitaji kusimamia matokeo kwa ufanisi.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t flex gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Home className="w-4 h-4" />
              Rudi Mwanzo
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Jaribu Sasa
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

export default Features;





