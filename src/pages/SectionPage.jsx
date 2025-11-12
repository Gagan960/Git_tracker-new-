import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Github, 
  ExternalLink, 
  RefreshCw, 
  Users, 
  GitCommit,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trophy
} from 'lucide-react';
import { sections } from '../data/students';
import githubService from '../services/githubService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SectionPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const section = sections[sectionId];

  // Count students with no repo and with 0 commits
  const noRepoCount = students.filter(s => !s.githubRepo).length;
  const zeroCommitsCount = students.filter(s => s.githubRepo && (!s.totalCommits || s.totalCommits === 0)).length;

  // Download Excel handler
  const handleDownloadExcel = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB');
    const branch = 'CSE'; // Change if you want to make this dynamic
    const sectionName = section?.name || sectionId;

    // Prepare data rows
    const data = students.map(s => ({
      'Roll No': s.rollNo || '',
      'Admission No': s.admissionNo || '',
      'Name': s.name || '',
      'GitHub Username': s.githubUsername || '',
      'GitHub Repo': s.githubRepo || '',
      'Total Commits': s.totalCommits || 0,
      'Total LOC': typeof s.totalLinesOfCode === 'number' ? s.totalLinesOfCode : '',
      'Recent Commit': s.recentCommit ? s.recentCommit.message : '',
      'Recent Commit Date': s.recentCommit ? s.recentCommit.date : '',
      'Error': s.error || ''
    }));

    // Add meta info at the top
    const meta = [
      [`Branch: ${branch}`],
      [`Section: ${sectionName}`],
      [`Date: ${dateStr} ${timeStr}`],
      [`Students with no repo: ${noRepoCount}`],
      [`Students with 0 commits: ${zeroCommitsCount}`],
      []
    ];

    const ws = XLSX.utils.aoa_to_sheet(meta);
    XLSX.utils.sheet_add_json(ws, data, { origin: -1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Section Data');
    const fileName = `${branch}_${sectionName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
  };

  useEffect(() => {
    if (!section) {
      navigate('/');
      return;
    }
    // initialize with baseline student list and show loading per-row
    // create runtime entries with stable _id and dedupe by _id (safety)
    const seeded = section.students.map((s, idx) => ({
      ...s,
      _id: s.admissionNo || s.rollNo || `${sectionId}-${idx}`,
      loading: !!s.githubRepo
    }));
    // first-level dedupe by _id
    const dedupedMap = new Map(seeded.map(s => [s._id, s]));
    const deduped = Array.from(dedupedMap.values());
    // second-level: detect duplicates by admissionNo/rollNo (report them)
    const seen = new Map();
    const final = [];
    const dupKeys = [];
    for (const s of deduped) {
      const key = s.admissionNo || s.rollNo || s.githubRepo || s.name;
      if (key && seen.has(key)) {
        dupKeys.push(key);
        // skip duplicate
        continue;
      }
      if (key) seen.set(key, true);
      final.push(s);
    }
    if (deduped.length !== seeded.length) console.warn('Deduped students on init', { seededLength: seeded.length, dedupedLength: deduped.length });
    if (dupKeys.length) {
      console.warn('Removed duplicate entries by admissionNo/rollNo/githubRepo/name', dupKeys);
      setDuplicateWarnings(dupKeys.slice(0, 10));
    }
    setStudents(final);
    loadStudentData();
  }, [sectionId, section, navigate]);

  const loadStudentData = async () => {
    if (section.students.length === 0) return;
    
    setLoading(true);
    
    try {
      console.log(`Loading data for ${section.students.length} students`);
      // Process students in batches to avoid rate limiting
      const hasToken = Boolean(import.meta.env.VITE_GITHUB_TOKEN);
      // Much larger batches with token (5000/hr limit = ~83/minute)
      const batchSize = hasToken ? 50 : 5;
      // Minimal delay with token since rate limit is high
      const batchDelay = hasToken ? 50 : 2000;

            // Helper to merge accumulated data into state preserving original order
            // Match by unique identifiers (runtime _id, admissionNo, rollNo) first to avoid
            // collisions when many students share the same GitHub username/owner.
            const mergeIntoState = (accumulated) => {
              // diagnostic info
              try {
                const accIds = Array.from(new Set(accumulated.map(a => a._id).filter(Boolean)));
                console.debug('mergeIntoState: accumulated', { accumulatedLength: accumulated.length, accUniqueIds: accIds.length });
              } catch (e) {
                // ignore
              }

              setStudents(prev => {
                const result = prev.map(orig => {
                  const found = accumulated.find(a => (
                    // Prefer runtime _id if available (most reliable)
                    (orig._id && a._id && a._id === orig._id) ||
                    // Prefer admissionNo (usually unique)
                    (orig.admissionNo && a.admissionNo && a.admissionNo === orig.admissionNo) ||
                    // Fallback to rollNo if available
                    (orig.rollNo && a.rollNo && a.rollNo === orig.rollNo) ||
                    // Exact repo url match is a reliable indicator
                    (a.githubRepo && orig.githubRepo && a.githubRepo === orig.githubRepo)
                  ));
                  // Merge found data into the original row to preserve unique fields like _id
                  if (found) {
                    return { ...orig, ...found };
                  }
                  return { ...orig, loading: !!orig.githubRepo };
                });
                // quick sanity: if too many rows now refer to the same _id, log it
                try {
                  const ids = result.map(r => r._id);
                  const dup = ids.length !== new Set(ids).size;
                  if (dup) console.warn('mergeIntoState result contains duplicate _id values', ids);
                } catch (e) {}
                return result;
              });
            };

      const studentsWithData = [];

      for (let i = 0; i < section.students.length; i += batchSize) {
        const batch = section.students.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(section.students.length/batchSize)}`);

        // Process entire batch in parallel for maximum performance
        const batchResults = await Promise.all(
          batch.map(async (student, index) => {
            const runtimeId = student.admissionNo || student.rollNo || `${sectionId}-${i + index}`;
            if (!student.githubRepo) {
              return {
                ...student,
                _id: runtimeId,
                totalCommits: 0,
                recentCommit: null,
                repositoryInfo: null,
                totalLinesOfCode: null,
                loading: false,
                error: 'No GitHub repository'
              };
            }

            try {
              // Fetch full data including LOC directly - we have a token so this is fast now
              const repoData = await githubService.getRepositoryData(student.githubRepo, { skipLOC: false });

              return {
                ...student,
                _id: runtimeId,
                totalCommits: repoData.totalCommits,
                recentCommit: repoData.recentCommit,
                repositoryInfo: repoData.repositoryInfo,
                totalLinesOfCode: repoData.totalLinesOfCode,
                loading: false,
                error: repoData.error
              };
            } catch (error) {
              console.error(`Error processing student ${student.name}:`, error);
              return {
                ...student,
                _id: runtimeId,
                totalCommits: 0,
                recentCommit: null,
                repositoryInfo: null,
                totalLinesOfCode: null,
                loading: false,
                error: error.message
              };
            }
          })
        );

        studentsWithData.push(...batchResults);
        // Merge partial results into UI so user sees progress
        mergeIntoState(studentsWithData);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < section.students.length) {
          console.log(`Waiting ${batchDelay}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      console.log('All students processed:', studentsWithData);
      // final merge to ensure state is complete
      mergeIntoState(studentsWithData);
      // Save students to sessionStorage for TopPerformers page
      const key = `section_${sectionId}_students`;
      sessionStorage.setItem(key, JSON.stringify(studentsWithData));
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  // Per-row fetch for LOC (user-triggered). If force=true, invalidate cache then fetch.
  const fetchLOCForStudent = async (student, { force = false } = {}) => {
    if (!student.githubRepo) return;
    try {
      // optional cache invalidation for a fresh fetch
      if (force) {
        const info = githubService.extractRepoInfo(student.githubRepo);
        if (info) githubService.invalidateRepoCache(info.owner, info.repo);
      }

  // set row loading
  setStudents(prev => prev.map(p => p._id === student._id ? { ...p, loading: true } : p));

      const repoData = await githubService.getRepositoryData(student.githubRepo, { skipLOC: false });

      setStudents(prev => prev.map(p => {
        if (
          p._id === student._id ||
          (p.admissionNo && student.admissionNo && p.admissionNo === student.admissionNo) ||
          (p.rollNo && student.rollNo && p.rollNo === student.rollNo) ||
          (p.githubRepo && student.githubRepo && p.githubRepo === student.githubRepo)
        ) {
          return {
            ...p,
            totalLinesOfCode: repoData.totalLinesOfCode ?? p.totalLinesOfCode,
            repositoryInfo: repoData.repositoryInfo ?? p.repositoryInfo,
            loading: false,
            error: repoData.error
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Fetch LOC for student failed', err);
      setStudents(prev => prev.map(p => (p._id === student._id ? { ...p, loading: false, error: err.message } : p)));
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    // clear cache to ensure fresh data
    githubService.clearCache();
    await loadStudentData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  

  const filteredAndSortedStudents = students
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rollNo':
          aValue = a.rollNo || '';
          bValue = b.rollNo || '';
          break;
        case 'commits':
          aValue = a.totalCommits || 0;
          bValue = b.totalCommits || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (student) => {
    if (student.loading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (student.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" title={student.error} />;
    }
    
    if (student.totalCommits > 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-gray-400" title="No commits found" />;
  };

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Section not found</h1>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-white/10 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-300 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Back to Home
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {section.name}
                </h1>
                <div className="flex flex-wrap gap-4 items-center text-gray-400 text-sm mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {students.length} students
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Github className="h-4 w-4" /> {noRepoCount} no repo
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <GitCommit className="h-4 w-4" /> {zeroCommitsCount} with 0 commits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>

            <button
              onClick={() => navigate(`/top-performers/${sectionId}`)}
              className="btn btn-secondary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Trophy className="h-5 w-5" />
              Top Performers
            </button>

            <button
              onClick={handleDownloadExcel}
              className="btn btn-outline flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              title="Download Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center">
              <Users className="h-10 w-10 text-blue-400 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-gray-400">Total Students</p>
                <p className="text-3xl font-bold text-white">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center">
              <Github className="h-10 w-10 text-green-400 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-gray-400">With Repositories</p>
                <p className="text-3xl font-bold text-white">
                  {students.filter(s => s.githubRepo).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center">
              <GitCommit className="h-10 w-10 text-purple-400 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-gray-400">Total Commits</p>
                <p className="text-3xl font-bold text-white">
                  {students.reduce((sum, s) => sum + (s.totalCommits || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 hover:border-orange-400/50 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center">
              <CheckCircle className="h-10 w-10 text-orange-400 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-gray-400">Active Students</p>
                <p className="text-3xl font-bold text-white">
                  {students.filter(s => s.totalCommits > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate warnings banner */}
        {duplicateWarnings.length > 0 && (
          <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 py-3 mb-6">
            <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-l-4 border-yellow-400 p-4 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-yellow-200">⚠️ Warning: duplicate student entries were found and removed on load. Showing {students.length} unique students. Example keys: {duplicateWarnings.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-600/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, roll number, or admission number..."
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="name">Sort by Name</option>
                <option value="rollNo">Sort by Roll No</option>
                <option value="commits">Sort by Commits</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-400 rounded-lg text-white font-semibold transition-all hover:shadow-lg"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-400 mr-3" />
              <span className="text-lg text-gray-300">Loading student data...</span>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No students found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search criteria' : 'No students in this section'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-gradient-to-r from-slate-800 to-slate-700 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Admission No</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">GitHub Username</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Total Commits</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Total LOC</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Recent Commit</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredAndSortedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-700/50 transition-colors duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusIcon(student)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                          {student.rollNo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                          {student.admissionNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                          {student.githubUsername || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                            student.totalCommits > 0 
                              ? 'bg-green-600/30 text-green-200 border border-green-500/50' 
                              : 'bg-gray-600/30 text-gray-300 border border-gray-500/50'
                          }`}>
                            {student.totalCommits || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 group-hover:text-white transition-colors">
                          {typeof student.totalLinesOfCode === 'number' ? student.totalLinesOfCode.toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                          {student.recentCommit ? (
                            <div>
                              <p className="text-xs text-gray-400 truncate max-w-xs">
                                {student.recentCommit.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(student.recentCommit.date)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">No commits</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {student.githubRepo ? (
                            <a
                              href={student.githubRepo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center transition-colors group/link"
                            >
                              <ExternalLink className="h-4 w-4 mr-1 group-hover/link:translate-x-1 transition-transform" />
                              View Repo
                            </a>
                          ) : (
                            <span className="text-gray-500">No repository</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredAndSortedStudents.map((student) => (
                  <div
                    key={student._id}
                    className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    {/* Header with name and status */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-600/30">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{student.name}</h3>
                        <p className="text-sm text-gray-400">{student.admissionNo}</p>
                      </div>
                      <div className="ml-2">
                        {getStatusIcon(student)}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Roll No</p>
                        <p className="text-sm text-gray-200 mt-1">{student.rollNo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">GitHub</p>
                        <p className="text-sm text-gray-200 mt-1 truncate">{student.githubUsername || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Commits</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                          student.totalCommits > 0 
                            ? 'bg-green-600/30 text-green-200 border border-green-500/50' 
                            : 'bg-gray-600/30 text-gray-300 border border-gray-500/50'
                        }`}>
                          {student.totalCommits || 0}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">LOC</p>
                        <p className="text-sm text-gray-200 mt-1">
                          {typeof student.totalLinesOfCode === 'number' ? student.totalLinesOfCode.toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Recent Commit */}
                    {student.recentCommit && (
                      <div className="mb-4 pb-4 border-t border-slate-600/30">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Last Commit</p>
                        <p className="text-xs text-gray-300 truncate mb-1">{student.recentCommit.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(student.recentCommit.date)}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-slate-600/30">
                      {student.githubRepo ? (
                        <a
                          href={student.githubRepo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
                        >
                          <Github className="h-4 w-4" />
                          <span>View Repo</span>
                        </a>
                      ) : (
                        <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg font-semibold">
                          <AlertCircle className="h-4 w-4" />
                          <span>No Repo</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionPage;
