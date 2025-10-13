'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Phone,
  History,
  Calendar,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Live Calls',
    href: '/dashboard/live-calls',
    icon: Phone,
    permission: 'live_monitor' as const,
  },
  {
    name: 'Call History',
    href: '/dashboard/calls',
    icon: History,
    permission: 'view_all_calls' as const,
  },
  {
    name: 'Appointments',
    href: '/dashboard/appointments',
    icon: Calendar,
    permission: 'edit_appointments' as const,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    permission: 'view_analytics' as const,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permission: 'configure_hours' as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAuthStore();

  return (
    <div className="flex w-64 flex-col bg-[#0A2540] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-2xl font-bold">ReddyTalk.ai</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Check permission if required
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#FF6B00] text-white'
                  : 'text-gray-300 hover:bg-[#0F3352] hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B00]">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-gray-400">Role</p>
          </div>
        </div>
      </div>
    </div>
  );
}
