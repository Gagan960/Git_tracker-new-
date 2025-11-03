import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  GitBranch, 
  Star, 
  GitFork, 
  Calendar, 
  ExternalLink,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  Users,
  Code,
  Activity,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RepositoryDetail = () => {
  const { id } = useParams();
  const [repository, setRepository] = useState(null);
  const [commits, setCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRepositoryData();
  }, [id]);

  const fetchRepositoryData = async () => {
    try {
      setLoading(true);
      const [repoResponse, commitsResponse, prsResponse, issuesResponse] = await Promise.all([
        axios.get(`/api/repositories/${id}`),
        axios.get(`/api/github/repository/${repository?.fullName?.split('/')[0]}/${repository?.fullName?.split('/')[1]}/commits`).catch(() => ({ data: { commits: [] } })),
        axios.get(`/api/github/repository/${repository?.fullName?.split('/')[0]}/${repository?.fullName?.split('/')[1]}/pulls`).catch(() => ({ data: { pullRequests: [] } })),
        axios.get(`/api/github/repository/${repository?.fullName?.split('/')[0]}/${repository?.fullName?.split('/')[1]}/issues`).catch(() => ({ data: { issues: [] } }))
      ]);

      setRepository(repoResponse.data.repository);
      setCommits(commitsResponse.data.commits || []);
      setPullRequests(prsResponse.data.pullRequests || []);
      setIssues(issuesResponse.data.issues || []);
    } catch (error) {
      console.error('Error fetching repository data:', error);
      toast.error('Failed to load repository data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchRepositoryData();
    toast.success('Repository data refreshed');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommitMessage = (message) => {
    return message.length > 80 ? message.substring(0, 80) + '...' : message;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="text-center py-12">
        <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Repository not found</h3>
        <p className="text-gray-500 mb-6">The repository you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/repositories" className="btn btn-primary">
          Back to Repositories
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: GitBranch },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'issues', label: 'Issues', icon: AlertCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link to="/repositories" className="text-gray-500 hover:text-gray-700">
              ← Back to Repositories
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <GitBranch className="h-8 w-8 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
              <p className="text-gray-600">{repository.description || 'No description'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="btn btn-outline flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Repository Info */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4 mb-4 lg:mb-0">
            {repository.language && (
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: getLanguageColor(repository.language) }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{repository.language}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-500">
              <Star className="h-4 w-4 mr-1" />
              {repository.starCount || 0} stars
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <GitFork className="h-4 w-4 mr-1" />
              {repository.forkCount || 0} forks
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              {repository.statistics?.totalContributors || 1} contributors
            </div>

            {repository.isPrivate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Private
              </span>
            )}
            
            {repository.isFork && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Fork
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right text-sm text-gray-500">
              <div>Created {formatDate(repository.createdAt)}</div>
              <div>Updated {formatDate(repository.updatedAt)}</div>
            </div>
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <GitCommit className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Commits</p>
              <p className="text-2xl font-semibold text-gray-900">
                {repository.statistics?.totalCommits || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <GitPullRequest className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pull Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {repository.statistics?.totalPullRequests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Issues</p>
              <p className="text-2xl font-semibold text-gray-900">
                {repository.statistics?.totalIssues || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Commit Frequency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {repository.statistics?.commitFrequency || 0}/week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Commits */}
              {repository.statistics?.recentCommits && repository.statistics.recentCommits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Commits</h3>
                  <div className="space-y-3">
                    {repository.statistics.recentCommits.map((commit, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <GitCommit className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCommitMessage(commit.message)}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {commit.author.name} • {formatDate(commit.date)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <a
                            href={commit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repository Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Default Branch</dt>
                    <dd className="text-sm text-gray-900">{repository.defaultBranch}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Size</dt>
                    <dd className="text-sm text-gray-900">{repository.size} KB</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Commit</dt>
                    <dd className="text-sm text-gray-900">
                      {repository.statistics?.lastCommitDate 
                        ? formatDate(repository.statistics.lastCommitDate)
                        : 'No commits yet'
                      }
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Sync</dt>
                    <dd className="text-sm text-gray-900">{formatDate(repository.lastSync)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'commits' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Commits</h3>
              {commits.length > 0 ? (
                <div className="space-y-3">
                  {commits.map((commit, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <GitCommit className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCommitMessage(commit.commit.message)}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {commit.commit.author.name} • {formatDate(commit.commit.author.date)}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {commit.sha.substring(0, 7)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitCommit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No commits found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pulls' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull Requests</h3>
              {pullRequests.length > 0 ? (
                <div className="space-y-3">
                  {pullRequests.map((pr, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <GitPullRequest className="h-4 w-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{pr.title}</p>
                        <p className="text-sm text-gray-500">
                          #{pr.number} by {pr.user.login} • {formatDate(pr.created_at)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pr.state === 'open' ? 'bg-green-100 text-green-800' :
                          pr.state === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pr.state}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitPullRequest className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pull requests found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues</h3>
              {issues.length > 0 ? (
                <div className="space-y-3">
                  {issues.map((issue, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                        <p className="text-sm text-gray-500">
                          #{issue.number} by {issue.user.login} • {formatDate(issue.created_at)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          issue.state === 'open' ? 'bg-green-100 text-green-800' :
                          issue.state === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.state}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No issues found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetail;
