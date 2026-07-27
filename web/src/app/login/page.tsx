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
    <div
      className="flex-1 flex items-center justify-center relative overflow-hidden py-12 px-4"
      style={{ backgroundColor: 'var(--midnight)' }}
    >
      {/* Background ambience */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(201,169,110,0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(201,169,110,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div
          className="relative rounded-3xl p-10 overflow-hidden"
          style={{
            background: 'var(--obsidian)',
            border: '1px solid var(--onyx-border)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,110,0.06)',
          }}
        >
          {/* Gold top accent */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.6) 40%, rgba(232,201,122,0.8) 60%, transparent 100%)',
            }}
          />

          {/* Subtle inner gold glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(201,169,110,0.1) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />

          {/* Header */}
          <div className="relative text-center mb-10">
            {/* Brand mark */}
            <div className="mb-6 flex items-center justify-center">
              <span
                className="font-black tracking-widest text-xl"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--gold)',
                  letterSpacing: '0.2em',
                }}
              >
                FF-CARS
              </span>
            </div>

            {/* Ornamental divider */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="flex-1 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--onyx-border))' }}
              />
              <span style={{ color: 'var(--silver-dim)', fontSize: '0.6rem' }}>✦</span>
              <div
                className="flex-1 h-px"
                style={{ background: 'linear-gradient(90deg, var(--onyx-border), transparent)' }}
              />
            </div>

            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2rem',
                fontWeight: 500,
                color: 'var(--platinum)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              Welcome Back
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--silver)', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              Sign in to your concierge account or{' '}
              <Link
                href="/register"
                className="transition-colors"
                style={{ color: 'var(--gold)' }}
              >
                create one
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="relative flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--silver-dim)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-luxury pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--silver-dim)' }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-luxury pl-11"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full mt-2 disabled:opacity-50"
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
          <div
            className="relative mt-8 pt-6"
            style={{ borderTop: '1px solid var(--onyx-border)' }}
          >
            <p
              className="text-xs text-center leading-relaxed"
              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
            >
              <span style={{ color: 'var(--silver)' }}>Default Password:</span>{' '}
              <code
                className="px-1.5 py-0.5 rounded font-mono"
                style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--gold)', fontSize: '0.75rem' }}
              >
                password123
              </code>
            </p>
            <p
              className="text-[11px] text-center mt-1.5"
              style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
            >
              Admin:{' '}
              <code
                className="px-1 py-0.5 rounded font-mono text-[10px]"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--silver)' }}
              >
                admin@ffcars.in
              </code>
              {' '}· Customer:{' '}
              <code
                className="px-1 py-0.5 rounded font-mono text-[10px]"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--silver)' }}
              >
                customer@ffcars.com
              </code>
            </p>
          </div>
        </div>

        {/* Bottom register link */}
        <p
          className="text-center mt-6 text-sm"
          style={{ color: 'var(--silver-dim)', fontFamily: "'DM Sans', sans-serif" }}
        >
          New to FF-Cars?{' '}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: 'var(--gold)' }}
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
