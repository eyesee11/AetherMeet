import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser } from '../store/slices/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'USERNAME IS REQUIRED';
    } else if (formData.username.length < 3) {
      newErrors.username = 'USERNAME MUST BE AT LEAST 3 CHARACTERS';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, AND UNDERSCORES';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'EMAIL IS REQUIRED';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'INVALID EMAIL FORMAT';
    }

    if (!formData.password) {
      newErrors.password = 'PASSWORD IS REQUIRED';
    } else if (formData.password.length < 6) {
      newErrors.password = 'PASSWORD MUST BE AT LEAST 6 CHARACTERS';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'CONFIRM PASSWORD IS REQUIRED';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'PASSWORDS DO NOT MATCH';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(registerUser(formData)).unwrap();
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled by Redux store
      console.error('Registration failed:', err);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-3 mb-8"
            style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            <div 
              className="w-12 h-12 flex items-center justify-center border-3" 
              style={{ 
                backgroundColor: 'var(--color-text-primary)', 
                color: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <span className="font-mono font-bold text-xl">A</span>
            </div>
            <h1 className="text-retro text-retro-lg">AETHERMEET</h1>
          </Link>
          
          <h2 
            className="text-retro text-xl mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            CREATE ACCOUNT
          </h2>
          <p 
            className="font-mono text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            JOIN THE SECURE CHAT NETWORK
          </p>
        </div>

        {/* Register Form Card */}
        <div 
          className="card p-8"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error */}
            {error && (
              <div 
                className="p-4 border-3"
                style={{ 
                  backgroundColor: 'var(--color-error)', 
                  color: 'white',
                  borderColor: 'var(--color-error)'
                }}
              >
                <p className="font-mono font-bold text-sm text-center">
                  {error.toUpperCase()}
                </p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="form-label">
                USERNAME
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="YOUR_USERNAME"
                className="form-input focus-brutal"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="form-error">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="YOUR@EMAIL.COM"
                className="form-input focus-brutal"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="STRONG PASSWORD"
                className="form-input focus-brutal"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="REPEAT PASSWORD"
                className="form-input focus-brutal"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full neo-brutal"
              style={{ 
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg-primary)'
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p 
            className="font-mono text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ALREADY HAVE AN ACCOUNT?
          </p>
          <Link
            to="/login"
            className="btn btn-secondary neo-brutal"
            style={{ 
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)'
            }}
          >
            SIGN IN
          </Link>
          
          <div className="mt-6">
            <Link
              to="/"
              className="font-mono text-sm"
              style={{ 
                color: 'var(--color-text-secondary)',
                textDecoration: 'underline'
              }}
            >
              ← BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
