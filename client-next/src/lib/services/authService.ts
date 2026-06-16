import { http } from './http';
import type { AuthResponse, LoginPayload } from '../types/admin';
import { useAuthStore } from '../store/useAuthStore';

export async function login(payload: LoginPayload) {
  const res = await http.post<AuthResponse>('/auth/login', payload);
  const { admin, accessToken, refreshToken } = res.data;
  useAuthStore.getState().setSession(admin, accessToken, refreshToken);
  return admin;
}

export async function logout() {
  const { refreshToken } = useAuthStore.getState();
  if (refreshToken) {
    try { await http.post('/auth/logout', { refreshToken }); } catch {}
  }
  useAuthStore.getState().clearSession();
}
