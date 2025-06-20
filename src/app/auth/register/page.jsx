"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaUserAlt, FaEnvelope, FaLock, FaIdBadge } from 'react-icons/fa';
import { Loader2 } from "lucide-react";
import { Eye, EyeOff } from "lucide-react"; // <-- import icons

export default function RegisterPage() {
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [form, setForm] = useState({ username: '', email: '', password: '', userId: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); // <-- loading state
  const [showPassword, setShowPassword] = useState(false); // <-- password viewer state
  const inputsRef = useRef([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true); // start loading
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setLoading(false); // stop loading
    if (data.success) {
      setSuccess('Registration successful! Enter the OTP sent to your email.');
      setStep('otp');
    } else {
      setError(data.message || 'Registration failed!');
    }
  };

  const handleOtpChange = (e, idx) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    setError('');
    setSuccess('');
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true); // start loading
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: form.email, otp: code }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setLoading(false); // stop loading
    if (data.success) {
      setSuccess('OTP verified! Your account is now verified.');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 1500);
    } else {
      setError(data.message || 'Invalid OTP, try again!');
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE5DD] flex items-center justify-center px-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-10 flex flex-col items-center transition-transform duration-300">
        {step === 'form' ? (
          <>
            <h1 className="text-3xl font-extrabold mb-8 text-[#075E54] tracking-tight select-none">
              Create Your Account
            </h1>
            {error && <div className="w-full mb-4 text-red-600 text-center">{error}</div>}
            {success && <div className="w-full mb-4 text-green-600 text-center">{success}</div>}
            <form onSubmit={handleFormSubmit} className="w-full space-y-7">
              <div className="relative">
                <FaIdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  name="userId"
                  placeholder="U123"
                  onChange={handleChange}
                  required
                  className="pl-12 border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  name="username"
                  placeholder="Username"
                  onChange={handleChange}
                  required
                  className="pl-12 border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  required
                  className="pl-12 border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  required
                  className="pl-12 pr-12 border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
                  disabled={loading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#25D366] focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <Button
                type="submit"
                className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
                disabled={loading}
              >
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Register
              </Button>
            </form>

            <p className="mt-8 text-sm text-gray-600 select-none">
              Already have an account?{' '}
              <a href="/auth/login" className="text-[#25D366] font-semibold hover:underline">
                Login here
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold mb-8 text-[#075E54] tracking-tight select-none">
              Enter OTP Code
            </h1>
            <p className="mb-6 text-center text-gray-700 select-none">
              Please enter the 6-digit code sent to <b>{form.email}</b>
            </p>
            {error && <div className="w-full mb-4 text-red-600 text-center">{error}</div>}
            {success && <div className="w-full mb-4 text-green-600 text-center">{success}</div>}
            <form onSubmit={handleOtpSubmit} className="flex justify-center space-x-4 mb-6">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  className="w-12 h-12 text-center rounded-lg border border-gray-300 shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] text-xl font-mono"
                  inputMode="numeric"
                  autoFocus={idx === 0}
                  disabled={loading}
                />
              ))}
            </form>
            <Button
              type="submit"
              onClick={handleOtpSubmit}
              className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Verify OTP
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
