import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Code, GitCommit } from 'lucide-react';
import { sections } from '../data/students';

const TopPerformers = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [topByCommits, setTopByCommits] = useState([]);
  const [topByLOC, setTopByLOC] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  const section = sections[sectionId];

  useEffect(() => {
    if (!section) {
      navigate('/');
      return;
    }

    // Restore students data from session storage or localStorage if available
    const key = `section_${sectionId}_students`;
    const stored = sessionStorage.getItem(key);
    
    if (stored) {
      try {
        const students = JSON.parse(stored);
        rankStudents(students);
      } catch (e) {
        console.error('Failed to parse stored students:', e);
      }
    } else {
      // If no stored data, show message to go back and load data
      console.log('No cached student data found. Navigate back to section page and load data first.');
    }
  }, [sectionId, section, navigate]);

  const rankStudents = (students) => {
    setAllStudents(students);

    // Sort by commits (descending) and take top 3
    const sortedByCommits = [...students]
      .filter(s => s.totalCommits > 0)
      .sort((a, b) => (b.totalCommits || 0) - (a.totalCommits || 0))
      .slice(0, 3);

    // Sort by LOC (descending) and take top 3
    const sortedByLOC = [...students]
      .filter(s => s.totalLinesOfCode && s.totalLinesOfCode > 0)
      .sort((a, b) => (b.totalLinesOfCode || 0) - (a.totalLinesOfCode || 0))
      .slice(0, 3);

    setTopByCommits(sortedByCommits);
    setTopByLOC(sortedByLOC);
  };

  // Save students to sessionStorage when they change
  useEffect(() => {
    if (allStudents.length > 0) {
      const key = `section_${sectionId}_students`;
      sessionStorage.setItem(key, JSON.stringify(allStudents));
    }
  }, [allStudents, sectionId]);

  const getMedalColor = (position) => {
    switch (position) {
      case 0:
        return 'bg-yellow-400';
      case 1:
        return 'bg-gray-400';
      case 2:
        return 'bg-orange-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '';
    }
  };

  const RankCard = ({ student, position, metric, value }) => (
    <div className={`relative overflow-hidden rounded-lg shadow-lg p-6 text-white transition-transform hover:scale-105 ${getMedalColor(position)}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white to-transparent"></div>
      
      {/* Medal badge */}
      <div className="absolute top-3 right-3 text-4xl">
        {getMedalIcon(position)}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2 truncate">{student.name}</h3>
        <div className="text-sm opacity-90 mb-3">
          <p className="truncate">{student.admissionNo}</p>
          <p className="truncate text-xs mt-1">{student.githubUsername || 'No GitHub'}</p>
        </div>
        
        <div className="border-t border-white/40 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{metric}</span>
            <span className="text-2xl font-bold">{value.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/section/${sectionId}`)}
                className="flex items-center text-white hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Section
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  Top Performers
                </h1>
                <p className="text-gray-300 text-sm mt-1">{section?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {allStudents.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg mb-4">
              No student data available. Please go back to the section page and load data first.
            </p>
            <button
              onClick={() => navigate(`/section/${sectionId}`)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back to Load Data
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Top by Commits */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <GitCommit className="h-8 w-8 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">Top 3 by Commits</h2>
              </div>
              {topByCommits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topByCommits.map((student, index) => (
                    <RankCard
                      key={`commits-${index}`}
                      student={student}
                      position={index}
                      metric="Total Commits"
                      value={student.totalCommits || 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-300">No commit data available</p>
                </div>
              )}
            </div>

            {/* Top by LOC */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Code className="h-8 w-8 text-green-400" />
                <h2 className="text-3xl font-bold text-white">Top 3 by Lines of Code</h2>
              </div>
              {topByLOC.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topByLOC.map((student, index) => (
                    <RankCard
                      key={`loc-${index}`}
                      student={student}
                      position={index}
                      metric="Total LOC"
                      value={student.totalLinesOfCode || 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-700/50 rounded-lg">
                  <p className="text-gray-300">No LOC data available</p>
                </div>
              )}
            </div>

            {/* Statistics Summary */}
            <div className="mt-12 pt-12 border-t border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">Class Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-6 border border-slate-600">
                  <p className="text-gray-300 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-white mt-2">{allStudents.length}</p>
                </div>
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-6 border border-slate-600">
                  <p className="text-gray-300 text-sm font-medium">With Repositories</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {allStudents.filter(s => s.githubRepo).length}
                  </p>
                </div>
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-6 border border-slate-600">
                  <p className="text-gray-300 text-sm font-medium">Total Commits</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">
                    {allStudents.reduce((sum, s) => sum + (s.totalCommits || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-6 border border-slate-600">
                  <p className="text-gray-300 text-sm font-medium">Total LOC</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {allStudents.reduce((sum, s) => sum + (s.totalLinesOfCode || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformers;
