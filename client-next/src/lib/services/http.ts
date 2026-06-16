import axios from 'axios';
import { useAuthStore } from '@/lib/store/useAuthStore';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function refreshAccessToken() {
  const { refreshToken, setSession, user } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
      { refreshToken }
    );
    const newAccessToken = res.data?.accessToken;
    if (newAccessToken && user) setSession(user, newAccessToken, refreshToken);
    return newAccessToken;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original.__isRetry) {
      original.__isRetry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }
    }
    return Promise.reject(error);
  }
);
