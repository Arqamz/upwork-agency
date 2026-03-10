'use client';

import { useState } from 'react';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useOrgMembers,
  useAddOrgMember,
  useRemoveOrgMember,
} from '@/hooks/use-organizations';
import { useUsers } from '@/hooks/use-users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Users, Trash2 } from 'lucide-react';
import type { Organization } from '@/types';

const EMPTY_CREATE = { name: '', slug: '', description: '' };
const EMPTY_EDIT = { name: '', slug: '', description: '', isActive: true };

export default function OrganizationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOrgId, setMembersOrgId] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const { data: orgs, isLoading, isError, error } = useOrganizations(true);
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const { data: members, isLoading: membersLoading } = useOrgMembers(membersOrgId);
  const addMember = useAddOrgMember();
  const removeMember = useRemoveOrgMember();
  const { data: usersData } = useUsers({ limit: 100 });

  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrg.mutateAsync({
      name: createForm.name,
      slug: createForm.slug,
      description: createForm.description || undefined,
    });
    setCreateForm(EMPTY_CREATE);
    setCreateOpen(false);
  };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      slug: org.slug,
      description: org.description ?? '',
      isActive: org.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    await updateOrg.mutateAsync({
      id: editingOrg.id,
      name: editForm.name || undefined,
      slug: editForm.slug || undefined,
      description: editForm.description || undefined,
      isActive: editForm.isActive,
    });
    setEditOpen(false);
    setEditingOrg(null);
  };

  const handleAddMember = async () => {
    if (!membersOrgId || !selectedUserId) return;
    await addMember.mutateAsync({ orgId: membersOrgId, userId: selectedUserId });
    setSelectedUserId('');
    setAddMemberOpen(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!membersOrgId) return;
    await removeMember.mutateAsync({ orgId: membersOrgId, userId });
  };

  const membersOrg = orgs?.find((o) => o.id === membersOrgId);

  // Users not already in this org
  const availableUsers =
    usersData?.data.filter((u) => !members?.some((m) => m.userId === u.id)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage organizations and their members</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>Add a new organization to the platform.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="orgName">Name *</Label>
                  <Input
                    id="orgName"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Development Services"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orgSlug">Slug *</Label>
                  <Input
                    id="orgSlug"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="e.g. org-dev"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orgDesc">Description</Label>
                  <Textarea
                    id="orgDesc"
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createOrg.isPending || !createForm.name || !createForm.slug}
                >
                  {createOrg.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>Update organization details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editOrgName">Name</Label>
                <Input
                  id="editOrgName"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editOrgSlug">Slug</Label>
                <Input
                  id="editOrgSlug"
                  value={editForm.slug}
                  onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editOrgDesc">Description</Label>
                <Textarea
                  id="editOrgDesc"
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editOrgStatus">Status</Label>
                <Select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, isActive: v === 'active' }))}
                >
                  <SelectTrigger id="editOrgStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateOrg.isPending}>
                {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Organizations Table */}
      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Organizations Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-destructive">
                    Failed to load organizations. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {orgs?.map((org) => (
                <TableRow key={org.id} className={membersOrgId === org.id ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[250px] truncate">
                    {org.description || '---'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.isActive ? 'success' : 'destructive'}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(org)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant={membersOrgId === org.id ? 'default' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setMembersOrgId(membersOrgId === org.id ? '' : org.id)}
                      >
                        <Users className="h-4 w-4" />
                        <span className="sr-only">Members</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {orgs && orgs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No organizations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Members Panel */}
      {membersOrgId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Members — {membersOrg?.name ?? 'Organization'}</CardTitle>
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-3 w-3" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member</DialogTitle>
                    <DialogDescription>
                      Add a user to {membersOrg?.name ?? 'this organization'}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="memberUser">User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger id="memberUser">
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddMember}
                      disabled={addMember.isPending || !selectedUserId}
                    >
                      {addMember.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !members || members.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                No members in this organization.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined Org</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">
                        {membership.user
                          ? [membership.user.firstName, membership.user.lastName]
                              .filter(Boolean)
                              .join(' ') || '---'
                          : '---'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {membership.user?.email ?? '---'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(membership.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(membership.userId)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
