// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  Award,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Mail,
  Phone,
  MapPin,
  PlusIcon,
  PersonStanding,
  UserPlus2Icon,

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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold">
                   Mfumo Bora Tanzania
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Simamia Matokeo ya Wanafunzi
                <span className="block text-blue-200">Kwa Urahisi na Ufanisi</span>
              </h1>
              <p className="text-blue-100 text-lg mb-8">
                Mfumo wa kisasa wa kusimamia matokeo ya shule za sekondari Tanzania. 
                Pata ripoti, chambua data, na fuata maendeleo ya wanafunzi kwa urahisi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 shadow-lg">
                  Anza Sasa <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/about" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition flex items-center justify-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Maelezo Zaidi
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm text-blue-200">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Bila Malipo Siku 14</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Hakuna Kadi Inayohitajika</span>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop" 
                  alt="Students studying"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop" 
                  alt="Students in classroom"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover mt-8"
                />
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=400&h=300&fit=crop" 
                  alt="Graduation"
                  className="rounded-xl shadow-2xl w-full h-48 object-cover -mt-4"
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
              <p className="text-gray-600">Shule Zinazotumia</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">10K+</div>
              <p className="text-gray-600">Wanafunzi Wamesajiliwa</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">98%</div>
              <p className="text-gray-600">Kuridhika kwa Wateja</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <p className="text-gray-600">Msaada wa Kiufundi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Vipengele vya Mfumo</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Mfumo wetu unakupa zana zote unazohitaji kusimamia matokeo kwa ufanisi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Usimamizi wa Wanafunzi</h3>
              <p className="text-gray-600 text-sm">Weka na usimamie wanafunzi wote kwa urahisi</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Uchambuzi wa Matokeo</h3>
              <p className="text-gray-600 text-sm">Chambua na uone mitazamo ya matokeo</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Ripoti za Kina</h3>
              <p className="text-gray-600 text-sm">Pata ripoti za wanafunzi na darasa</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mfumo wa Grading</h3>
              <p className="text-gray-600 text-sm">Mfumo wa grading wa Tanzania</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Arifa za SMS</h3>
              <p className="text-gray-600 text-sm">Tuma matokeo kwa SMS moja kwa moja</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Usalama wa Data</h3>
              <p className="text-gray-600 text-sm">Data yako iko salama na imehifadhiwa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bei na Mpango</h2>
            <p className="text-gray-600">Chagua mpango unaofaa shule yako</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800">Basic</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 15,000</span>
                <span className="text-gray-500">/mwezi</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Wanafunzi 50</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Madarasa 5</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Ripoti za Msingi</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Msaada wa Email</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Chagua</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Inapendekezwa</span>
              <h3 className="text-xl font-bold text-gray-800">Premium</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 35,000</span>
                <span className="text-gray-500">/mwezi</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Wanafunzi 200</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Madarasa 15</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Ripoti za Kina</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Export PDF</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Arifa za SMS</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Msaada wa Simu</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Chagua</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800">Enterprise</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-blue-600">Tsh 75,000</span>
                <span className="text-gray-500">/mwezi</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Wanafunzi Unlimited</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Madarasa Unlimited</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Ripoti za Kina</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Export PDF</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Arifa za SMS</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> API Access</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Msaada wa 24/7</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Chagua</Link>
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

export default Home;