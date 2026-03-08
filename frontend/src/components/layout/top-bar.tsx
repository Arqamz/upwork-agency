'use client';

import { Menu, Bell, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAuthContext } from '@/components/auth-provider';
import { MobileNav } from './mobile-nav';
import { useState } from 'react';
import { ProfileDialog } from '@/components/layout/profile-dialog';

export function TopBar() {
  const { user, fullUser, logout } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = fullUser
    ? `${fullUser.firstName?.[0] ?? ''}${fullUser.lastName?.[0] ?? ''}`.toUpperCase() || 'U'
    : (user?.email?.[0]?.toUpperCase() ?? 'U');

  const displayName = fullUser
    ? [fullUser.firstName, fullUser.lastName].filter(Boolean).join(' ') || fullUser.email
    : (user?.email ?? 'User');

  const roleName = fullUser?.role?.name ?? user?.role ?? '';

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MobileNav />
          </SheetContent>
        </Sheet>

        <div className="flex-1" />

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{roleName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
