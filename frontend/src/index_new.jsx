import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './LandingPage';
import './index.css';

function Root() {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if user wants to go to login or has token
    const params = new URLSearchParams(window.location.search);
    const hasToken = localStorage.getItem('auth_token');

    if (hasToken || params.get('login') === 'true' || params.get('register') === 'true') {
      setShowLanding(false);
    }
  }, []);

  return showLanding ? <LandingPage /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
