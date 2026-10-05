import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-badge">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="login-title">EduFlow CRM</h1>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Tên đăng nhập hoặc Email"
            placeholder="Nhập tên đăng nhập hoặc email..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={<UserIcon size={18} />}
            autoComplete="username"
            required
          />

          <div className="login-password-wrapper">
            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
              required
            />
          </div>

          <div className="login-options-row">
            <label className="remember-me-label">
              <input
                type="checkbox"
                className="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" className="forgot-password-link">
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            iconRight={<ArrowRight size={18} />}
          >
            Đăng nhập hệ thống
          </Button>
        </form>

        {/* Register Prompt */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', paddingTop: '14px', borderTop: '1px solid rgba(226, 232, 240, 0.7)' }}>
          Chưa có tài khoản nhân sự?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-royal)', fontWeight: 700, textDecoration: 'none' }}>
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};
