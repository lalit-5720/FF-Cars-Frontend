import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'SYSTEM_ADMIN'
  | 'BRANCH_MANAGER'
  | 'SALES_EXECUTIVE';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  branch_id?: number | null;
  job_title?: string;
  createdAt?: string;
}


interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'carrevive-auth', // localStorage key
    }
  )
);
