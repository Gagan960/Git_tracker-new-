import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Code, Database } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              GitHub Repository Tracker
            </h1>
            <p className="text-lg text-gray-600">
              Monitor student GitHub activity and repository statistics
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Select a Section
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose a section to view student repository statistics, commit counts, and GitHub activity.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sectionCards.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`${section.color} ${section.hoverColor} rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-white`}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white bg-opacity-20 rounded-full">
                      <Icon className="h-12 w-12" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">
                    {section.title}
                  </h3>
                  
                  <p className="text-lg opacity-90 mb-4">
                    {section.subtitle}
                  </p>
                  
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Total Students</p>
                    <p className="text-2xl font-bold">
                      {section.studentCount}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Track Student Progress
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Monitor GitHub activity, commit frequency, and repository statistics for each student.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Repository Tracking
              </h3>
              <p className="text-gray-600">
                View all student repositories with detailed statistics and activity metrics.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Student Management
              </h3>
              <p className="text-gray-600">
                Organize students by sections and track their individual progress.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Academic Integration
              </h3>
              <p className="text-gray-600">
                Seamlessly integrate with academic records and student information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © 2024 GitHub Repository Tracker. Built for academic monitoring and student progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
