import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const VerifyAccount = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const { verifyAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  const { userId, verificationMethod } = location.state || {};

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Focus OTP input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer using interval
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      toast.error('Please enter the verification code');
      return;
    }

    if (!/^\d{4,8}$/.test(trimmedOtp)) {
      toast.error('Please enter a valid code (numbers only)');
      return;
    }

    try {
      setIsLoading(true);
      await verifyAccount(userId, trimmedOtp);
    } catch (error) {
      console.error('Verification error:', error);
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(message);
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/send-otp', { userId, verificationMethod });

      if (response.status === 200) {
        toast.success(`Code sent to your ${verificationMethod}`);
        setTimeLeft(30);
      } else {
        toast.error('Could not resend code. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      const message = error.response?.data?.message || 'Failed to resend verification code';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to your {verificationMethod}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            ref={inputRef}
            id="otp"
            name="otp"
            type="text"
            required
            placeholder="Enter verification code"
            autoComplete="one-time-code"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // digits only
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={timeLeft > 0 || isLoading}
              className={`text-sm font-medium text-primary hover:text-primary-dark ${
                timeLeft > 0 || isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {timeLeft > 0
                ? `Resend code in ${timeLeft}s`
                : 'Resend verification code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyAccount;
