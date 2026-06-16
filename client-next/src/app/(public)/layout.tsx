'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <img 
                src="/logo.png" 
                alt="Khabre Aaj Tak" 
                className="w-10 h-10 md:w-11 md:h-11 object-contain rounded-full border border-gray-100 shadow-sm" 
              />
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Khabre Aaj Tak</span>
                <span className="text-[10px] md:text-xs text-red-600 font-semibold">Trusted News Source</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
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

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-red-600 p-2 focus:outline-none transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white border-t border-gray-100 py-3 px-4 flex flex-col gap-3 shadow-inner">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`font-medium py-2 px-3 rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors ${
                isLinkActive('/') ? 'bg-red-50 text-red-600' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`font-medium py-2 px-3 rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors ${
                isLinkActive('/about') ? 'bg-red-50 text-red-600' : 'text-gray-700'
              }`}
            >
              About
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className={`font-medium py-2 px-3 rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors ${
                isLinkActive('/privacy') ? 'bg-red-50 text-red-600' : 'text-gray-700'
              }`}
            >
              Privacy
            </Link>
          </nav>
        )}
      </header>

      {/* Breaking News Bar */}
      <div className="bg-red-600 text-white py-2 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="Khabre Aaj Tak" 
                  className="w-8 h-8 object-contain rounded-full" 
                />
                <span className="text-xl font-bold">Khabre Aaj Tak</span>
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
                <li>contact@khabreaajtak.co.in</li>
                <li>+91 (555) 123-NEWS</li>
                <li>Press inquiries</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              © {new Date().getFullYear()} Khabre Aaj Tak. All rights reserved.
            </div>
            <div className="text-gray-500 text-xs">
              Powered by <span className="text-red-500 font-semibold">SusaLabs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
