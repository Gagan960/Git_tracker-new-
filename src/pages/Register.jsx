import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    githubUsername: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingUsername, setValidatingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateUsername = async (username) => {
    if (!username) {
      setUsernameValid(null);
      return;
    }

    setValidatingUsername(true);
    try {
      const response = await axios.post('/api/github/validate-username', { username });
      setUsernameValid(response.data.valid);
    } catch (error) {
      setUsernameValid(false);
    }
    setValidatingUsername(false);
  };

  const handleUsernameChange = (e) => {
    const username = e.target.value;
    setFormData({
      ...formData,
      githubUsername: username
    });
    
    // Debounce validation
    clearTimeout(window.usernameValidationTimeout);
    window.usernameValidationTimeout = setTimeout(() => {
      validateUsername(username);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (usernameValid !== true) {
      alert('Please enter a valid GitHub username');
      return;
    }

    setLoading(true);
    
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
              <Github className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 text-gradient">
            Create your account
          </h2>
          <p className="text-gray-400 text-lg">
            Join GitHub Tracker to monitor your repositories
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-6 bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/50">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="studentId" className="label">
                Student ID
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                className="input"
                placeholder="Enter your student ID"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="githubUsername" className="label">
                GitHub Username
              </label>
              <div className="relative">
                <input
                  id="githubUsername"
                  name="githubUsername"
                  type="text"
                  required
                  className={`input pr-12 ${
                    usernameValid === true ? 'border-green-500/50 focus:ring-green-500' : 
                    usernameValid === false ? 'border-red-500/50 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter your GitHub username"
                  value={formData.githubUsername}
                  onChange={handleUsernameChange}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {validatingUsername ? (
                    <div className="spinner"></div>
                  ) : usernameValid === true ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : usernameValid === false ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : null}
                </div>
              </div>
              {usernameValid === false && (
                <p className="mt-2 text-sm text-red-400">
                  GitHub username not found
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pr-12"
                  placeholder="Enter your password (min 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="input pr-12"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || usernameValid !== true}
            className="w-full btn btn-primary justify-center group relative flex items-center"
          >
            {loading ? (
              <>
                <div className="spinner mr-2"></div>
                <span>Creating account...</span>
              </>
            ) : (
              'Create account'
            )}
          </button>

          <div className="text-center pt-4 border-t border-slate-600/50">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
