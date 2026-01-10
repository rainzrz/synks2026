import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onNavigateToLogin }) => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">synks</span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>by Systemhaus</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="https://www.systemhaus.com.br/en/sobre-a-systemhaus" target="_blank" rel="noopener noreferrer">About Systemhaus</a>
          </div>
          <button className="nav-signin" onClick={onNavigateToLogin}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-icon">✦</span>
          <span>35+ years serving the leather industry</span>
        </div>

        <h1 className="hero-title">
          <span className="title-line">Customer Portal</span>
          <span className="title-line">Management</span>
          <span className="title-line gradient-text">Made Simple</span>
        </h1>

        <p className="hero-subtitle">
          Streamline access to your Antara ERP environments. Synks centralizes
          <br />
          all customer links, wikis, and resources in one secure portal.
        </p>

        <div className="hero-cta">
          <button className="btn-primary gradient-btn" onClick={onNavigateToLogin}>
            Access Portal
          </button>
          <button className="btn-secondary" onClick={onNavigateToLogin}>
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Designed for Tannery Operations</h2>
          <p>Powerful tools built specifically for Antara ERP customers</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon gradient-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Multi-Environment Access</h3>
            <p>Access all your Antara environments - PTA, TTA, Production, and Development from one place.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3>Secure Authentication</h3>
            <p>Enterprise-grade security with GitLab LDAP integration and role-based access control.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>Quick Navigation</h3>
            <p>Find any system link instantly with powerful search across all products and environments.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>Customer Management</h3>
            <p>Administrators can manage multiple customer portals with granular permissions.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3>Always Up-to-Date</h3>
            <p>Automatic synchronization with GitLab wikis ensures you always have the latest links.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>Organized by Product</h3>
            <p>Links organized by product (Antara, AntaraED, IwC) and environment for easy access.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>Enterprise Solution</h2>
          <p>Included with your Antara ERP subscription</p>
        </div>

        <div className="pricing-grid" style={{ justifyContent: 'center' }}>
          <div className="pricing-card featured" style={{ maxWidth: '500px' }}>
            <div className="popular-badge">INCLUDED</div>
            <h3>Synks Portal</h3>
            <div className="price">
              <span className="price-amount" style={{ fontSize: '2.5rem' }}>Complimentary</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              Synks is included as part of your Systemhaus Antara ERP subscription at no additional cost.
            </p>
            <ul className="pricing-features">
              <li>✓ Unlimited users</li>
              <li>✓ All environments (PTA, TTA, Production)</li>
              <li>✓ GitLab integration</li>
              <li>✓ Admin panel & user management</li>
              <li>✓ Real-time updates</li>
              <li>✓ Secure authentication</li>
              <li>✓ Priority support from Systemhaus</li>
              <li>✓ Regular updates & improvements</li>
            </ul>
            <button className="pricing-btn gradient-btn" onClick={onNavigateToLogin}>Access Portal</button>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>
              Contact your Systemhaus representative for access
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">synks</span>
            <p>by Systemhaus - Empowering the Leather Industry Since 1988</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="https://www.systemhaus.com.br" target="_blank" rel="noopener noreferrer">Systemhaus Website</a>
            </div>
            <div className="footer-column">
              <h4>Antara ERP</h4>
              <a href="https://www.systemhaus.com.br/en/sobre-a-systemhaus" target="_blank" rel="noopener noreferrer">About Us</a>
              <a href="https://www.systemhaus.com.br" target="_blank" rel="noopener noreferrer">Products</a>
              <a href="https://www.systemhaus.com.br" target="_blank" rel="noopener noreferrer">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>Help Center</a>
              <a href="https://www.systemhaus.com.br" target="_blank" rel="noopener noreferrer">Contact Support</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>System Status</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Systemhaus. All rights reserved. | Synks Portal v1.0</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
