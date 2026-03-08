'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Video,
  Calendar,
  DollarSign,
  FolderKanban,
  ListChecks,
  BarChart3,
  Users,
  ScrollText,
  Layers,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/auth-provider';

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
    roles: ['admin', 'bidder', 'closer', 'developer', 'qa', 'scriptwriter', 'leadership'],
  },
  {
    label: 'Proposals',
    href: '/proposals',
    icon: FileText,
    roles: ['admin', 'bidder', 'closer', 'leadership'],
  },
  {
    label: 'Niche Queue',
    href: '/queue',
    icon: Layers,
    roles: ['admin', 'closer'],
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: UserCircle,
    roles: ['admin', 'bidder', 'leadership'],
  },
  {
    label: 'Scripts',
    href: '/scripts',
    icon: ScrollText,
    roles: ['admin', 'bidder', 'scriptwriter', 'leadership'],
  },
  {
    label: 'Video Proposals',
    href: '/videos',
    icon: Video,
    roles: ['admin', 'closer', 'leadership', 'qa'],
  },
  {
    label: 'Meetings',
    href: '/meetings',
    icon: Calendar,
    roles: ['admin', 'closer', 'leadership'],
  },
  {
    label: 'Deals',
    href: '/deals',
    icon: DollarSign,
    roles: ['admin', 'closer', 'leadership'],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    roles: ['admin', 'developer', 'leadership', 'qa'],
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: ListChecks,
    roles: ['admin', 'developer', 'qa'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'leadership'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const userRole = user?.role?.toLowerCase() ?? '';

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          A
        </div>
        <span className="text-lg font-semibold text-foreground">AOP</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
