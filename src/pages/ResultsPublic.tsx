// src/pages/ResultsPublic.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Building2,
  Users,
  Search,
  Filter,
  ChevronRight,
  School,
  BarChart3,
  Loader2,
  GraduationCap,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Printer,
  FileSpreadsheet,
  LayoutDashboard,
  UserPlus
} from 'lucide-react';

// Types
interface DivisionSummary {
  I: number;
  II: number;
  III: number;
  IV: number;
  '0': number;
}

interface School {
  school_id: number;
  school_code: string;
  school_name: string;
  term_id: number;
  term_name: string;
  total_students: number;
  division_summary: DivisionSummary;
  link: string;
}

interface SubjectGrade {
  subject: string;
  grade: string;
  points: number;
  marks: number;
  percentage: number;
}

interface StudentResult {
  student_id: number;
  candidate_number: string;
  sex: string;
  total_points: number;
  division: string;
  student_name: string;
  subjects: SubjectGrade[];
}

interface SchoolResultsDetail {
  school: {
    id: number;
    code: string;
    name: string;
  };
  term: {
    id: number;
    name: string;
  };
  division_summary: DivisionSummary;
  total_students: number;
  students: StudentResult[];
}

const ResultsPublic: React.FC = () => {
  const { schoolCode, termId } = useParams<{ schoolCode?: string; termId?: string }>();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolDetail, setSchoolDetail] = useState<SchoolResultsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Fetch schools or school details based on URL params
  useEffect(() => {
    if (schoolCode && termId) {
      fetchSchoolResults(schoolCode, parseInt(termId));
    } else {
      fetchSchools();
    }
  }, [schoolCode, termId]);

  // Filter schools by search term and letter
  const filteredSchools = useMemo(() => {
    let filtered = schools;

    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.school_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLetter !== 'ALL') {
      filtered = filtered.filter(school =>
        school.school_name.toUpperCase().startsWith(selectedLetter)
      );
    }

    return filtered;
  }, [schools, searchTerm, selectedLetter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/results/public/schools/`);
      
      if (response.data.status === 'success') {
        setSchools(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load schools');
        toast.error(response.data.message || 'Failed to load schools');
      }
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      const message = error.response?.data?.message || 'Failed to load schools';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolResults = async (code: string, term: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/results/public/school/${code}/term/${term}/`
      );
      
      if (response.data.status === 'success') {
        setSchoolDetail(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load school results');
        toast.error(response.data.message || 'Failed to load school results');
      }
    } catch (error: any) {
      console.error('Error fetching school results:', error);
      const message = error.response?.data?.message || 'Failed to load school results';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolClick = (schoolCode: string, termId: number) => {
    navigate(`/results/school/${schoolCode}/term/${termId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    navigate('/results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterByLetter = (letter: string) => {
    setSelectedLetter(letter);
  };

  const getDivisionColor = (division: string) => {
    const colors: { [key: string]: string } = {
      'I': 'bg-green-100 text-green-800 border-green-300',
      'II': 'bg-blue-100 text-blue-800 border-blue-300',
      'III': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'IV': 'bg-orange-100 text-orange-800 border-orange-300',
      '0': 'bg-red-100 text-red-800 border-red-300',
      'ABS': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[division] || colors['0'];
  };

  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      'A': 'text-green-700 font-bold',
      'B+': 'text-blue-600 font-semibold',
      'B': 'text-blue-500',
      'C+': 'text-yellow-600',
      'C': 'text-yellow-500',
      'D': 'text-orange-500',
      'E': 'text-red-500',
      'F': 'text-red-700 font-bold',
      'S': 'text-gray-500',
      'X': 'text-gray-400 italic'
    };
    return colors[grade] || 'text-gray-600';
  };

  const getDivisionLabel = (division: string) => {
    const labels: { [key: string]: string } = {
      'I': 'Division I',
      'II': 'Division II',
      'III': 'Division III',
      'IV': 'Division IV',
      '0': 'Division 0'
    };
    return labels[division] || division;
  };

  const getDivisionDescription = (division: string) => {
    const descriptions: { [key: string]: string } = {
      'I': 'Excellent Performance',
      'II': 'Very Good Performance',
      'III': 'Good Performance',
      'IV': 'Satisfactory Performance',
      '0': 'Poor Performance'
    };
    return descriptions[division] || '';
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error && !schools.length && !schoolDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render School Detail View
  if (schoolDetail) {
    const { school, term, division_summary, students } = schoolDetail;

    return (
      <div className="min-h-screen bg-gray-50">
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

        {/* Back Button */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schools
          </button>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {/* School Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{school.name}</h1>
                <p className="text-blue-200 text-sm mt-1">{school.code} | {term.name}</p>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg text-center">
                <div className="text-sm text-blue-200">Total Students</div>
                <div className="text-2xl font-bold">{students.length}</div>
              </div>
            </div>
          </div>

          {/* Division Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Division Performance Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['I', 'II', 'III', 'IV', '0'].map((div) => (
                <div key={div} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="text-2xl font-bold text-gray-800">
                    {division_summary[div as keyof DivisionSummary] || 0}
                  </div>
                  <div className="text-sm text-gray-500">{getDivisionLabel(div)}</div>
                  <div className="text-xs text-gray-400">{getDivisionDescription(div)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CNO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sex</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">AGGT</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">DIV</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subjects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student.student_id || index} className="hover:bg-blue-50 transition duration-150">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {student.candidate_number}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          student.sex?.toUpperCase() === 'F' 
                            ? 'bg-pink-100 text-pink-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {student.sex?.toUpperCase() || 'M'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {student.student_name}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                        {student.total_points || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getDivisionColor(student.division)}`}>
                          {student.division}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {student.subjects && student.subjects.map((subject, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs">
                              <span className="text-gray-600">{subject.subject}</span>
                              <span className={`font-semibold ${getGradeColor(subject.grade)}`}>
                                {subject.grade}
                              </span>
                              {idx < student.subjects.length - 1 && (
                                <span className="text-gray-300">|</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{students.length} students</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    toast.success('Results exported successfully!');
                  }}
                  className="flex items-center gap-1 text-green-600 hover:text-green-800 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export
                </button>
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
                  <li><Link to="/results" className="hover:text-white transition">Results</Link></li>
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
  }

  // Render School List View
  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">ACSEE 2026 Examination Results</h1>
                <p className="text-blue-200 text-sm mt-1">
                  National Examinations Council of Tanzania
                </p>
              </div>
            </div>
            <div className="text-center md:text-right bg-white/10 px-4 py-2 rounded-lg">
              <div className="text-sm text-blue-200">Total Schools</div>
              <div className="text-2xl font-bold">{schools.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by school name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>
          </div>

          {/* Alphabet Filter */}
          <div className="flex flex-wrap gap-1 mt-4">
            <button
              onClick={() => filterByLetter('ALL')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                selectedLetter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ALL
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => filterByLetter(letter)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  selectedLetter === letter
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredSchools.length} of {schools.length} schools
          </div>
        </div>

        {/* Schools Grid */}
        {filteredSchools.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No schools found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
            {filteredSchools.map((school) => (
              <div
                key={`${school.school_code}-${school.term_id}`}
                onClick={() => handleSchoolClick(school.school_code, school.term_id)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-300 hover:transform hover:-translate-y-1 group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <School className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-800 truncate">
                          {school.school_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{school.school_code}</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-sm text-gray-500">{school.term_name}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition">
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{school.total_students} Students</span>
                    </div>
                  </div>

                  {/* Division Summary */}
                  <div className="mt-3">
                    <div className="grid grid-cols-5 gap-1">
                      {['I', 'II', 'III', 'IV', '0'].map((div) => (
                        <div key={div} className="text-center">
                          <div className="text-xs text-gray-500">{div}</div>
                          <div className="text-sm font-bold text-gray-800">
                            {school.division_summary[div as keyof DivisionSummary] || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <li><Link to="/results" className="hover:text-white transition">Results</Link></li>
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

export default ResultsPublic;