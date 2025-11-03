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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Github className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join GitHub Tracker to monitor your repositories
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  className={`input pr-10 ${
                    usernameValid === true ? 'border-green-500' : 
                    usernameValid === false ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter your GitHub username"
                  value={formData.githubUsername}
                  onChange={handleUsernameChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {validatingUsername ? (
                    <div className="spinner"></div>
                  ) : usernameValid === true ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : usernameValid === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {usernameValid === false && (
                <p className="mt-1 text-sm text-red-600">
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
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
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
                  className="input pr-10"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || usernameValid !== true}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
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
