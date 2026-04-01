'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Calendar,
  ListChecks,
  ClipboardCheck,
  BarChart3,
  Building2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/auth-provider';
import { OrgSwitcher } from '@/components/layout/org-switcher';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'lead', 'bidder', 'closer', 'project_manager', 'operator', 'qa'],
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: FolderKanban,
    roles: ['admin', 'lead', 'bidder', 'closer'],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: Briefcase,
    roles: ['admin', 'lead', 'project_manager', 'closer', 'developer'],
  },
  {
    label: 'Meetings',
    href: '/meetings',
    icon: Calendar,
    roles: ['admin', 'lead', 'closer'],
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: ListChecks,
    roles: ['admin', 'project_manager', 'operator', 'qa', 'closer', 'developer'],
  },
  {
    label: 'QA Reviews',
    href: '/qa-reviews',
    icon: ClipboardCheck,
    roles: ['admin', 'qa', 'operator', 'project_manager'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'lead'],
  },
  {
    label: 'Organizations',
    href: '/organizations',
    icon: Building2,
    roles: ['admin'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
];

export { navItems };

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const userRole = user?.role?.toLowerCase() ?? '';

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r glass">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-amber text-white font-bold text-sm shadow-glow-sm">
          A
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-foreground">AOP</span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Platform
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-primary/15 to-amber/8 text-primary border border-primary/25 shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <OrgSwitcher />
    </aside>
  );
}
