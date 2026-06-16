'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no access token and not on login page, redirect to login
    if (!accessToken && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } else {
      setLoading(false);
    }
  }, [accessToken, pathname, router]);

  // If currently loading, display a loading screen
  if (loading && pathname !== '/admin/login') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verifying session…</div>;
  }

  // If on login page, do not render layout sidebar/header, just render login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  function isActive(path: string) {
    return pathname === path;
  }

  async function handleLogout() {
    await logout();
    router.replace('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 transform bg-gray-900 text-white p-4 transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5v-5.586l2.293 2.293 1.414-1.414L12 6.586l-4.707 4.707 1.414 1.414L11 10.914V16.5h2z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold">News Admin</h2>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
            ${isActive('/admin') ? 'bg-white text-gray-900' : 'text-white/85 hover:bg-white/10'}`}
          >
            Dashboard
          </Link>

          <Link
            href="/admin/upload"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
            ${isActive('/admin/upload') ? 'bg-white text-gray-900' : 'text-white/85 hover:bg-white/10'}`}
          >
            Upload Images
          </Link>
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
          <div>Signed in as</div>
          <div className="text-white">{user?.username}</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="font-medium text-gray-900 hidden lg:block">Admin Dashboard</div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm hover:bg-black font-semibold"
          >
            Logout
          </button>
        </header>

        <main className="p-4 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
