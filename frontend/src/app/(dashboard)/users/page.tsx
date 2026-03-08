'use client';

import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { useTeams } from '@/hooks/use-teams';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil } from 'lucide-react';
import type { User } from '@/types';

const EMPTY_CREATE = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleId: '',
  teamId: '',
};

const EMPTY_EDIT = {
  email: '',
  firstName: '',
  lastName: '',
  roleId: '',
  teamId: '',
  password: '',
  isActive: true,
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const limit = 10;

  const { data, isLoading, isError, error } = useUsers({ page, limit });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: roles } = useRoles();
  const { data: teams } = useTeams();

  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync({
      email: createForm.email,
      password: createForm.password,
      firstName: createForm.firstName || undefined,
      lastName: createForm.lastName || undefined,
      roleId: createForm.roleId,
      teamId: createForm.teamId && createForm.teamId !== 'none' ? createForm.teamId : undefined,
    });
    setCreateForm(EMPTY_CREATE);
    setCreateOpen(false);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      roleId: user.roleId ?? '',
      teamId: user.teamId ?? 'none',
      password: '',
      isActive: user.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser.mutateAsync({
      id: editingUser.id,
      email: editForm.email || undefined,
      firstName: editForm.firstName || undefined,
      lastName: editForm.lastName || undefined,
      roleId: editForm.roleId || undefined,
      teamId: editForm.teamId && editForm.teamId !== 'none' ? editForm.teamId : null,
      password: editForm.password || undefined,
      isActive: editForm.isActive,
    });
    setEditOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage platform users and roles</p>
        </div>

        {/* Create User Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>Add a new user to the platform.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userEmail">Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userFirstName">First Name</Label>
                    <Input
                      id="userFirstName"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userLastName">Last Name</Label>
                    <Input
                      id="userLastName"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userRoleId">Role *</Label>
                    <Select
                      value={createForm.roleId}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, roleId: v }))}
                    >
                      <SelectTrigger id="userRoleId">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userTeamId">Team</Label>
                    <Select
                      value={createForm.teamId}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, teamId: v }))}
                    >
                      <SelectTrigger id="userTeamId">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Team</SelectItem>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createUser.isPending ||
                    !createForm.email ||
                    !createForm.password ||
                    !createForm.roleId
                  }
                >
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details, role, or set a new password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editRoleId">Role</Label>
                  <Select
                    value={editForm.roleId}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, roleId: v }))}
                  >
                    <SelectTrigger id="editRoleId">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTeamId">Team</Label>
                  <Select
                    value={editForm.teamId}
                    onValueChange={(v) => setEditForm((p) => ({ ...p, teamId: v }))}
                  >
                    <SelectTrigger id="editTeamId">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Team</SelectItem>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, isActive: v === 'active' }))}
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPassword">New Password</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Users Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-destructive">
                    Failed to load users. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role?.name?.replace(/_/g, ' ') || '---'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.team?.name || '---'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit user</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.meta.totalPages > 1 && (
            <div className="border-t px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                  disabled={page >= data.meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
