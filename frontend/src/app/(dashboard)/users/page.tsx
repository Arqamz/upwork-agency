'use client';

import { useState } from 'react';
import { useUsers, useCreateUser } from '@/hooks/use-users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Plus } from 'lucide-react';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, error } = useUsers({ page, limit });
  const createUser = useCreateUser();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    teamId: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser.mutateAsync({
      email: form.email,
      password: form.password,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      roleId: form.roleId,
      teamId: form.teamId || undefined,
    });
    setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '', teamId: '' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage platform users and roles</p>
        </div>
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
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userFirstName">First Name</Label>
                    <Input
                      id="userFirstName"
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userLastName">Last Name</Label>
                    <Input
                      id="userLastName"
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userRoleId">Role ID</Label>
                    <Input
                      id="userRoleId"
                      value={form.roleId}
                      onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                      placeholder="Role UUID"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userTeamId">Team ID</Label>
                    <Input
                      id="userTeamId"
                      value={form.teamId}
                      onChange={(e) => setForm((p) => ({ ...p, teamId: e.target.value }))}
                      placeholder="Team UUID"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createUser.isPending || !form.email || !form.password}
                >
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
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
                    <Badge variant="outline">{user.role?.name || '---'}</Badge>
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
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
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
