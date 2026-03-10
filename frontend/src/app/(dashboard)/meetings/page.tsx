'use client';

import { useState } from 'react';
import { useMeetings, useCreateMeeting, useCompleteMeeting } from '@/hooks/use-meetings';
import { useProjects } from '@/hooks/use-projects';
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
import { Plus, CheckCircle } from 'lucide-react';
import { MeetingType } from '@/types';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'No Show', value: 'NO_SHOW' },
];

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  SCHEDULED: 'default',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
  NO_SHOW: 'warning',
};

export default function MeetingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingId, setCompletingId] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useMeetings({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const createMeeting = useCreateMeeting();
  const completeMeeting = useCompleteMeeting();
  const { data: projectsData } = useProjects({ limit: 100 });

  const [createForm, setCreateForm] = useState({
    projectId: '',
    type: MeetingType.INTERVIEW as string,
    scheduledAt: '',
    meetingUrl: '',
    fathomUrl: '',
    loomUrl: '',
    driveUrl: '',
  });

  const [completeForm, setCompleteForm] = useState({
    notes: '',
    fathomUrl: '',
    loomUrl: '',
    driveUrl: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMeeting.mutateAsync({
      projectId: createForm.projectId,
      type: createForm.type as MeetingType,
      scheduledAt: createForm.scheduledAt,
      meetingUrl: createForm.meetingUrl || undefined,
      fathomUrl: createForm.fathomUrl || undefined,
      loomUrl: createForm.loomUrl || undefined,
      driveUrl: createForm.driveUrl || undefined,
    });
    setCreateForm({
      projectId: '',
      type: MeetingType.INTERVIEW,
      scheduledAt: '',
      meetingUrl: '',
      fathomUrl: '',
      loomUrl: '',
      driveUrl: '',
    });
    setCreateOpen(false);
  };

  const openComplete = (id: string) => {
    setCompletingId(id);
    setCompleteForm({ notes: '', fathomUrl: '', loomUrl: '', driveUrl: '' });
    setCompleteOpen(true);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeMeeting.mutateAsync({
      id: completingId,
      notes: completeForm.notes || undefined,
      fathomUrl: completeForm.fathomUrl || undefined,
      loomUrl: completeForm.loomUrl || undefined,
      driveUrl: completeForm.driveUrl || undefined,
    });
    setCompleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and track client meetings</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
                <DialogDescription>Schedule a meeting for a project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="meetProjectId">Project *</Label>
                  <Select
                    value={createForm.projectId}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, projectId: v }))}
                  >
                    <SelectTrigger id="meetProjectId">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.data.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="meetType">Type</Label>
                    <Select
                      value={createForm.type}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v }))}
                    >
                      <SelectTrigger id="meetType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={MeetingType.INTERVIEW}>Interview</SelectItem>
                        <SelectItem value={MeetingType.CLIENT_CHECKIN}>Client Check-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meetScheduledAt">Scheduled At *</Label>
                    <Input
                      id="meetScheduledAt"
                      type="datetime-local"
                      value={createForm.scheduledAt}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, scheduledAt: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meetUrl">Meeting URL</Label>
                  <Input
                    id="meetUrl"
                    value={createForm.meetingUrl}
                    onChange={(e) => setCreateForm((p) => ({ ...p, meetingUrl: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="meetFathom">Fathom URL</Label>
                    <Input
                      id="meetFathom"
                      value={createForm.fathomUrl}
                      onChange={(e) => setCreateForm((p) => ({ ...p, fathomUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meetLoom">Loom URL</Label>
                    <Input
                      id="meetLoom"
                      value={createForm.loomUrl}
                      onChange={(e) => setCreateForm((p) => ({ ...p, loomUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="meetDrive">Drive URL</Label>
                    <Input
                      id="meetDrive"
                      value={createForm.driveUrl}
                      onChange={(e) => setCreateForm((p) => ({ ...p, driveUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createMeeting.isPending || !createForm.projectId || !createForm.scheduledAt
                  }
                >
                  {createMeeting.isPending ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Complete Meeting Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <form onSubmit={handleComplete}>
            <DialogHeader>
              <DialogTitle>Complete Meeting</DialogTitle>
              <DialogDescription>Record the outcome of this meeting.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="completeNotes">Notes</Label>
                <Textarea
                  id="completeNotes"
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Meeting outcome, next steps..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="compFathom">Fathom URL</Label>
                  <Input
                    id="compFathom"
                    value={completeForm.fathomUrl}
                    onChange={(e) => setCompleteForm((p) => ({ ...p, fathomUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="compLoom">Loom URL</Label>
                  <Input
                    id="compLoom"
                    value={completeForm.loomUrl}
                    onChange={(e) => setCompleteForm((p) => ({ ...p, loomUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="compDrive">Drive URL</Label>
                  <Input
                    id="compDrive"
                    value={completeForm.driveUrl}
                    onChange={(e) => setCompleteForm((p) => ({ ...p, driveUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={completeMeeting.isPending}>
                {completeMeeting.isPending ? 'Completing...' : 'Mark Complete'}
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
          {data ? `${data.meta.total} meetings` : 'Loading...'}
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Meetings Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting Link</TableHead>
                <TableHead>Recordings</TableHead>
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
                    Failed to load meetings. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">{meeting.project?.title || '---'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {meeting.type === 'CLIENT_CHECKIN' ? 'Check-in' : 'Interview'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(meeting.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[meeting.status] || 'secondary'}>
                      {meeting.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {meeting.meetingUrl ? (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Join
                      </a>
                    ) : (
                      <span className="text-muted-foreground">---</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {meeting.fathomUrl && (
                        <a
                          href={meeting.fathomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Fathom
                        </a>
                      )}
                      {meeting.loomUrl && (
                        <a
                          href={meeting.loomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Loom
                        </a>
                      )}
                      {meeting.driveUrl && (
                        <a
                          href={meeting.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Drive
                        </a>
                      )}
                      {!meeting.fathomUrl && !meeting.loomUrl && !meeting.driveUrl && (
                        <span className="text-muted-foreground text-xs">---</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {meeting.status === 'SCHEDULED' && (
                      <Button variant="outline" size="sm" onClick={() => openComplete(meeting.id)}>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No meetings found.
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
