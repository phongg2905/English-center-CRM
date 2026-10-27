import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import notFoundIllustration from '../../assets/illustrations/not-found-404.png';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="not-found-container">
      {/* Diluted Ethereal Liquid Glass Glow Accents */}
      <div className="not-found-bg-glow-1" />
      <div className="not-found-bg-glow-2" />

      {/* Main Content (Aligned with 403 Page Aesthetics) */}
      <main className="not-found-content">
        {/* 404 Vector Illustration */}
        <div className="not-found-illustration-wrapper">
          <img
            src={notFoundIllustration}
            alt="404 Page Not Found"
            className="not-found-illustration"
          />
        </div>

        {/* Title */}
        <h1 className="not-found-title">Oops! Page Not Found</h1>

        {/* Subtitle */}
        <div className="not-found-subtitle">
          <p>The page you are looking for doesn't exist or has been moved.</p>
          <p>Please check the URL or return to the dashboard.</p>
        </div>

        {/* Action Buttons: Glowing Cyan Pill & Dashboard Link */}
        <div className="not-found-actions">
          <button
            type="button"
            className="not-found-btn-go-back"
            onClick={handleGoBack}
          >
            Go Back
          </button>

          <button
            type="button"
            className="not-found-link-dashboard"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={15} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </main>
    </div>
  );
};
