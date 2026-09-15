import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Vote,
  Users,
  UserCheck,
  BarChart3,
  ClipboardList,
  Settings,
  Shield,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { getInitials } from '@/lib/utils';

const mainNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Elections', href: '/admin/elections', icon: Vote },
  { label: 'Voters', href: '/admin/voters', icon: Users },
  { label: 'Candidates', href: '/admin/candidates', icon: UserCheck },
  { label: 'Results', href: '/admin/results', icon: BarChart3 },
];

const managementNav = [
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const superAdminNav = [
  { label: 'Admins', href: '/admin/super-admins', icon: Shield },
  { label: 'System Settings', href: '/admin/system-settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUiStore();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function renderNavItem(item: { label: string; href: string; icon: React.ElementType }) {
    const isActive = item.href === '/admin'
      ? location.pathname === item.href
      : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-200 bg-white transition-transform duration-200',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-base font-bold text-white">V</span>
            </div>
            <span className="text-lg font-semibold text-primary-700">
              VoteSecure Admin
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
              Main
            </p>
            <div className="space-y-1">{mainNav.map(renderNavItem)}</div>
          </div>

          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
              Management
            </p>
            <div className="space-y-1">{managementNav.map(renderNavItem)}</div>
          </div>

          {isSuperAdmin && (
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Super Admin
              </p>
              <div className="space-y-1">{superAdminNav.map(renderNavItem)}</div>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-100"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    getInitials(user?.fullName ?? 'A')
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-surface-900">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-surface-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-surface-500 sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-surface-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-surface-100 px-4 py-3">
                    <p className="text-sm font-medium text-surface-900">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-surface-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 hover:bg-surface-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="border-t border-surface-100" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-surface-50"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
