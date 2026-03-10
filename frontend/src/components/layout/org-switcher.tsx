'use client';

import { useMyOrganizations } from '@/hooks/use-organizations';
import { useAuthContext } from '@/components/auth-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function OrgSwitcher() {
  const { activeOrganizationId, switchOrg } = useAuthContext();
  const { data: myOrgs, isLoading } = useMyOrganizations();

  if (isLoading || !myOrgs || myOrgs.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-t">
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Building2 className="h-3 w-3" />
        Organization
      </div>
      <Select value={activeOrganizationId ?? ''} onValueChange={switchOrg}>
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {myOrgs.map((membership) => (
            <SelectItem key={membership.organizationId} value={membership.organizationId}>
              {membership.organization?.name ?? membership.organizationId.slice(0, 8)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
