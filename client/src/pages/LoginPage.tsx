import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser } from '../store/slices/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error is handled by Redux store
      console.error('Login failed:', err);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-4 mb-12"
            style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            <div 
              className="w-14 h-14 flex items-center justify-center border-2" 
              style={{ 
                backgroundColor: 'var(--color-text-primary)', 
                color: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <span className="font-mono font-bold text-2xl">A</span>
            </div>
            <h1 className="text-3xl font-bold tracking-wider">AETHERMEET</h1>
          </Link>
          
          <div className="space-y-3">
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              SIGN IN
            </h2>
            <p 
              className="font-mono text-base"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Access your secure chat rooms
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div 
          className="card card-elevated p-12"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Global Error */}
            {error && (
              <div 
                className="p-6 border-2"
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

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="form-input"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Your password"
                className="form-input"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full"
              style={{ 
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg-primary)',
                marginTop: 'var(--space-2xl)'
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'SIGN IN →'
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-12 space-y-6">
          <p 
            className="font-mono text-base"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Don't have an account?
          </p>
          <Link
            to="/register"
            className="btn btn-outline btn-lg"
          >
            CREATE ACCOUNT
          </Link>
          
          <div className="mt-8">
            <Link
              to="/"
              className="font-mono text-sm hover:underline"
              style={{ 
                color: 'var(--color-text-muted)'
              }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
