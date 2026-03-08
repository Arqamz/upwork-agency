'use client';

import { useState } from 'react';
import { useMeetings, useCreateMeeting, useCompleteMeeting } from '@/hooks/use-meetings';
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

  const [createForm, setCreateForm] = useState({
    proposalId: '',
    scheduledAt: '',
    meetingUrl: '',
  });

  const [completeForm, setCompleteForm] = useState({
    notes: '',
    duration: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMeeting.mutateAsync({
      proposalId: createForm.proposalId,
      scheduledAt: createForm.scheduledAt,
      meetingUrl: createForm.meetingUrl || undefined,
    } as Record<string, unknown>);
    setCreateForm({ proposalId: '', scheduledAt: '', meetingUrl: '' });
    setCreateOpen(false);
  };

  const openComplete = (id: string) => {
    setCompletingId(id);
    setCompleteForm({ notes: '', duration: '' });
    setCompleteOpen(true);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeMeeting.mutateAsync({
      id: completingId,
      notes: completeForm.notes || undefined,
      duration: completeForm.duration ? parseInt(completeForm.duration) : undefined,
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
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Schedule Meeting</DialogTitle>
                <DialogDescription>Schedule a meeting from a claimed proposal.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="proposalId">Proposal ID *</Label>
                  <Input
                    id="proposalId"
                    value={createForm.proposalId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, proposalId: e.target.value }))}
                    placeholder="Paste proposal ID"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduledAt">Scheduled At *</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={createForm.scheduledAt}
                    onChange={(e) => setCreateForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meetingUrl">Meeting URL</Label>
                  <Input
                    id="meetingUrl"
                    value={createForm.meetingUrl}
                    onChange={(e) => setCreateForm((p) => ({ ...p, meetingUrl: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createMeeting.isPending || !createForm.proposalId || !createForm.scheduledAt
                  }
                >
                  {createMeeting.isPending ? 'Scheduling...' : 'Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <form onSubmit={handleComplete}>
            <DialogHeader>
              <DialogTitle>Complete Meeting</DialogTitle>
              <DialogDescription>Record the outcome of this meeting.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="completeDuration">Duration (minutes)</Label>
                <Input
                  id="completeDuration"
                  type="number"
                  min="1"
                  value={completeForm.duration}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, duration: e.target.value }))}
                />
              </div>
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
                <TableHead>Proposal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting Link</TableHead>
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
                  <TableCell className="font-medium">
                    {meeting.proposal?.jobTitle || 'Untitled'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {meeting.proposal?.client?.name || '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(meeting.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {meeting.duration ? `${meeting.duration} min` : '---'}
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
