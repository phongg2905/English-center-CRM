import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Button, Input } from '../../components/ui';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import './ForgotPasswordPage.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.forgotPassword(email.trim());
      setSuccessMsg(res.message);
      if (res.otp) {
        setDemoOtp(res.otp);
        setOtp(res.otp); // Tự động điền cho trải nghiệm demo mượt mà
      } else {
        setDemoOtp('686868');
        setOtp('686868');
      }
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otp.trim()) {
      setErrorMsg('Vui lòng nhập mã xác nhận OTP');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-page-container">
      <div className="forgot-card">
        {/* Brand Header */}
        <div className="forgot-brand-header">
          <div className="forgot-icon-badge">
            <KeyRound size={26} />
          </div>
          <div>
            <h1 className="forgot-title">Khôi Phục Mật Khẩu</h1>
            <p className="forgot-subtitle">
              {step === 1
                ? 'Nhập email công vụ để nhận mã xác minh OTP khôi phục mật khẩu'
                : 'Nhập mã xác nhận OTP và thiết lập mật khẩu mới cho tài khoản'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="forgot-step-indicator">
          <div className={`step-pill ${step === 1 ? 'active' : ''}`}>
            <span>1. Nhận mã OTP</span>
          </div>
          <div className="step-divider-line" />
          <div className={`step-pill ${step === 2 ? 'active' : ''}`}>
            <span>2. Đổi mật khẩu</span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="register-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="register-alert success" role="alert">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleRequestOtp}>
            <Input
              label="Địa chỉ Email công vụ (*)"
              type="email"
              placeholder="nhansu@eduflow.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              iconRight={<ArrowRight size={18} />}
            >
              Gửi mã xác nhận OTP
            </Button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            {demoOtp && (
              <div className="otp-demo-hint">
                <span>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Mã xác thực gửi về email:
                </span>
                <span className="otp-copy-chip" onClick={() => setOtp(demoOtp)} title="Nhấn để tự động điền">
                  {demoOtp}
                </span>
              </div>
            )}

            <Input
              label="Mã xác thực OTP (6 chữ số) (*)"
              placeholder="Nhập 6 số..."
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              leftIcon={<ShieldCheck size={16} />}
              maxLength={6}
              required
            />

            <Input
              label="Mật khẩu mới (*)"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Input
              label="Xác nhận mật khẩu mới (*)"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              iconRight={<ArrowRight size={18} />}
            >
              Cập nhật mật khẩu mới
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconLeft={<ArrowLeft size={16} />}
              onClick={() => {
                setStep(1);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Gửi lại mã OTP tới email khác
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="forgot-footer">
          Quay lại màn hình{' '}
          <Link to="/login" className="register-link-highlight">
            Đăng nhập hệ thống
          </Link>
        </div>
      </div>
    </div>
  );
};
