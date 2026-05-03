'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { LayoutDashboard, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const [forgotStep, setForgotStep] = useState(0); // 0=login, 1=email, 2=otp, 3=password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useThemeContext();

  const isDark = theme === 'dark';

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('loginEmail');
    const savedPassword = localStorage.getItem('loginPassword');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  // Save email to localStorage whenever it changes
  useEffect(() => {
    if (email) {
      localStorage.setItem('loginEmail', email);
    }
  }, [email]);

  // Save password to localStorage whenever it changes
  useEffect(() => {
    if (password) {
      localStorage.setItem('loginPassword', password);
    }
  }, [password]);

  // Clear login data from localStorage when user leaves the page
  useEffect(() => {
    return () => {
      localStorage.removeItem('loginEmail');
      localStorage.removeItem('loginPassword');
    };
  }, []);

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

    try {
      const loggedInUser = await login(email, password);

      // Clear saved credentials after successful login
      localStorage.removeItem('loginEmail');
      localStorage.removeItem('loginPassword');

      if (loggedInUser.role === 'admin') {
        router.push('/admin');
      } else if (loggedInUser.role === 'manager') {
        router.push('/inventory_manager');
      } else {
        router.push('/lab_Assistant');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setSuccess('OTP sent to your email');
      setForgotStep(2); // Move to OTP step
    } catch (err) {
      setError('Failed to send OTP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Invalid OTP');
        return;
      }

      setSuccess('OTP verified! Now enter your new password');
      setForgotStep(3); // Move to password step
    } catch (err) {
      setError('Failed to verify OTP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword, confirmPassword: confirmNewPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setForgotStep(0);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
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
          ${isDark
            ? 'border border-white/10 bg-black/10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]'
             : 'border border-[#ECE8E1] bg-[#FCFCFA] text-[#1A1916] shadow-[0_12px_30px_rgba(0,0,0,0.06)]'
          }`}
        >
          <div>
            {/* Badge */}
            <div
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.24em]
              ${isDark
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
              Everything your lab needs, in one place.
            </h1>

            {/* Description */}
            <p
              className={`mt-6 mb-6 max-w-xl text-lg leading-8
               ${isDark ? 'text-white/75' : 'text-[#9A9690]'}`}
            >
              Manage inventory, track requests, and keep your team aligned from a single, role-aware dashboard.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Role-aware',
                copy: 'Directs admins, managers, and staff to the right dashboard.',
                icon: ShieldCheck,
              },
              {
                title: 'Unified workspace',
                copy: 'Request boards, stock tracking, and audit logs in one view.',
                icon: LayoutDashboard,
              },
              {
                title: 'Live inventory',
                copy: 'Real-time updates across the lab so nothing slips through.',
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
                   <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1A1916]'}`}>
                    {title}
                  </p>
                </div>
                 <p className={`mt-2 text-sm ${isDark ? 'text-white/70' : 'text-[#9A9690]'}`}>
                  {copy}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* RIGHT SIDE (FORM) */}
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`mx-auto w-full max-w-md rounded-[2rem] p-8 sm:p-10 ${panelClassName}`}
        >
          <div className="space-y-2 text-center">
            <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-violet-300' : 'text-[#1A1916]'}`}>
              {forgotStep === 0 ? 'Welcome back' : forgotStep === 1 ? 'Forgot password' : forgotStep === 2 ? 'Verify OTP' : 'New password'}
            </p>
           <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-[#1A1916]'}`}>
              {forgotStep === 0 ? 'Sign in to your account' : forgotStep === 1 ? 'Enter your email' : forgotStep === 2 ? 'Enter OTP' : 'Set new password'}
            </h2>
            <p className={helperClassName}>
              {forgotStep === 0 ? 'Use your inventory account to continue.' : forgotStep === 1 ? 'We\'ll send an OTP to your email.' : forgotStep === 2 ? 'Check your email for the code.' : 'Create a strong password.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={(e) => {
            if (forgotStep === 0) handleSubmit(e);
            else if (forgotStep === 1) handleForgotPasswordStep1(e);
            else if (forgotStep === 2) handleForgotPasswordStep2(e);
            else if (forgotStep === 3) handleForgotPasswordStep3(e);
          }}>
            {error && (
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
                 <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
              </div>
            )}

            {success && (
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-green-500/20 bg-green-500/10' : 'border-green-200 bg-green-50'}`}>
                <p className={`text-sm ${isDark ? 'text-green-200' : 'text-green-700'}`}>{success}</p>
              </div>
            )}

            {forgotStep === 0 && (
              <>
                <div className="space-y-2">
                  <div>
                    <label className={labelClassName}>Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                    <div className="flex items-center justify-end ">

                <button
                    type="button"
                    className={`text-sm ${linkClassName}`}
                    onClick={() => {
                      setForgotStep(1);
                      setForgotEmail(email);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Forgot password?
                  </button>
</div>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-2xl text-white flex items-center justify-center ${
                    isDark ? 'bg-violet-500 hover:bg-violet-400' : 'bg-[#1A1916]! hover:bg-[#5A5650]!'
                  }`}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="flex items-center justify-center mt-1">
                  

                  <span className={helperClassName}>
                    Don’t have an account?{' '}
                    <Link href="/auth/register" className={linkClassName}>
                      Create one
                    </Link>
                  </span>
                </div>
              </>
            )}

            {forgotStep === 1 && (
              <>
                <div>
                  <label className={labelClassName}>Email address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-2xl text-white flex items-center justify-center ${
                    isDark ? 'bg-violet-500 hover:bg-violet-400' : 'bg-[#1A1916]! hover:bg-[#5A5650]!'
                  }`}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className={`text-sm ${linkClassName}`}
                    onClick={() => {
                      setForgotStep(0);
                      setOtp('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setSuccess('');
                      setError('');
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <div>
                  <label className={labelClassName}>OTP (6 digits)</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={inputClassName}
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-[#9A9690]'}`}>
                    {otp.length}/6 digits entered
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={`w-full h-12 rounded-2xl text-white flex items-center justify-center ${
                    isDark ? 'bg-violet-500 hover:bg-violet-400' : 'bg-[#1A1916]! hover:bg-[#5A5650]!'
                  } ${(loading || otp.length !== 6) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP'}
                </Button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 text-sm ${linkClassName}`}
                    onClick={() => setForgotStep(1)}
                  >
                    Resend OTP
                  </button>
                  <button
                    type="button"
                    className={`flex-1 text-sm ${linkClassName}`}
                    onClick={() => {
                      setForgotStep(0);
                      setOtp('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setSuccess('');
                      setError('');
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className={labelClassName}>New password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Confirm new password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-2xl text-white flex items-center justify-center ${
                    isDark ? 'bg-violet-500 hover:bg-violet-400' : 'bg-[#1A1916]! hover:bg-[#5A5650]!'
                  }`}
                >
                  {loading ? 'Resetting password...' : 'Reset password'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className={`text-sm ${linkClassName}`}
                    onClick={() => {
                      setForgotStep(0);
                      setForgotEmail('');
                      setOtp('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setSuccess('');
                      setError('');
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}
          </form>
        </motion.section>
      </div>
    </div>
  );
}