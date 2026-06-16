import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import * as authService from '../services/authService';

export function useAuth() {
  const { user, accessToken, refreshToken, setSession, clearSession } = useAuthStore();
  return useMemo(
    () => ({ user, accessToken, refreshToken, setSession, clearSession, ...authService }),
    [user, accessToken, refreshToken, setSession, clearSession]
  );
}
