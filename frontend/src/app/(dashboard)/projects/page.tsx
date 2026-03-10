'use client';

import { useState } from 'react';
import {
  useProjects,
  useCreateProject,
  usePipelineCounts,
  useAdvanceStage,
  useAssignProject,
} from '@/hooks/use-projects';
import { useNiches } from '@/hooks/use-niches';
import { useUsers } from '@/hooks/use-users';
import { useAuthContext } from '@/components/auth-provider';
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
import { Plus, ChevronRight, UserPlus } from 'lucide-react';
import { ProjectStage, PricingType } from '@/types';

const STAGE_LABELS: Record<string, string> = {
  [ProjectStage.DISCOVERED]: 'Discovered',
  [ProjectStage.SCRIPTED]: 'Scripted',
  [ProjectStage.UNDER_REVIEW]: 'Under Review',
  [ProjectStage.ASSIGNED]: 'Assigned',
  [ProjectStage.BID_SUBMITTED]: 'Bid Submitted',
  [ProjectStage.VIEWED]: 'Viewed',
  [ProjectStage.MESSAGED]: 'Messaged',
  [ProjectStage.INTERVIEW]: 'Interview',
  [ProjectStage.WON]: 'Won',
  [ProjectStage.IN_PROGRESS]: 'In Progress',
  [ProjectStage.COMPLETED]: 'Completed',
  [ProjectStage.LOST]: 'Lost',
  [ProjectStage.CANCELLED]: 'Cancelled',
};

const STAGE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  DISCOVERED: 'secondary',
  SCRIPTED: 'default',
  UNDER_REVIEW: 'warning',
  ASSIGNED: 'outline',
  BID_SUBMITTED: 'warning',
  VIEWED: 'default',
  MESSAGED: 'default',
  INTERVIEW: 'default',
  WON: 'success',
  IN_PROGRESS: 'success',
  COMPLETED: 'success',
  LOST: 'destructive',
  CANCELLED: 'secondary',
};

const STAGE_OPTIONS = [
  { label: 'All Stages', value: 'all' },
  ...Object.values(ProjectStage).map((s) => ({
    label: STAGE_LABELS[s] ?? s,
    value: s,
  })),
];

