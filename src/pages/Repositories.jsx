import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitBranch, 
  Star, 
  GitFork, 
  Calendar, 
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Repositories = () => {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState('statistics.totalCommits');
  const [sortOrder, setSortOrder] = useState('desc');
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    fetchRepositories();
    fetchLanguages();
  }, [sortBy, sortOrder]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/repositories/student/${user.id}`, {
        params: {
          sortBy,
          sortOrder,
          search: searchTerm,
          language: languageFilter
        }
      });
      setRepositories(response.data.repositories);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await axios.get('/api/repositories/stats/languages');
      setLanguages(response.data.languageStats);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchRepositories();
    }, 500);
  };

  const handleLanguageFilter = (language) => {
    setLanguageFilter(language === languageFilter ? '' : language);
    setTimeout(() => fetchRepositories(), 100);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getLanguageColor = (language) => {
    const colors = {
      'JavaScript': '#f7df1e',
      'TypeScript': '#3178c6',
      'Python': '#3776ab',
      'Java': '#ed8b00',
      'C++': '#00599c',
      'C#': '#239120',
      'Go': '#00add8',
      'Rust': '#000000',
      'PHP': '#777bb4',
      'Ruby': '#cc342d',
      'Swift': '#fa7343',
      'Kotlin': '#7f52ff',
      'HTML': '#e34f26',
      'CSS': '#1572b6',
      'Vue': '#4fc08d',
      'React': '#61dafb',
      'Angular': '#dd0031',
      'Node.js': '#339933',
      'Docker': '#2496ed',
      'Shell': '#89e051'
    };
    return colors[language] || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
        <p className="text-gray-600">Manage and view your GitHub repositories</p>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                className="input pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Language Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleLanguageFilter('')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                languageFilter === '' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Languages
            </button>
            {languages.slice(0, 5).map((lang) => (
              <button
                key={lang._id}
                onClick={() => handleLanguageFilter(lang._id)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  languageFilter === lang._id 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang._id} ({lang.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        {[
          { field: 'statistics.totalCommits', label: 'Commits' },
          { field: 'starCount', label: 'Stars' },
          { field: 'forkCount', label: 'Forks' },
          { field: 'updatedAt', label: 'Updated' },
          { field: 'name', label: 'Name' }
        ].map((option) => (
          <button
            key={option.field}
            onClick={() => handleSort(option.field)}
            className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
              sortBy === option.field 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
            {sortBy === option.field && (
              sortOrder === 'desc' ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
            )}
          </button>
        ))}
      </div>

      {/* Repositories List */}
      {repositories.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {repositories.map((repo) => (
            <div key={repo._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <GitBranch className="h-5 w-5 text-gray-400" />
                    <Link 
                      to={`/repositories/${repo._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {repo.name}
                    </Link>
                    {repo.isPrivate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Private
                      </span>
                    )}
                    {repo.isFork && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Fork
                      </span>
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-gray-600 mb-3">{repo.description}</p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    {repo.language && (
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: getLanguageColor(repo.language) }}
                        ></div>
                        {repo.language}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      {repo.starCount || 0}
                    </div>
                    
                    <div className="flex items-center">
                      <GitFork className="h-4 w-4 mr-1" />
                      {repo.forkCount || 0}
                    </div>
                    
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-1" />
                      {repo.statistics?.totalCommits || 0} commits
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    Updated {formatDate(repo.updatedAt)}
                  </div>
                  <div>
                    Created {formatDate(repo.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || languageFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'You haven\'t synced any repositories yet'
            }
          </p>
          {!searchTerm && !languageFilter && (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard to Sync
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Repositories;
