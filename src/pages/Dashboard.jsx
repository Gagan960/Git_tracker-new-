import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  AlertCircle, 
  Star, 
  GitFork,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileResponse, statsResponse] = await Promise.all([
        axios.get('/api/auth/profile'),
        axios.get(`/api/students/${user.id}/stats`)
      ]);

      setRepositories(profileResponse.data.student.repositories || []);
      setStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const syncRepositories = async () => {
    try {
      setSyncing(true);
      const response = await axios.post('/api/github/sync-repositories');
      toast.success(`Synced ${response.data.syncedCount} repositories`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error syncing repositories:', error);
      toast.error('Failed to sync repositories');
    } finally {
      setSyncing(false);
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

  const prepareLanguageData = () => {
    if (!stats?.languages) return [];
    
    return Object.entries(stats.languages).map(([language, count]) => ({
      name: language,
      value: count,
      color: getLanguageColor(language)
    }));
  };

  const prepareActivityData = () => {
    if (!repositories.length) return [];
    
    return repositories.slice(0, 5).map(repo => ({
      name: repo.name.length > 15 ? repo.name.substring(0, 15) + '...' : repo.name,
      commits: repo.statistics?.totalCommits || 0,
      stars: repo.starCount || 0
    }));
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>
        <button
          onClick={syncRepositories}
          disabled={syncing}
          className="btn btn-primary flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Repositories'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GitBranch className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Repositories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalRepositories || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GitCommit className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Commits</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalCommits || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GitPullRequest className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pull Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalPullRequests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stars</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalStars || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
          {prepareLanguageData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareLanguageData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prepareLanguageData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No language data available
            </div>
          )}
        </div>

        {/* Repository Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Repositories by Commits</h3>
          {prepareActivityData().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareActivityData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No repository data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Repositories */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Repositories</h3>
          <Link to="/repositories" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        
        {repositories.length > 0 ? (
          <div className="space-y-4">
            {repositories.slice(0, 5).map((repo) => (
              <div key={repo._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <GitBranch className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      <Link to={`/repositories/${repo._id}`} className="hover:text-primary-600">
                        {repo.name}
                      </Link>
                    </h4>
                    <p className="text-sm text-gray-500">{repo.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="inline-flex items-center text-xs text-gray-500">
                        <div 
                          className="w-3 h-3 rounded-full mr-1" 
                          style={{ backgroundColor: getLanguageColor(repo.language) }}
                        ></div>
                        {repo.language}
                      </span>
                      <span className="text-xs text-gray-500">
                        {repo.statistics?.totalCommits || 0} commits
                      </span>
                      <span className="text-xs text-gray-500">
                        {repo.starCount || 0} stars
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Updated {new Date(repo.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No repositories found</p>
            <button
              onClick={syncRepositories}
              disabled={syncing}
              className="btn btn-primary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Repositories
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/repositories" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <GitBranch className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">View Repositories</h3>
              <p className="text-gray-600">Browse all your repositories</p>
            </div>
          </div>
        </Link>

        <Link to="/leaderboard" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
              <p className="text-gray-600">See how you rank</p>
            </div>
          </div>
        </Link>

        <Link to="/profile" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <p className="text-gray-600">Manage your account</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
