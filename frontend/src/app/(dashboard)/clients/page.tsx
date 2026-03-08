'use client';

import { useState } from 'react';
import { useClients, useCreateClient } from '@/hooks/use-clients';
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
import { Plus, Search, ExternalLink } from 'lucide-react';
import { AccountPlatform } from '@/types';

const PLATFORM_OPTIONS = [
  { label: 'All Platforms', value: 'all' },
  { label: 'Upwork', value: 'UPWORK' },
  { label: 'Freelancer', value: 'FREELANCER' },
  { label: 'Toptal', value: 'TOPTAL' },
  { label: 'Other', value: 'OTHER' },
];

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, isError, error } = useClients({
    page,
    limit,
    search: search || undefined,
    platform: platformFilter !== 'all' ? platformFilter : undefined,
  });

  const createClient = useCreateClient();

  const [form, setForm] = useState({
    name: '',
    company: '',
    platform: 'UPWORK',
    profileUrl: '',
    country: '',
    totalSpent: '',
    hireRate: '',
    jobsPosted: '',
  });

  const resetForm = () =>
    setForm({
      name: '',
      company: '',
      platform: 'UPWORK',
      profileUrl: '',
      country: '',
      totalSpent: '',
      hireRate: '',
      jobsPosted: '',
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient.mutateAsync({
      name: form.name,
      company: form.company || undefined,
      platform: form.platform as AccountPlatform,
      profileUrl: form.profileUrl || undefined,
      country: form.country || undefined,
      totalSpent: form.totalSpent ? parseFloat(form.totalSpent) : undefined,
      hireRate: form.hireRate ? parseFloat(form.hireRate) : undefined,
      jobsPosted: form.jobsPosted ? parseInt(form.jobsPosted) : undefined,
    });
    resetForm();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client information from marketplaces</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
                <DialogDescription>
                  Log a new client from a marketplace job posting.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={form.platform}
                      onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}
                    >
                      <SelectTrigger id="platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPWORK">Upwork</SelectItem>
                        <SelectItem value="FREELANCER">Freelancer</SelectItem>
                        <SelectItem value="TOPTAL">Toptal</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      placeholder="United States"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profileUrl">Profile URL</Label>
                    <Input
                      id="profileUrl"
                      value={form.profileUrl}
                      onChange={(e) => setForm((p) => ({ ...p, profileUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalSpent">Total Spent ($)</Label>
                    <Input
                      id="totalSpent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.totalSpent}
                      onChange={(e) => setForm((p) => ({ ...p, totalSpent: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hireRate">Hire Rate (%)</Label>
                    <Input
                      id="hireRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.hireRate}
                      onChange={(e) => setForm((p) => ({ ...p, hireRate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jobsPosted">Jobs Posted</Label>
                    <Input
                      id="jobsPosted"
                      type="number"
                      min="0"
                      step="1"
                      value={form.jobsPosted}
                      onChange={(e) => setForm((p) => ({ ...p, jobsPosted: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createClient.isPending || !form.name}>
                  {createClient.isPending ? 'Creating...' : 'Create Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={platformFilter}
          onValueChange={(v) => {
            setPlatformFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} clients` : 'Loading...'}
        </span>
      </div>

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Clients Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Hire Rate</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {isError && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-destructive">
                    Failed to load clients. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.company || '---'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.platform || '---'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.country || '---'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.totalSpent != null ? `$${client.totalSpent.toLocaleString()}` : '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.hireRate != null ? `${client.hireRate}%` : '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.jobsPosted ?? '---'}
                  </TableCell>
                  <TableCell>
                    {client.profileUrl && (
                      <a
                        href={client.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No clients found.
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
