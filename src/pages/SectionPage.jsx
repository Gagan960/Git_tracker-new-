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
  CheckCircle
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {section.name}
                </h1>
                <div className="flex flex-wrap gap-4 items-center text-gray-600 text-sm mt-1">
                  <span>{students.length} students</span>
                  <span>• {noRepoCount} no repo</span>
                  <span>• {zeroCommitsCount} with 0 commits</span>
                  <span>• GitHub repository tracking</span>
                </div>
        {/* Download Excel at bottom */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleDownloadExcel}
            className="btn btn-outline flex items-center"
            title="Download Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            Download Excel
          </button>
        </div>
              </div>
            </div>
            
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="btn btn-primary flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Github className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">With Repositories</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {students.filter(s => s.githubRepo).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <GitCommit className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Commits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {students.reduce((sum, s) => sum + (s.totalCommits || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {students.filter(s => s.totalCommits > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate warnings banner */}
        {duplicateWarnings.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-800">Warning: duplicate student entries were found and removed on load. Showing {students.length} unique students. Example keys: {duplicateWarnings.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, roll number, or admission number..."
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input"
              >
                <option value="name">Sort by Name</option>
                <option value="rollNo">Sort by Roll No</option>
                <option value="commits">Sort by Commits</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn btn-outline"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading student data...</span>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria' : 'No students in this section'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GitHub Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Commits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total LOC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent Commit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(student)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.rollNo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.githubUsername || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.totalCommits > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.totalCommits || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof student.totalLinesOfCode === 'number' ? student.totalLinesOfCode.toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.recentCommit ? (
                          <div>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {student.recentCommit.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(student.recentCommit.date)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No commits</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {student.githubRepo ? (
                                    <a
                                      href={student.githubRepo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 hover:text-primary-900 flex items-center"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View Repo
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">No repository</span>
                                  )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionPage;
