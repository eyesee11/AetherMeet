import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { SocketProvider } from './utils/socket';
import { verifyToken } from './store/slices/authSlice';
import { setTheme } from './store/slices/uiSlice';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoomPage from './pages/RoomPage';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import NotificationToast from './components/NotificationToast';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import './styles/index.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading: authLoading } = useAppSelector(state => state.auth);
  const { theme } = useAppSelector(state => state.ui);

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    // Verify token on app start
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Room routes - can be public (demo) or protected */}
            <Route path="/room/:roomCode" element={<RoomPage />} />
            
            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Global components */}
          <NotificationToast />
        </div>
      </Router>
    </SocketProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
