import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

function Router() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('auth_token');
    const savedIsAdmin = localStorage.getItem('is_admin') === 'true';
    const savedUsername = localStorage.getItem('current_username');

    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      setIsAdmin(savedIsAdmin);
      setCurrentUsername(savedUsername);
      setCurrentPage(savedIsAdmin ? 'admin' : 'dashboard');
    }
  }, []);

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setIsLoggedIn(true);
    setIsAdmin(data.is_admin);
    setCurrentUsername(data.username);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('is_admin', data.is_admin);
    localStorage.setItem('current_username', data.username);
    setCurrentPage(data.is_admin ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('current_username');
    setIsLoggedIn(false);
    setToken(null);
    setIsAdmin(false);
    setCurrentUsername('');
    setCurrentPage('landing');
  };

  const navigateToLogin = () => {
    setCurrentPage('login');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  // Render current page
  if (currentPage === 'landing') {
    return <LandingPage onNavigateToLogin={navigateToLogin} />;
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToLanding={navigateToLanding}
      />
    );
  }

  if (currentPage === 'admin' && isAdmin) {
    return (
      <AdminDashboard
        token={token}
        currentUsername={currentUsername}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <UserDashboard
        token={token}
        currentUsername={currentUsername}
        onLogout={handleLogout}
      />
    );
  }

  return <LandingPage onNavigateToLogin={navigateToLogin} />;
}

export default Router;
