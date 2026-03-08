'use client';

import { useState } from 'react';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
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

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  NOT_STARTED: 'secondary',
  IN_PROGRESS: 'default',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, error } = useProjects({ page, limit });
  const createProject = useCreateProject();

  const [form, setForm] = useState({
    dealId: '',
    name: '',
    startDate: '',
    endDate: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      dealId: form.dealId,
      name: form.name || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    } as Record<string, unknown>);
    setForm({ dealId: '', name: '', startDate: '', endDate: '' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Track project progress and milestones</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>Create a project from a won deal.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="projDealId">Deal ID *</Label>
                  <Input
                    id="projDealId"
                    value={form.dealId}
                    onChange={(e) => setForm((p) => ({ ...p, dealId: e.target.value }))}
                    placeholder="Paste deal ID"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projName">Project Name</Label>
                  <Input
                    id="projName"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. E-commerce Platform"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="projStart">Start Date</Label>
                    <Input
                      id="projStart"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="projEnd">End Date</Label>
                    <Input
                      id="projEnd"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createProject.isPending || !form.dealId}>
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Projects Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Milestones</TableHead>
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
                    Failed to load projects. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((project) => {
                const completedMs = project.milestones?.filter((m) => m.completed).length ?? 0;
                const totalMs = project.milestones?.length ?? 0;
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name || project.deal?.proposal?.jobTitle || 'Untitled'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.deal?.proposal?.client?.name || '---'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.deal ? `$${project.deal.value.toLocaleString()}` : '---'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[project.status] || 'secondary'}>
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : '---'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : '---'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {totalMs > 0 ? `${completedMs}/${totalMs}` : '---'}
                    </TableCell>
                  </TableRow>
                );
              })}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No projects found.
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
