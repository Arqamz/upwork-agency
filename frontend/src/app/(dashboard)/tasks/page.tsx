'use client';

import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useAssignTask } from '@/hooks/use-tasks';
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
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Todo', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Done', value: 'DONE' },
  { label: 'Blocked', value: 'BLOCKED' },
];

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  TODO: 'secondary',
  IN_PROGRESS: 'default',
  IN_REVIEW: 'warning',
  DONE: 'success',
  BLOCKED: 'destructive',
};

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useTasks({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: '1',
    estimatedHours: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask.mutateAsync({
      projectId: form.projectId,
      title: form.title,
      description: form.description || undefined,
      priority: parseInt(form.priority),
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
    } as Parameters<typeof createTask.mutateAsync>[0]);
    setForm({ projectId: '', title: '', description: '', priority: '1', estimatedHours: '' });
    setCreateOpen(false);
  };

  const openStatusDialog = (taskId: string, currentStatus: string) => {
    setEditingTaskId(taskId);
    setNewStatus(currentStatus);
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTask.mutateAsync({ id: editingTaskId, status: newStatus } as Parameters<
      typeof updateTask.mutateAsync
    >[0]);
    setStatusDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage development tasks and assignments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>Add a new task to a project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="taskProjectId">Project ID *</Label>
                  <Input
                    id="taskProjectId"
                    value={form.projectId}
                    onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
                    placeholder="Paste project ID"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taskTitle">Title *</Label>
                  <Input
                    id="taskTitle"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Implement user authentication"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taskDesc">Description</Label>
                  <Textarea
                    id="taskDesc"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Task details..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="taskPriority">Priority (1=highest)</Label>
                    <Input
                      id="taskPriority"
                      type="number"
                      min="1"
                      max="10"
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taskEstHours">Est. Hours</Label>
                    <Input
                      id="taskEstHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.estimatedHours}
                      onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createTask.isPending || !form.projectId || !form.title}
                >
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <form onSubmit={handleStatusUpdate}>
            <DialogHeader>
              <DialogTitle>Update Task Status</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">Todo</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} tasks` : 'Loading...'}
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Tasks Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Est. Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]" />
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
                    Failed to load tasks. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.project?.name || '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.assignee
                      ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() ||
                        task.assignee.email
                      : 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P{task.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.estimatedHours ? `${task.estimatedHours}h` : '---'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[task.status] || 'secondary'}>
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStatusDialog(task.id, task.status)}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No tasks found.
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
