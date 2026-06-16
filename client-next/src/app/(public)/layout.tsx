'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">SusaNews</span>
                <span className="text-xs text-gray-500 -mt-1">Trusted News Source</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-8">
              <Link
                href="/"
                className={`font-medium hover:text-red-600 transition-colors ${
                  isLinkActive('/') ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`font-medium hover:text-red-600 transition-colors ${
                  isLinkActive('/about') ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                About
              </Link>
              <Link
                href="/privacy"
                className={`font-medium hover:text-red-600 transition-colors ${
                  isLinkActive('/privacy') ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breaking News Bar */}
      <div className="bg-red-600 text-white py-2 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center">
            <span className="bg-white text-red-600 px-3 py-1 text-xs font-bold mr-4 shrink-0">BREAKING</span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap inline-block">
                <span className="text-sm">🚨 Breaking: Major developments in technology sector - Stay tuned for updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="text-xl font-bold">SusaNews</span>
              </div>
              <p className="text-gray-400 text-sm leading-6">
                Delivering trusted news and updates from around the world. 
                Stay informed with our comprehensive coverage of current events.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>news@dailychronicle.com</li>
                <li>+1 (555) 123-NEWS</li>
                <li>Press inquiries</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} DailyChronicle News Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
