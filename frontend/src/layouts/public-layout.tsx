import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Security', href: '/security' },
  { label: 'Contact', href: '/contact' },
];

const footerSections = [
  {
    title: 'About',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Mission', href: '/mission' },
      { label: 'Team', href: '/team' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API', href: '/api' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'support@votesecure.com', href: 'mailto:support@votesecure.com' },
      { label: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    ],
  },
];

export default function PublicLayout({ children }: { children?: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-950">
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-primary-500 dark:text-white">
              VoteSecure
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              Register
            </Link>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-surface-200 bg-white px-4 py-4 dark:border-surface-800 dark:bg-surface-950 md:hidden">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      location.pathname === link.href
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-white'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md border border-surface-300 px-4 py-2 text-center text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md bg-primary-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-600"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children || <Outlet />}</main>

      <footer className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-surface-200 pt-8 dark:border-surface-800">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-500" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-primary-500">VoteSecure</span>
              </div>
              <p className="text-center text-sm text-surface-500 dark:text-surface-400">
                &copy; {new Date().getFullYear()} VoteSecure. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
