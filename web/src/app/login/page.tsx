'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { showLocalToast } from '../../components/Toast';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showLocalToast('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      showLocalToast(`Welcome back, ${user.name}`);
      if (user.role !== 'CUSTOMER') {
        router.push('/admin');
      } else {
        router.push('/cars');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Invalid credentials. Please try again.';
      showLocalToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-8 relative overflow-hidden text-slate-900 font-sans">
      
      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="relative rounded-3xl p-8 sm:p-10 bg-white text-slate-900 shadow-xl overflow-hidden border border-slate-200/90">
          
          {/* Header */}
          <div className="relative text-center mb-8">
            {/* Brand mark */}
            <div className="mb-4 flex items-center justify-center">
              <span className="font-extrabold tracking-widest text-2xl text-slate-900 font-sans">
                FF-CARS
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
              Welcome Back
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium">
              Sign in to your concierge account or{' '}
              <Link
                href="/register"
                className="font-bold text-slate-900 underline hover:text-slate-700"
              >
                create one
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="relative flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 pl-10 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 pl-10 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dev credentials */}
          <div className="relative mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center leading-relaxed text-slate-500 font-medium">
              <span className="text-slate-700 font-bold">Default Password:</span>{' '}
              <code className="px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-900 font-bold text-[11px] border border-slate-200">
                password123
              </code>
            </p>
            <p className="text-[11px] text-center mt-2 text-slate-500 font-medium">
              Admin:{' '}
              <code className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                admin@ffcars.in
              </code>
              {' '}· Customer:{' '}
              <code className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                customer@ffcars.com
              </code>
            </p>
          </div>
        </div>

        {/* Bottom register link */}
        <p className="text-center mt-6 text-xs text-slate-500 font-medium">
          New to FF-Cars?{' '}
          <Link
            href="/register"
            className="font-bold text-slate-900 hover:underline"
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
