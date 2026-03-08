'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProposals, useCreateProposal, useUpdateProposalStatus } from '@/hooks/use-proposals';
import { useClients } from '@/hooks/use-clients';
import { useNiches } from '@/hooks/use-niches';
import { useScripts } from '@/hooks/use-scripts';
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
import type { Proposal, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Viewed', value: 'VIEWED' },
  { label: 'Replied', value: 'REPLIED' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  SENT: 'default',
  VIEWED: 'outline',
  REPLIED: 'warning',
  INTERVIEW: 'default',
  HIRED: 'success',
  REJECTED: 'destructive',
  WITHDRAWN: 'secondary',
};

export default function ProposalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, error } = useProposals({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: clientsData } = useClients({ limit: 100 });
  const { data: niches } = useNiches();
  const { data: scriptsData } = useScripts({ limit: 100 });
  const createProposal = useCreateProposal();
  const updateStatus = useUpdateProposalStatus();

  const [form, setForm] = useState({
    clientId: '',
    nicheId: '',
    scriptVersionId: '',
    jobTitle: '',
    jobUrl: '',
    coverLetter: '',
    notes: '',
    bidAmount: '',
    agentId: '',
  });

  const resetForm = () =>
    setForm({
      clientId: '',
      nicheId: '',
      scriptVersionId: '',
      jobTitle: '',
      jobUrl: '',
      coverLetter: '',
      notes: '',
      bidAmount: '',
      agentId: '',
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProposal.mutateAsync({
      clientId: form.clientId,
      nicheId: form.nicheId || undefined,
      scriptVersionId: form.scriptVersionId || undefined,
      jobTitle: form.jobTitle || undefined,
      jobUrl: form.jobUrl || undefined,
      coverLetter: form.coverLetter || undefined,
      notes: form.notes || undefined,
      bidAmount: form.bidAmount ? parseFloat(form.bidAmount) : undefined,
      agentId: form.agentId || undefined,
    } as Record<string, unknown>);
    resetForm();
    setDialogOpen(false);
  };

  const handleSend = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'SENT' });
  };

  const scripts = scriptsData?.data ?? [];
  const allVersions = scripts.flatMap(
    (s) =>
      s.versions?.map((v) => ({
        ...v,
        scriptName: s.name,
      })) ?? [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">Manage and track all proposals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Proposal</DialogTitle>
                <DialogDescription>
                  Create a new proposal for a client job posting. Select the client, niche, and
                  script.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={form.clientId}
                    onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsData?.data.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="propNiche">Niche</Label>
                    <Select
                      value={form.nicheId}
                      onValueChange={(v) => setForm((p) => ({ ...p, nicheId: v }))}
                    >
                      <SelectTrigger id="propNiche">
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {niches?.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="script">Script Version</Label>
                    <Select
                      value={form.scriptVersionId}
                      onValueChange={(v) => setForm((p) => ({ ...p, scriptVersionId: v }))}
                    >
                      <SelectTrigger id="script">
                        <SelectValue placeholder="Select script" />
                      </SelectTrigger>
                      <SelectContent>
                        {allVersions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.scriptName} (v{v.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={form.jobTitle}
                      onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                      placeholder="React Dashboard Project"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.bidAmount}
                      onChange={(e) => setForm((p) => ({ ...p, bidAmount: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jobUrl">Job URL</Label>
                  <Input
                    id="jobUrl"
                    value={form.jobUrl}
                    onChange={(e) => setForm((p) => ({ ...p, jobUrl: e.target.value }))}
                    placeholder="https://www.upwork.com/jobs/..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    value={form.coverLetter}
                    onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))}
                    placeholder="Write a cover letter..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="propNotes">Notes</Label>
                  <Textarea
                    id="propNotes"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Internal notes for the closer..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createProposal.isPending || !form.clientId}>
                  {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
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
          {data ? `${data.meta.total} total proposals` : 'Loading...'}
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Proposals Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Bid Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-destructive">
                    Failed to load proposals. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{proposal.jobTitle || 'Untitled'}</p>
                      {proposal.jobUrl && (
                        <a
                          href={proposal.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View Job
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {proposal.client?.name || '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {proposal.niche?.name || '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {proposal.bidAmount ? `$${proposal.bidAmount.toLocaleString()}` : '---'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[proposal.status] || 'secondary'}>
                      {proposal.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {proposal.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSend(proposal.id)}
                          disabled={updateStatus.isPending}
                        >
                          Send
                        </Button>
                      )}
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="text-sm font-medium text-primary hover:underline leading-8"
                      >
                        View
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No proposals found.
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
