'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/auth-provider';
import { OrgSwitcher } from '@/components/layout/org-switcher';
import { navItems } from '@/components/layout/sidebar';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const userRole = user?.role?.toLowerCase() ?? '';

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex flex-col h-full">
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
      <OrgSwitcher />
    </div>
  );
}