export default function ProjectsPage() {
  const { activeOrganizationId } = useAuthContext();
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningProjectId, setAssigningProjectId] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useProjects({
    page,
    limit,
    stage: stageFilter !== 'all' ? stageFilter : undefined,
    organizationId: activeOrganizationId ?? undefined,
  });

  const { data: pipelineCounts } = usePipelineCounts(activeOrganizationId ?? undefined);
  const createProject = useCreateProject();
  const advanceStage = useAdvanceStage();
  const assignProject = useAssignProject();
  const { data: niches } = useNiches(activeOrganizationId ?? undefined);
  const { data: usersData } = useUsers({ limit: 100 });
  const closers = usersData?.data.filter((u) => u.role?.name === 'closer') ?? [];
  const pms = usersData?.data.filter((u) => u.role?.name === 'project_manager') ?? [];

  const [form, setForm] = useState({
    title: '',
    pricingType: PricingType.HOURLY as string,
    jobUrl: '',
    jobDescription: '',
    hourlyRateMin: '',
    hourlyRateMax: '',
    fixedPrice: '',
    nicheId: '',
  });

  const [assignForm, setAssignForm] = useState({
    assignedCloserId: '',
    assignedPMId: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganizationId) return;
    await createProject.mutateAsync({
      title: form.title,
      pricingType: form.pricingType,
      organizationId: activeOrganizationId,
      jobUrl: form.jobUrl || undefined,
      jobDescription: form.jobDescription || undefined,
      hourlyRateMin: form.hourlyRateMin ? parseFloat(form.hourlyRateMin) : undefined,
      hourlyRateMax: form.hourlyRateMax ? parseFloat(form.hourlyRateMax) : undefined,
      fixedPrice: form.fixedPrice ? parseFloat(form.fixedPrice) : undefined,
      nicheId: form.nicheId && form.nicheId !== 'none' ? form.nicheId : undefined,
    });
    setForm({
      title: '',
      pricingType: PricingType.HOURLY,
      jobUrl: '',
      jobDescription: '',
      hourlyRateMin: '',
      hourlyRateMax: '',
      fixedPrice: '',
      nicheId: '',
    });
    setCreateOpen(false);
  };

  const openAssign = (projectId: string) => {
    setAssigningProjectId(projectId);
    setAssignForm({ assignedCloserId: '', assignedPMId: '' });
    setAssignOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await assignProject.mutateAsync({
      id: assigningProjectId,
      assignedCloserId:
        assignForm.assignedCloserId && assignForm.assignedCloserId !== 'none'
          ? assignForm.assignedCloserId
          : undefined,
      assignedPMId:
        assignForm.assignedPMId && assignForm.assignedPMId !== 'none'
          ? assignForm.assignedPMId
          : undefined,
    });
    setAssignOpen(false);
  };

  const userName = (u?: { firstName?: string; lastName?: string; email: string }) => {
    if (!u) return '---';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return name || u.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Full pipeline: Discovery to Delivery</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Discover a new job and add it to the pipeline.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="projTitle">Job Title *</Label>
                  <Input
                    id="projTitle"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Full-Stack Developer for SaaS Platform"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="projPricing">Pricing Type *</Label>
                    <Select
                      value={form.pricingType}
                      onValueChange={(v) => setForm((p) => ({ ...p, pricingType: v }))}
                    >
                      <SelectTrigger id="projPricing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PricingType.HOURLY}>Hourly</SelectItem>
                        <SelectItem value={PricingType.FIXED}>Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="projNiche">Niche</Label>
                    <Select
                      value={form.nicheId}
                      onValueChange={(v) => setForm((p) => ({ ...p, nicheId: v }))}
                    >
                      <SelectTrigger id="projNiche">
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {niches?.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projUrl">Job URL</Label>
                  <Input
                    id="projUrl"
                    value={form.jobUrl}
                    onChange={(e) => setForm((p) => ({ ...p, jobUrl: e.target.value }))}
                    placeholder="https://www.upwork.com/jobs/..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projDesc">Job Description</Label>
                  <Textarea
                    id="projDesc"
                    value={form.jobDescription}
                    onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))}
                    placeholder="Paste the job description..."
                    rows={3}
                  />
                </div>
                {form.pricingType === PricingType.HOURLY ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="projRateMin">Hourly Min ($)</Label>
                      <Input
                        id="projRateMin"
                        type="number"
                        min="0"
                        value={form.hourlyRateMin}
                        onChange={(e) => setForm((p) => ({ ...p, hourlyRateMin: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="projRateMax">Hourly Max ($)</Label>
                      <Input
                        id="projRateMax"
                        type="number"
                        min="0"
                        value={form.hourlyRateMax}
                        onChange={(e) => setForm((p) => ({ ...p, hourlyRateMax: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="projFixed">Fixed Price ($)</Label>
                    <Input
                      id="projFixed"
                      type="number"
                      min="0"
                      value={form.fixedPrice}
                      onChange={(e) => setForm((p) => ({ ...p, fixedPrice: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createProject.isPending || !form.title}>
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <form onSubmit={handleAssign}>
            <DialogHeader>
              <DialogTitle>Assign Project</DialogTitle>
              <DialogDescription>Assign a closer and/or project manager.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Closer</Label>
                <Select
                  value={assignForm.assignedCloserId}
                  onValueChange={(v) => setAssignForm((p) => ({ ...p, assignedCloserId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select closer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {closers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {userName(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Project Manager</Label>
                <Select
                  value={assignForm.assignedPMId}
                  onValueChange={(v) => setAssignForm((p) => ({ ...p, assignedPMId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {pms.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {userName(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={assignProject.isPending}>
                {assignProject.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pipeline summary counts */}
      {pipelineCounts && pipelineCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pipelineCounts.map(({ stage, count }) => (
            <button
              key={stage}
              onClick={() => {
                setStageFilter(stageFilter === stage ? 'all' : stage);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                stageFilter === stage
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              }`}
            >
              {STAGE_LABELS[stage] ?? stage}: {count}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} projects` : 'Loading...'}
        </span>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Projects Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Org</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead>Bid Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[140px]" />
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
                    Failed to load projects. {(error as Error)?.message || 'Unknown error'}
                  </TableCell>
                </TableRow>
              )}

              {data?.data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {project.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STAGE_VARIANT[project.stage] || 'secondary'}>
                      {STAGE_LABELS[project.stage] ?? project.stage.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.organization?.name ?? '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.niche?.name ?? '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {userName(project.assignedCloser)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.bidAmount ? `$${project.bidAmount.toLocaleString()}` : '---'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => advanceStage.mutate(project.id)}
                        disabled={
                          advanceStage.isPending ||
                          project.stage === ProjectStage.COMPLETED ||
                          project.stage === ProjectStage.LOST ||
                          project.stage === ProjectStage.CANCELLED
                        }
                        title="Advance Stage"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssign(project.id)}
                        title="Assign"
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {data && data.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
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
