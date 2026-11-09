import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otp.trim());
      setSuccess('Email successfully verified! Redirecting to studio gallery...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is missing.');
      return;
    }
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await resendOtp(email);
      setSuccess('A new 6-digit verification code has been dispatched to your email.');
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please wait a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-block">
        <div className="auth-card-header">
          <span className="auth-sub-tag">SECURITY VERIFICATION</span>
          <h2 className="auth-heading">Verify Your Email Address</h2>
          <div className="gold-accent-line"></div>
          <p className="auth-lead-text">
            Enter the 6-digit verification code sent via Nodemailer to{' '}
            <strong>{email || 'your email'}</strong>. Check your inbox and spam folder.
          </p>
        </div>

        {error && (
          <div className="alert-box-block alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert-box-block alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-block">
          {!emailParam && (
            <div className="form-group-block">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input-block"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the registered email"
                required
              />
            </div>
          )}

          <div className="form-group-block">
            <label htmlFor="otp" className="form-label">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              className="form-input-block otp-input-block"
              maxLength="6"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
            />
            <p className="field-hint-text">
              Code expires in 10 minutes. Enter numbers only.
            </p>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying Code...' : 'Verify & Complete Sign In'}
          </button>
        </form>

        <div className="otp-resend-block">
          <p className="resend-label">Didn't receive the email code?</p>
          {countdown > 0 ? (
            <span className="resend-timer-text">
              Resend available in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-resend-link"
            >
              {resending ? 'Sending...' : 'Resend Verification Code'}
            </button>
          )}
        </div>

        <div className="auth-footer-nav">
          <p className="auth-footer-text">
            Entered the wrong email?{' '}
            <Link to="/register" className="auth-footer-link">
              Back to Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

