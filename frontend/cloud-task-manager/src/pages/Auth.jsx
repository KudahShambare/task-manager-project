/*** User Auth Page */

/*** Auth Page - Container Component */
import React, { useState } from 'react';
import Login from '../components/Login';
import Signup from '../components/Signup';

const Auth = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-wrapper">
            <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="auth-title">HIT Cloud Computing</h2>
          <p className="auth-subtitle">Internal Team Task Management</p>
        </div>

        <div className="brand-info">
          <p className="eyebrow">Task Management SaaS</p>
          <p className="auth-copy">Secure projects, assigned tasks, and status tracking for small delivery teams.</p>
        </div>

        <div className="segmented-control" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' ? (
          <Login onSuccess={onSuccess} />
        ) : (
          <Signup onSwitchToLogin={() => setMode('login')} />
        )}
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .auth-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          width: 100%;
          max-width: 28rem;
          margin: 1rem;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .logo-wrapper {
          width: 4rem;
          height: 4rem;
          background: #4f46e5;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
        }

        .logo-icon {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .auth-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .brand-info {
          text-align: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .eyebrow {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4f46e5;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .auth-copy {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .segmented-control {
          display: flex;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .segmented-control button {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .segmented-control button.active {
          background: white;
          color: #4f46e5;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .segmented-control button:hover:not(.active) {
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default Auth;