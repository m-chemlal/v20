import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const { theme } = useTheme();

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    const handleActivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);

      const timer = setTimeout(() => {
        logout();
        navigate('/login');
      }, 30 * 60 * 1000); // 30 minutes

      setInactivityTimer(timer);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, handleActivity));

    handleActivity();

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity)
      );
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [inactivityTimer, logout, navigate]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const getNavItems = () => {
    if (!user) return [];

    const baseItems = [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: `/${user.role === 'chef_projet' ? 'chef' : user.role}/dashboard`,
      },
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { label: 'Users', icon: Users, href: '/admin/users' },
        { label: 'Projects', icon: Briefcase, href: '/admin/projects' },
      ];
    } else if (user.role === 'chef_projet') {
      return [
        ...baseItems,
        { label: 'My Projects', icon: Briefcase, href: '/chef/projects' },
        { label: 'Indicators', icon: BarChart3, href: '/chef/indicators' },
      ];
    } else if (user.role === 'donateur') {
      return [
        ...baseItems,
        { label: 'Funded Projects', icon: Briefcase, href: '/donateur/projects' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
        animate={{ width: sidebarOpen ? 256 : 80 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IT</span>
              </div>
              <span className="font-bold text-lg">ImpactTracker</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
	          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
	            <ThemeToggle />
	            {sidebarOpen && <span className="text-sm">Theme</span>}
	          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
