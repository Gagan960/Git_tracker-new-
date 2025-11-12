import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Code, Database, Linkedin, Github, Mail } from 'lucide-react';
import { sections } from '../data/students';

const Home = () => {
  const navigate = useNavigate();

  const sectionCards = [
    {
      id: 'elce',
      title: 'ELCE',
      subtitle: 'Section A',
      icon: GraduationCap,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      studentCount: sections.elce.students.length
    },
    {
      id: 'cse-ds',
      title: 'CSE_DS',
      subtitle: 'Section C',
      icon: Database,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      studentCount: sections['cse-ds'].students.length
    },
    {
      id: 'cs',
      title: 'CS',
      subtitle: 'Section C',
      icon: Code,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      studentCount: sections.cs.students.length
    },
    {
      id: 'it-d',
      title: 'IT',
      subtitle: 'Section D',
      icon: Users,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      studentCount: sections['it-d'].students.length
    },
    {
      id: 'it-e',
      title: 'IT',
      subtitle: 'Section E',
      icon: Users,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      studentCount: sections['it-e'].students.length
    }
  ];

  const handleSectionClick = (sectionId) => {
    navigate(`/section/${sectionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-fade-in">
              GitHub Repository Tracker
            </h1>
            <p className="text-lg text-gray-300">
              Monitor student GitHub activity and repository statistics in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Select Your Section
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Choose a section to view student repository statistics, commit counts, and GitHub activity.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-20">
          {sectionCards.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className="group relative overflow-hidden rounded-2xl p-8 cursor-pointer transform transition-all duration-500 hover:scale-110 hover:shadow-2xl"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 ${section.color} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">
                      {section.title}
                    </h3>
                    
                    <p className="text-base font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                      {section.subtitle}
                    </p>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 group-hover:bg-white/20 transition-all duration-300 border border-white/20">
                    <p className="text-sm opacity-80 font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-white group-hover:text-yellow-200 transition-colors">
                      {section.studentCount}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Track Student Progress
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              Monitor GitHub activity, commit frequency, and repository statistics for each student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-blue-500/50 group-hover:to-blue-600/50 transition-all duration-300">
                  <Code className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                  Repository Tracking
                </h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  View all student repositories with detailed statistics and activity metrics.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-green-500/50 group-hover:to-green-600/50 transition-all duration-300">
                  <Users className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                  Student Management
                </h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  Organize students by sections and track their individual progress.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-purple-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-purple-500/50 group-hover:to-purple-600/50 transition-all duration-300">
                  <GraduationCap className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 text-center">
                  Academic Integration
                </h3>
                <p className="text-gray-300 text-center leading-relaxed">
                  Seamlessly integrate with academic records and student information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-black/80 to-slate-900/80 backdrop-blur-md border-t border-white/10 text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-gradient mb-2">GitHub Tracker</h3>
              <p className="text-gray-400">Monitor student GitHub activity and repository statistics</p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">About</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Features</a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</a>
              </div>
            </div>

            {/* Developer Info */}
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold text-white mb-4">Connect with Creator</h4>
              <p className="text-gray-400 mb-4">Made by <span className="font-bold text-blue-400">Gagan Kumar</span></p>
              <a
                href="https://www.linkedin.com/in/gagan-kumar-46b3622ab/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
              >
                <Linkedin className="h-5 w-5" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-center sm:text-left">
                © 2024 GitHub Repository Tracker. Built for academic monitoring and student progress tracking.
              </p>
              <p className="text-gray-500 text-sm">
                Designed & Developed with ❤️ by Gagan Kumar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
