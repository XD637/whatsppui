"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { Loader2, Eye, EyeOff } from "lucide-react"; // <-- import icons

export default function LoginPage() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <-- password viewer state
  const router = useRouter();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear previous errors
    setLoading(true); // start loading

    const res = await signIn("credentials", {
      redirect: false,
      login: form.login,
      password: form.password,
    });

    setLoading(false); // stop loading

    if (res?.ok) {
      router.push("/");
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE5DD] flex items-center justify-center px-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-10 flex flex-col items-center transition-transform duration-300">
        <h1 className="text-3xl font-extrabold mb-8 text-[#075E54] tracking-tight select-none">
          Login to Your Account
        </h1>
        <form onSubmit={handleSubmit} className="w-full space-y-7">
          <div className="relative">
            <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              name="login"
              placeholder="Username or Email"
              onChange={handleChange}
              required
              className="pl-12 border border-gray-300 rounded-2xl shadow-sm
                         focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]
                         transition-all duration-300"
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
              className="pl-12 pr-12 border border-gray-300 rounded-2xl shadow-sm
                         focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]
                         transition-all duration-300"
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

          <div className="flex w-full justify-between items-center mt-2">
            <div />
            <p className="mr-2 text-sm text-gray-600 select-none">
              <Link
                href="/auth/forgot-password"
                className="text-[#128C4A] font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>

          {error && (
            <div className="w-full mb-2 text-red-600 text-center">{error}</div>
          )}

          <Button
            type="submit"
            className="bg-[#25D366] hover:bg-[#128C4A] text-white w-full py-4 rounded-3xl
                       font-semibold text-lg shadow-lg hover:shadow-[#25D366]/60 transition-all duration-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Log In
          </Button>
        </form>

        <p className="mt-8 text-sm text-gray-600 select-none">
          Don’t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-[#25D366] font-semibold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
