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
      showLocalToast(`Welcome back, ${user.name}!`);

      if (user.role === 'ADMIN') {
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
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <span className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            FF-CARS
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@ffcars.com"
                className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-secondary/20 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 border border-border rounded-xl bg-secondary/20 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Demo Credentials:
            <br />
            Customer: <code className="bg-secondary px-1 py-0.5 rounded font-mono">customer@ffcars.com</code> / <code className="bg-secondary px-1 py-0.5 rounded font-mono">customerpassword</code>
            <br />
            Admin: <code className="bg-secondary px-1 py-0.5 rounded font-mono">admin@ffcars.com</code> / <code className="bg-secondary px-1 py-0.5 rounded font-mono">adminpassword</code>
          </p>
        </div>
      </div>
    </div>
  );
}
