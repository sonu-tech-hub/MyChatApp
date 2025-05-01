import React, { useState, useEffect } from 'react';
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
  
  // Get userId and verification method from location state
  const { userId, verificationMethod } = location.state || {};
  
  // Redirect if no userId in state
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }
    
    try {
      setIsLoading(true);
      await verifyAccount(userId, otp);
      // Redirect handled by AuthContext on successful verification
    } catch (error) {
      // Bug: Not showing specific error messages
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
      
      // Reset OTP field on error for better UX
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/send-otp', { userId, verificationMethod });
      if (response.status === 200) { // Check for 200 OK
        toast.success(`Verification code sent to your ${verificationMethod}`);
        setTimeLeft(30);
      } else {
        toast.error('Failed to resend verification code'); // generic error
      }
  
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend verification code';
      toast.error(errorMessage);
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
            Please enter it below to verify your account.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">Verification Code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={timeLeft > 0 || isLoading}
              className={`text-sm font-medium text-primary hover:text-primary-dark ${
                (timeLeft > 0 || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {timeLeft > 0 
                ? `Resend code in ${timeLeft} seconds` 
                : 'Resend verification code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyAccount;