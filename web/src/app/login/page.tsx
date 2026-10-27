'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { showLocalToast } from '../../components/Toast';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  User, 
  Zap, 
  Check 
} from 'lucide-react';

interface DemoAccount {
  id: string;
  roleName: string;
  badge: string;
  email: string;
  password: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    roleName: 'System Admin',
    badge: 'Admin',
    email: 'admin@carrevive.in',
    password: 'password123',
    icon: ShieldCheck,
    description: 'Full ERP & BI access',
  },
  {
    id: 'manager',
    roleName: 'Branch Manager',
    badge: 'Branch Manager',
    email: 'arun.kumar@carrevive.com',
    password: 'password123',
    icon: Building2,
    description: 'Branch ops & sales',
  },
  {
    id: 'sales',
    roleName: 'Sales Executive',
    badge: 'Sales Exec',
    email: 'mohan.das@carrevive.com',
    password: 'password123',
    icon: UserCheck,
    description: 'Leads & test-drives',
  },
  {
    id: 'customer',
    roleName: 'Customer',
    badge: 'Customer',
    email: 'customer@carrevive.com',
    password: 'password123',
    icon: User,
    description: 'Explore & book cars',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedAccount = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
  );

  const handleFastFill = (demo: DemoAccount) => {
    setEmail(demo.email);
    setPassword(demo.password);
    showLocalToast(`Selected ${demo.roleName} demo credentials`);
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    if (!loginEmail || !loginPass) {
      showLocalToast('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email: loginEmail, password: loginPass });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4 text-text-primary">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-lg p-8 bg-bg-surface text-text-primary border border-border">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="page-title mb-1">
              Welcome Back
            </h1>
            <p className="helper-text">
              Sign in to your account or{' '}
              <Link
                href="/register"
                className="font-bold text-accent hover:underline"
              >
                create one
              </Link>
            </p>
          </div>

          {/* Quick Demo Accounts Fast-Fill Section */}
          <div className="mb-6 p-4 rounded-lg bg-bg-surface-alt border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="helper-text font-bold uppercase tracking-wider flex items-center gap-1 text-text-secondary">
                <Zap className="w-3.5 h-3.5 text-status-warning" />
                Demo Account Fast-Fill
              </span>
              <span className="helper-text text-text-secondary">
                Tap to auto-fill
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => {
                const Icon = demo.icon;
                const isSelected = selectedAccount?.id === demo.id;
                return (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleFastFill(demo)}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-bg-surface ring-1 ring-accent'
                        : 'border-border bg-bg-surface hover:bg-bg-surface-alt text-text-primary'
                    }`}
                  >
                    <div className="p-1 rounded bg-bg-surface-alt shrink-0 mt-0.5 text-accent">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-text-primary truncate">
                          {demo.badge}
                        </span>
                        {isSelected && (
                          <Check className="w-3 h-3 text-status-success shrink-0" />
                        )}
                      </div>
                      <div className="helper-text truncate mt-0.5">
                        {demo.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-text-primary">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-text-primary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {selectedAccount ? `Sign In as ${selectedAccount.badge}` : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dev credentials helper */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Demo Password:</span>
            <code className="px-2 py-0.5 rounded bg-bg-surface-alt text-text-primary font-bold text-xs border border-border">
              password123
            </code>
          </div>
        </div>

        {/* Bottom register link */}
        <p className="text-center mt-6 text-xs text-text-secondary">
          New to CarRevive?{' '}
          <Link
            href="/register"
            className="font-bold text-accent hover:underline"
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}
