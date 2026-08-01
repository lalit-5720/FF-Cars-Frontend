'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { showLocalToast } from '../../components/Toast';
import { User as UserIcon, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      showLocalToast('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showLocalToast('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create the user
      await api.post('/auth/register', { name, email, password });
      
      // 2. Perform auto login
      const loginResponse = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = loginResponse.data;
      
      setAuth(user, accessToken, refreshToken);
      showLocalToast(`Welcome, ${user.name}! Your account is ready.`);
      router.push('/cars');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Try using a different email.';
      showLocalToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-8 relative overflow-hidden text-slate-900 font-sans">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-xl">
        <div className="text-center mb-8">
          <span className="font-sans text-2xl font-extrabold tracking-widest text-slate-900">
            FF-CARS
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Create Customer Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-slate-900 underline hover:text-slate-700">
              Sign in to your account
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-md disabled:opacity-50 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Register Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
