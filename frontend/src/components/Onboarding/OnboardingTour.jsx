import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import './OnboardingTour.css';

const OnboardingTour = ({ isAdmin, onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if user has completed the tour before
    const hasCompletedTour = localStorage.getItem('synks_tour_completed');
    if (!hasCompletedTour) {
      // Start tour after a short delay
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const userSteps = [
    {
      target: '.user-dashboard-header',
      content: (
        <div className="tour-content">
          <h3>Welcome to Synks! 👋</h3>
          <p>Let's take a quick tour to help you get started with your personalized dashboard.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.dashboard-logo',
      content: (
        <div className="tour-content">
          <h3>Your Portal</h3>
          <p>This is your centralized portal for accessing all Antara ERP systems and resources.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.search-bar',
      content: (
        <div className="tour-content">
          <h3>Quick Search 🔍</h3>
          <p>Use the search bar to instantly find any link by product, environment, or name.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.product-card',
      content: (
        <div className="tour-content">
          <h3>Organized Cards</h3>
          <p>Your links are organized by product and environment for easy access. Click any link to open it in a new tab.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.refresh-btn',
      content: (
        <div className="tour-content">
          <h3>Refresh Data ♻️</h3>
          <p>Click here to refresh your dashboard and get the latest links from GitLab.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.logout-btn',
      content: (
        <div className="tour-content">
          <h3>That's it! 🎉</h3>
          <p>You're all set! Click the logout button when you're done. Happy linking!</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const adminSteps = [
    {
      target: '.admin-dashboard-header',
      content: (
        <div className="tour-content">
          <h3>Welcome to Admin Dashboard! 🔐</h3>
          <p>Let's explore the powerful tools you have to manage users and dashboards.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.admin-table',
      content: (
        <div className="tour-content">
          <h3>User Management</h3>
          <p>View and manage all users. You can see their details, view their dashboards, and delete users if needed.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.search-input',
      content: (
        <div className="tour-content">
          <h3>Search Users 🔍</h3>
          <p>Quickly find users by username or email using the search bar.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.btn-new-user',
      content: (
        <div className="tour-content">
          <h3>Add New Users ➕</h3>
          <p>Click here to add new users to the system with their GitLab credentials.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.action-btns',
      content: (
        <div className="tour-content">
          <h3>User Actions</h3>
          <p>View user dashboards or delete users using these action buttons.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.refresh-btn',
      content: (
        <div className="tour-content">
          <h3>All Done! 🎉</h3>
          <p>You're ready to manage your users. Use the refresh button to clear cache when needed.</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const steps = isAdmin ? adminSteps : userSteps;

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('synks_tour_completed', 'true');
      if (onComplete) onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#E31E24',
          textColor: '#ffffff',
          backgroundColor: '#0a0a0f',
          overlayColor: 'rgba(0, 0, 0, 0.8)',
          arrowColor: '#0a0a0f',
          zIndex: 10000,
        },
        tooltip: {
          backgroundColor: '#0a0a0f',
          borderRadius: '16px',
          border: '1px solid rgba(227, 30, 36, 0.3)',
          boxShadow: '0 20px 60px rgba(227, 30, 36, 0.3)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '1.5rem',
        },
        buttonNext: {
          backgroundColor: 'linear-gradient(135deg, #E31E24, #0066CC)',
          background: 'linear-gradient(135deg, #E31E24, #0066CC)',
          borderRadius: '8px',
          padding: '0.75rem 1.5rem',
          fontWeight: '600',
        },
        buttonBack: {
          color: 'rgba(255, 255, 255, 0.7)',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;
