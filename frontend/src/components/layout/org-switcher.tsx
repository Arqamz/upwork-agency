'use client';

import { useMyOrganizations } from '@/hooks/use-organizations';
import { useAuthContext } from '@/components/auth-provider';
import { Building2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function OrgSwitcher() {
  const { activeOrganizationId, switchOrg } = useAuthContext();
  const { data: myOrgs, isLoading } = useMyOrganizations();

  if (isLoading || !myOrgs || myOrgs.length === 0) return null;

  const activeOrg = myOrgs.find((m) => m.organizationId === activeOrganizationId);
  const activeName = activeOrg?.organization?.name ?? 'Select Organization';

  return (
    <div className="px-3 py-3 border-t border-border/50">
      <p className="mb-1.5 px-1 text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Building2 className="h-3 w-3" />
        Organization
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium',
              'bg-accent/40 hover:bg-accent/70 border border-border/50 hover:border-primary/30',
              'transition-all duration-150 text-left',
            )}
          >
            <span className="truncate text-foreground text-sm">{activeName}</span>
            {myOrgs.length > 1 && (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-1" />
            )}
          </button>
        </DropdownMenuTrigger>
        {myOrgs.length > 1 && (
          <DropdownMenuContent
            className="w-56 bg-card/90 backdrop-blur-xl border-border/60"
            side="top"
            align="start"
          >
            {myOrgs.map((membership) => {
              const isActive = membership.organizationId === activeOrganizationId;
              return (
                <DropdownMenuItem
                  key={membership.organizationId}
                  onClick={() =>
                    switchOrg(
                      membership.organizationId,
                      membership.organization?.name ?? membership.organizationId.slice(0, 8),
                    )
                  }
                  className={cn(
                    'cursor-pointer',
                    isActive && 'text-primary font-medium bg-primary/5',
                  )}
                >
                  <Building2 className="mr-2 h-3.5 w-3.5" />
                  {membership.organization?.name ?? membership.organizationId.slice(0, 8)}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}
