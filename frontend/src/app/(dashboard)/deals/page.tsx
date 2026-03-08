'use client';

import { useState } from 'react';
import { useDeals, useCreateDeal, useCloseDeal, useDealStats } from '@/hooks/use-deals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, DollarSign, TrendingUp, Trophy, XCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Negotiating', value: 'NEGOTIATING' },
  { label: 'Won', value: 'WON' },
  { label: 'Lost', value: 'LOST' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  NEGOTIATING: 'warning',
  WON: 'success',
  LOST: 'destructive',
  CANCELLED: 'secondary',
};

export default function DealsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingId, setClosingId] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useDeals({
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: stats } = useDealStats();
  const createDeal = useCreateDeal();
  const closeDeal = useCloseDeal();

  const [createForm, setCreateForm] = useState({
    proposalId: '',
    value: '',
    currency: 'USD',
    notes: '',
  });

  const [closeForm, setCloseForm] = useState({
    status: 'WON',
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeal.mutateAsync({
      proposalId: createForm.proposalId,
      value: parseFloat(createForm.value),
      currency: createForm.currency || 'USD',
      notes: createForm.notes || undefined,
    } as Record<string, unknown>);
    setCreateForm({ proposalId: '', value: '', currency: 'USD', notes: '' });
    setCreateOpen(false);
  };

  const openClose = (id: string) => {
    setClosingId(id);
    setCloseForm({ status: 'WON', notes: '' });
    setCloseOpen(true);
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    await closeDeal.mutateAsync({
      id: closingId,
      status: closeForm.status,
      notes: closeForm.notes || undefined,
    });
    setCloseOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Track deal pipeline and outcomes</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Deal</DialogTitle>
                <DialogDescription>
                  Create a deal from a successful meeting/proposal.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dealProposalId">Proposal ID *</Label>
                  <Input
                    id="dealProposalId"
                    value={createForm.proposalId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, proposalId: e.target.value }))}
                    placeholder="Paste proposal ID"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dealValue">Value *</Label>
                    <Input
                      id="dealValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={createForm.value}
                      onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dealCurrency">Currency</Label>
                    <Select
                      value={createForm.currency}
                      onValueChange={(v) => setCreateForm((p) => ({ ...p, currency: v }))}
                    >
                      <SelectTrigger id="dealCurrency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dealNotes">Notes</Label>
                  <Textarea
                    id="dealNotes"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Deal details, contract type..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createDeal.isPending || !createForm.proposalId || !createForm.value}
                >
                  {createDeal.isPending ? 'Creating...' : 'Create Deal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <form onSubmit={handleClose}>
            <DialogHeader>
              <DialogTitle>Close Deal</DialogTitle>
              <DialogDescription>Mark this deal as won or lost.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="closeStatus">Outcome *</Label>
                <Select
                  value={closeForm.status}
                  onValueChange={(v) => setCloseForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger id="closeStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closeNotes">Notes</Label>
                <Textarea
                  id="closeNotes"
                  value={closeForm.notes}
                  onChange={(e) => setCloseForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Reason for outcome..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={closeDeal.isPending}>
                {closeDeal.isPending ? 'Closing...' : 'Close Deal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Total Value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                ${(stats.totalValue ?? 0).toLocaleString()}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Negotiating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.negotiating ?? 0}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Won
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-green-600">{stats.won ?? 0}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Lost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-red-600">{stats.lost ?? 0}</span>
            </CardContent>
          </Card>
        </div>
      )}

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
          {data ? `${data.meta.total} deals` : 'Loading...'}
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Deals Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
                    Failed to load deals. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    {deal.proposal?.jobTitle || 'Untitled'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.proposal?.client?.name || '---'}
                  </TableCell>
                  <TableCell className="font-medium">${deal.value.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.currency}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[deal.status] || 'secondary'}>{deal.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {deal.status === 'NEGOTIATING' && (
                      <Button variant="outline" size="sm" onClick={() => openClose(deal.id)}>
                        Close
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No deals found.
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
