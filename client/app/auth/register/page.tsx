'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useThemeContext } from '@/context/ThemeContext';
import {
  UserPlus,
  ShieldCheck,
  Sparkles,
  ClipboardList,
  Package,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { theme } = useThemeContext();

  const isDark = theme === 'dark';
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    requestedRole: 'user',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStepEmail, setOtpStepEmail] = useState('');

  // Load form data from localStorage
  useEffect(() => {
    const savedFormData = localStorage.getItem('registerFormData');

    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData));
      } catch (err) {
        console.error('Failed to restore form data:', err);
      }
    }
  }, []);

  // Save form data
  useEffect(() => {
    localStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  // Clear when leaving
  useEffect(() => {
    return () => {
      localStorage.removeItem('registerFormData');
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const pageClassName = isDark
    ? 'min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_34%),linear-gradient(180deg,#09090b_0%,#111827_48%,#18181b_100%)] text-white'
    : 'min-h-screen overflow-hidden bg-[#F7F6F3] text-[#9A9690]';

  const panelClassName = isDark
    ? 'border border-white/10 bg-white/6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl'
    : 'border border-[#E8E5DF] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl';

  const inputClassName = isDark
    ? 'mt-1 block w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30'
    : 'mt-1 block w-full rounded-2xl border border-[#E2DFD9] bg-white px-4 py-3 text-[#1A1916] placeholder:text-[#C8C5BF] outline-none transition focus:border-[#1A1916] focus:ring-2 focus:ring-[#1A1916]/8';

  const labelClassName = isDark
    ? 'block text-sm font-medium text-slate-200'
    : 'block text-sm font-medium text-[#9A9690]';

  const helperClassName = isDark
    ? 'text-sm text-slate-300'
    : 'text-sm text-[#9A9690]';

  const linkClassName = isDark
    ? 'font-medium text-violet-300 hover:text-violet-200'
    : 'font-medium text-[#1A1916] hover:text-[#5A5650]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setOtpStepEmail(formData.email.trim().toLowerCase());
      setSuccess('OTP sent to your email. Enter it below to verify your account.');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otpStepEmail,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'OTP verification failed');
        return;
      }

      setSuccess(data.message || 'Email verified successfully. Awaiting admin approval.');
      setOtp('');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        requestedRole: 'user',
      });
      localStorage.removeItem('registerFormData');

      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err) {
      setError('An error occurred while verifying OTP.');
      console.error('Verify OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpStepEmail) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: otpStepEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP');
        return;
      }

      setSuccess(data.message || 'OTP resent successfully.');
    } catch (err) {
      setError('An error occurred while resending OTP.');
      console.error('Resend OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={pageClassName}>
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-10">

        {/* LEFT SIDE */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={`hidden lg:flex flex-col justify-between rounded-[2rem] p-12 backdrop-blur-xl
          ${
            isDark
              ? 'border border-white/10 bg-black/10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]'
              : 'border border-[#ECE8E1] bg-[#FCFCFA] text-[#1A1916] shadow-[0_12px_30px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div>
            {/* Badge */}
            <div
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em]
              ${
                isDark
                  ? 'border border-white/15 bg-white/10 text-white/80'
                  : 'border border-[#E2DFD9] bg-white text-[#9A9690]'
              }`}
            >
              <span className="mr-2 inline-flex items-center justify-center">
                <Package className="size-3.5" strokeWidth={2} />
              </span>

              <span>IICT Inventory</span>
            </div>

            {/* Title */}
            <h1
              className={`mt-8 max-w-2xl text-5xl font-semibold tracking-tight lg:text-6xl
              ${isDark ? 'text-white' : 'text-[#1A1916]'}`}
            >
              Build your workspace with smarter inventory access.
            </h1>

            {/* Description */}
            <p
              className={`mt-6 mb-6 max-w-xl text-lg leading-8
              ${isDark ? 'text-white/75' : 'text-[#9A9690]'}`}
            >
              Join the IICT Inventory platform to manage requests,
              streamline workflows, and collaborate with your lab team.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Secure approval',
                copy:
                  'All new accounts require admin verification before access.',
                icon: ShieldCheck,
              },
              {
                title: 'Role requests',
                copy:
                  'Apply for inventory manager or lab assistant permissions.',
                icon: ClipboardList,
              },
              {
                title: 'Modern workflow',
                copy:
                  'Fast, organized, and built for daily inventory operations.',
                icon: Sparkles,
              },
            ].map(({ title, copy, icon: Icon }) => (
              <motion.div
                key={title}
                whileHover={{ scale: 1.03 }}
                className={`rounded-2xl border p-4 ${
                  isDark
                    ? 'border-white/10 bg-white/10'
                    : 'border-[#E8E5DF] bg-[#FCFCFA] shadow-[0_8px_20px_rgba(0,0,0,0.04)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex size-10 items-center justify-center rounded-xl ${
                      isDark
                        ? 'bg-white/10 text-violet-200'
                        : 'bg-[#ECE8E1] text-[#5A5650]'
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={1.9} />
                  </div>

                  <p
                    className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-[#1A1916]'
                    }`}
                  >
                    {title}
                  </p>
                </div>

                <p
                  className={`mt-2 text-sm ${
                    isDark ? 'text-white/70' : 'text-[#9A9690]'
                  }`}
                >
                  {copy}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* RIGHT SIDE */}
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`mx-auto w-full max-w-md rounded-[2rem] p-8 sm:p-10 ${panelClassName}`}
        >
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <div
                className={`inline-flex size-14 items-center justify-center rounded-2xl ${
                  isDark
                    ? 'bg-violet-500/15 text-violet-200'
                    : 'bg-[#ECE8E1] text-[#1A1916]'
                }`}
              >
                <UserPlus className="size-7" />
              </div>
            </div>

            <p
              className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                isDark ? 'text-violet-300' : 'text-[#1A1916]'
              }`}
            >
              Join platform
            </p>

            <h2
              className={`text-3xl font-semibold ${
                isDark ? 'text-white' : 'text-[#1A1916]'
              }`}
            >
              Create your account
            </h2>

            <p className={helperClassName}>
              Register to request access to the inventory system.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={otpStepEmail ? handleVerifyOtp : handleSubmit}>
            {error && (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  isDark
                    ? 'border-red-500/20 bg-red-500/10'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <p
                  className={`text-sm ${
                    isDark ? 'text-red-200' : 'text-red-600'
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  isDark
                    ? 'border-green-500/20 bg-green-500/10'
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <p
                  className={`text-sm ${
                    isDark ? 'text-green-200' : 'text-green-700'
                  }`}
                >
                  {success}
                </p>
              </div>
            )}

            {otpStepEmail ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className={labelClassName}>
                    Enter OTP sent to {otpStepEmail}
                  </label>

                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={inputClassName}
                    placeholder="6-digit OTP"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="h-12 rounded-2xl"
                  >
                    Resend OTP
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOtpStepEmail('');
                      setOtp('');
                      setError('');
                      setSuccess('');
                    }}
                    disabled={loading}
                    className="h-12 rounded-2xl"
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClassName}>
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClassName}>
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={labelClassName}>
                    Password
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClassName}>
                    Confirm Password
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="requestedRole" className={labelClassName}>
                    Request Role
                  </label>

                  <select
                    id="requestedRole"
                    name="requestedRole"
                    value={formData.requestedRole}
                    onChange={handleChange}
                    className={inputClassName}
                  >
                    <option value="user">User (Lab Assistant)</option>
                    <option value="manager">
                      Manager (Inventory Manager)
                    </option>
                  </select>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-2xl text-white flex items-center justify-center ${
                isDark
                  ? 'bg-violet-500 hover:bg-violet-400'
                  : 'bg-[#1A1916]! hover:bg-[#5A5650]!'
              }`}
            >
              {loading ? (otpStepEmail ? 'Verifying OTP...' : 'Creating account...') : otpStepEmail ? 'Verify OTP' : 'Create account'}
            </Button>

            <div className="text-center">
              <span className={helperClassName}>
                Already have an account?{' '}
                <Link href="/auth/login" className={linkClassName}>
                  Sign in
                </Link>
              </span>
            </div>
          </form>
        </motion.section>
      </div>
    </div>
  );
}