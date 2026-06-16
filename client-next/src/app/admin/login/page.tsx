'use client';

import { type FormEvent, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.push('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4 text-gray-900">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow-sm grid gap-3">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Email</span>
          <input 
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            required 
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Password</span>
          <input 
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            required 
          />
        </label>
        <button 
          disabled={loading} 
          type="submit" 
          className="mt-2 py-2 rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-60 font-semibold"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
