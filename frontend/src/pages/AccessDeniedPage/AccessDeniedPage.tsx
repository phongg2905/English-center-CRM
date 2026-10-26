import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import door403Illustration from '../../assets/illustrations/door-403.png';
import './AccessDeniedPage.css';

interface AccessDeniedPageProps {
  requiredRoles?: string[];
  moduleName?: string;
}

interface LocationState {
  requiredRoles?: string[];
  moduleName?: string;
  from?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | undefined;
  const fromPath = state?.from;

  const handleGoBack = () => {
    if (fromPath && fromPath !== '/403') {
      navigate(-1);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="access-denied-container">
      {/* Diluted Ethereal Liquid Glass Glow Accents */}
      <div className="access-denied-bg-glow-1" />
      <div className="access-denied-bg-glow-2" />

      {/* Main Content (100% matched to reference design) */}
      <main className="access-denied-content">
        {/* 403 Arched Door & Characters Illustration */}
        <div className="access-denied-illustration-wrapper">
          <img
            src={door403Illustration}
            alt="403 Forbidden - Restricted Access"
            className="access-denied-illustration"
          />
        </div>

        {/* Title */}
        <h1 className="access-denied-title">We are Sorry...</h1>

        {/* Subtitle (Clean & Concise 2-line description) */}
        <div className="access-denied-subtitle">
          <p>The page you’re trying to access has restricted access.</p>
          <p>
            Please refer to your system administrator{' '}
            <span style={{ opacity: 0.75, fontSize: '14px' }}>
              (Liên hệ Quản trị viên để được cấp quyền)
            </span>
          </p>
        </div>

        {/* Action Button: Glowing Pill "Go Back" */}
        <div className="access-denied-actions">
          <button
            type="button"
            className="access-denied-btn-go-back"
            onClick={handleGoBack}
          >
            Go Back
          </button>

          <button
            type="button"
            className="access-denied-link-dashboard"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={14} />
            <span>Về Bảng điều khiển (Dashboard)</span>
          </button>
        </div>
      </main>
    </div>
  );
};
