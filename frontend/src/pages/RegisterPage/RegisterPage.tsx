import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { Button, Input } from '../../components/ui';
import type { UserRole } from '../../types/auth';
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
  BookOpen,
} from 'lucide-react';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [roleCode, setRoleCode] = useState<UserRole>('SALES');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Địa chỉ Email không đúng định dạng');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        roleCode,
        password,
      });

      setSuccessMsg('Đăng ký tài khoản nhân sự thành công! Đang chuyển hướng về trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        {/* Brand Header */}
        <div className="register-brand-header">
          <div className="register-logo-badge">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="register-title">Đăng Ký Tài Khoản</h1>
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

        {/* Form */}
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-grid-2">
            <Input
              label="Họ và tên nhân sự (*)"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User size={16} />}
              required
            />
            <Input
              label="Tên đăng nhập (*)"
              placeholder="nguyenvana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="register-grid-2">
            <Input
              label="Email công vụ (*)"
              type="email"
              placeholder="a.nguyen@eduflow.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />
            <Input
              label="Số điện thoại liên hệ"
              type="tel"
              placeholder="09xx..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              leftIcon={<Phone size={16} />}
            />
          </div>

          {/* Role Picker */}
          <div className="role-selector-wrapper">
            <label className="role-selector-label">Vai trò nghiệp vụ (*)</label>
            <div className="role-options-grid">
              <button
                type="button"
                className={`role-option-btn ${roleCode === 'SALES' ? 'selected' : ''}`}
                onClick={() => setRoleCode('SALES')}
              >
                <Users size={16} />
                <span className="role-option-title">Tư vấn viên</span>
                <span className="role-option-sub">Chăm sóc Lead</span>
              </button>
              <button
                type="button"
                className={`role-option-btn ${roleCode === 'ACADEMIC' ? 'selected' : ''}`}
                onClick={() => setRoleCode('ACADEMIC')}
              >
                <GraduationCap size={16} />
                <span className="role-option-title">Giáo vụ</span>
                <span className="role-option-sub">Xếp lớp & Test</span>
              </button>
              <button
                type="button"
                className={`role-option-btn ${roleCode === 'TEACHER' ? 'selected' : ''}`}
                onClick={() => setRoleCode('TEACHER')}
              >
                <BookOpen size={16} />
                <span className="role-option-title">Giảng viên</span>
                <span className="role-option-sub">Chấm thi & Lớp</span>
              </button>
            </div>
          </div>

          <div className="register-grid-2">
            <Input
              label="Mật khẩu (*)"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />
            <Input
              label="Xác nhận mật khẩu (*)"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            iconRight={<ArrowRight size={18} />}
          >
            Tạo tài khoản nhân sự
          </Button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          Đã có tài khoản nhân sự?{' '}
          <Link to="/login" className="register-link-highlight">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
