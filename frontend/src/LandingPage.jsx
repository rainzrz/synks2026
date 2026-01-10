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
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
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
          <span>Trusted by 10,000+ teams worldwide</span>
        </div>

        <h1 className="hero-title">
          <span className="title-line">Wiki</span>
          <span className="title-line">management</span>
          <span className="title-line gradient-text">without the chaos</span>
        </h1>

        <p className="hero-subtitle">
          Transform scattered wikis into seamless workflows. Synks
          <br />
          brings clarity, speed, and joy back to team collaboration.
        </p>

        <div className="hero-cta">
          <button className="btn-primary gradient-btn" onClick={onNavigateToLogin}>
            Start Free Trial
          </button>
          <button className="btn-secondary" onClick={onNavigateToLogin}>
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Everything you need</h2>
          <p>Powerful features to streamline your wiki management</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon gradient-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Multi-Client Dashboard</h3>
            <p>Manage multiple client wikis from a single, unified dashboard.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3>GitLab Integration</h3>
            <p>Seamlessly authenticate and access private GitLab wikis.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>Smart Search</h3>
            <p>Find any link or document across all wikis instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h3>Admin Control</h3>
            <p>Granular permissions and user management for administrators.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon gradient-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3>Real-time Updates</h3>
            <p>Stay in sync with automatic content refresh and caching.</p>
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
            <h3>Organized Structure</h3>
            <p>Hierarchical organization by product, environment, and links.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>Simple, transparent pricing</h2>
          <p>Choose the plan that fits your team</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Starter</h3>
            <div className="price">
              <span className="price-currency">$</span>
              <span className="price-amount">29</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features">
              <li>✓ Up to 5 clients</li>
              <li>✓ Basic GitLab integration</li>
              <li>✓ Email support</li>
              <li>✓ 7-day history</li>
            </ul>
            <button className="pricing-btn">Get Started</button>
          </div>

          <div className="pricing-card featured">
            <div className="popular-badge">POPULAR</div>
            <h3>Professional</h3>
            <div className="price">
              <span className="price-currency">$</span>
              <span className="price-amount">99</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features">
              <li>✓ Unlimited clients</li>
              <li>✓ Advanced GitLab integration</li>
              <li>✓ Priority support</li>
              <li>✓ Unlimited history</li>
              <li>✓ Custom branding</li>
              <li>✓ API access</li>
            </ul>
            <button className="pricing-btn gradient-btn">Get Started</button>
          </div>

          <div className="pricing-card">
            <h3>Enterprise</h3>
            <div className="price">
              <span className="price-currency">$</span>
              <span className="price-amount">299</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features">
              <li>✓ Everything in Professional</li>
              <li>✓ Dedicated support</li>
              <li>✓ SLA guarantee</li>
              <li>✓ On-premise deployment</li>
              <li>✓ Custom integrations</li>
              <li>✓ Training & onboarding</li>
            </ul>
            <button className="pricing-btn">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-text">synks</span>
            <p>Wiki management without the chaos</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#docs">Documentation</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="#status">Status</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Synks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
