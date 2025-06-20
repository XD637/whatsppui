"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" | "verify" | "reset"
  const [otpArr, setOtpArr] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputsRef = useRef([]);

  // Step 1: Request OTP
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setMessage("OTP sent to your email.");
      setStep("verify");
    } else {
      setError(data.message || "Failed to send OTP.");
    }
  };

  const handleOtpChange = (e, idx) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpArr];
    newOtp[idx] = val.slice(-1);
    setOtpArr(newOtp);
    setError("");
    setMessage("");
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpArr[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const code = otpArr.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp: code, type: "reset" }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setMessage("OTP verified! You can now reset your password.");
      setStep("reset");
    } else {
      setError(data.message || "Invalid or expired OTP.");
    }
  };

  // Step 3: Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp: otpArr.join(''), newPassword }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setMessage("Password reset successful! You can now log in.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } else {
      setError(data.message || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE5DD] flex items-center justify-center px-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-10 flex flex-col items-center transition-transform duration-300">
        <h1 className="text-3xl font-extrabold mb-8 text-[#075E54] tracking-tight select-none">
          Forgot Password
        </h1>
        {step === "request" && (
          <form onSubmit={handleRequest} className="w-full space-y-7">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
              disabled={loading}
            />
            <Button
              type="submit"
              className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Send OTP
            </Button>
            {error && (
              <div className="w-full mb-2 text-red-600 text-center">{error}</div>
            )}
            {message && (
              <div className="w-full mb-2 text-green-600 text-center">
                {message}
              </div>
            )}
            <p className="mt-8 text-sm text-gray-600 select-none text-center">
              <Link
                href="/auth/login"
                className="text-[#25D366] font-semibold hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </form>
        )}
        {step === "verify" && (
          <>
            <form
              onSubmit={handleVerify}
              className="flex justify-center space-x-4 mb-6"
            >
              {otpArr.map((digit, idx) => (
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
              onClick={handleVerify}
              className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Verify OTP
            </Button>
            {error && (
              <div className="w-full mt-4  mb-2 text-red-600 text-center">{error}</div>
            )}
            {message && (
              <div className="w-full mt-4 mb-2 text-green-600 text-center">
                {message}
              </div>
            )}
          </>
        )}
        {step === "reset" && (
          <form onSubmit={handleReset} className="w-full space-y-7">
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-2xl shadow-sm focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366] transition-all duration-300"
              disabled={loading}
            />
            <Button
              type="submit"
              className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Reset Password
            </Button>
            {error && (
              <div className="w-full mb-2 text-red-600 text-center">{error}</div>
            )}
            {message && (
              <div className="w-full mb-2 text-green-600 text-center">
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}