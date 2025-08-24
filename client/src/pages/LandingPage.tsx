import React from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { createDemoRoom } from '../store/slices/roomsSlice';
import { toggleTheme } from '../store/slices/uiSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.ui);
  const { isLoading } = useAppSelector(state => state.rooms);

  const handleCreateDemo = async () => {
    dispatch(createDemoRoom());
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="border-b-2" style={{ borderColor: 'var(--color-border-light)', backgroundColor: 'var(--color-bg-card)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
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
              <h1 className="text-retro text-3xl tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                AETHERMEET
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Theme Toggle */}
              <button
                onClick={() => dispatch(toggleTheme())}
                className="btn btn-ghost"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-border-light)',
                  padding: 'var(--space-sm)',
                  fontSize: 'var(--font-size-lg)'
                }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              {user ? (
                <Link to="/dashboard" className="btn btn-primary">
                  DASHBOARD
                </Link>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="btn btn-outline">
                    LOGIN
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    REGISTER
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-16">
            <h1 className="text-6xl font-bold mb-8 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              SECURE & EPHEMERAL<br />
              <span style={{ color: 'var(--color-text-secondary)' }}>TEAM CHAT ROOMS</span>
            </h1>
            
            <p 
              className="text-xl font-mono mb-16 max-w-4xl mx-auto leading-relaxed"
              style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}
            >
              CREATE INSTANT DEMO ROOMS OR SECURE AUTHENTICATED CHAT SPACES.<br />
              PERFECT FOR TEMPORARY TEAM DISCUSSIONS AND QUICK COLLABORATION.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
            <button
              onClick={handleCreateDemo}
              disabled={isLoading}
              className="btn btn-xl btn-primary"
              style={{ 
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg-primary)',
                minWidth: '280px',
                fontSize: 'var(--font-size-lg)'
              }}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                '→ TRY DEMO ROOM'
              )}
            </button>
            
            {!user && (
              <Link
                to="/register"
                className="btn btn-xl btn-outline"
                style={{ 
                  minWidth: '280px',
                  fontSize: 'var(--font-size-lg)'
                }}
              >
                CREATE ACCOUNT
              </Link>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: '🚀',
                title: 'INSTANT DEMO',
                description: 'No registration required. Create demo rooms instantly for quick collaboration sessions.'
              },
              {
                icon: '🔐',
                title: 'SECURE AUTH',
                description: 'Advanced security with JWT tokens, rate limiting, and encrypted connections.'
              },
              {
                icon: '⚡',
                title: 'REAL-TIME',
                description: 'Instant messaging with typing indicators, media sharing, and live updates.'
              },
              {
                icon: '⏰',
                title: 'EPHEMERAL',
                description: 'Rooms auto-expire after use. Perfect for temporary team discussions.'
              },
              {
                icon: '📱',
                title: 'PWA READY',
                description: 'Install on your device for native app experience across all platforms.'
              },
              {
                icon: '🎨',
                title: 'NEO-BRUTAL',
                description: 'Minimalistic design with retro brutalism aesthetic and dark mode support.'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="card card-elevated p-10"
                style={{ backgroundColor: 'var(--color-bg-card)' }}
              >
                <div 
                  className="w-20 h-20 flex items-center justify-center mb-8 mx-auto border-2"
                  style={{ 
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-light)'
                  }}
                >
                  <span className="text-4xl">{feature.icon}</span>
                </div>
                <h3 
                  className="text-xl font-bold mb-6 tracking-wide"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="font-mono text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t-2 mt-32"
        style={{ 
          borderColor: 'var(--color-border-light)', 
          backgroundColor: 'var(--color-bg-card)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="text-center">
            <p 
              className="font-mono text-sm tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              © 2025 AETHERMEET. BUILT WITH MODERN WEB TECHNOLOGIES.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
