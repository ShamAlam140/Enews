import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types/admin';

type AuthState = {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: AdminUser, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'admin-auth' }
  )
);
