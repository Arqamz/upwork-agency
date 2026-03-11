'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useProjects, useCreateProject, useAdvanceStage } from '@/hooks/use-projects';
import { useNiches } from '@/hooks/use-niches';
import { useUsers } from '@/hooks/use-users';
import { useAuthContext } from '@/components/auth-provider';
import { ProjectDetailSheet } from '@/components/projects/project-detail-sheet';
import { KanbanColumn } from '@/components/projects/kanban-column';
import { ProjectCard } from '@/components/projects/project-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Archive, XCircle, Trophy } from 'lucide-react';
import { ProjectStage, PricingType } from '@/types';
import type { Project } from '@/types';
import { STAGE_LABELS } from '@/components/projects/project-detail-sheet';

// ── Column definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: string;
  title: string;
  stages: ProjectStage[];
  color: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'discovered',
    title: 'Discovered',
    stages: [ProjectStage.DISCOVERED],
    color: 'bg-slate-400',
  },
  { id: 'scripted', title: 'Scripted', stages: [ProjectStage.SCRIPTED], color: 'bg-blue-400' },
  {
    id: 'under_review',
    title: 'Under Review',
    stages: [ProjectStage.UNDER_REVIEW],
    color: 'bg-yellow-400',
  },
  {
    id: 'bid_submitted',
    title: 'Bid Submitted',
    stages: [ProjectStage.BID_SUBMITTED],
    color: 'bg-purple-400',
  },
  {
    id: 'bid_active',
    title: 'Bid Active',
    stages: [ProjectStage.VIEWED, ProjectStage.MESSAGED, ProjectStage.INTERVIEW],
    color: 'bg-orange-400',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    stages: [ProjectStage.IN_PROGRESS],
    color: 'bg-green-400',
  },
];

const COLUMN_ORDER = COLUMNS.map((c) => c.id);

const HIDDEN_STAGES = [
  ProjectStage.COMPLETED,
  ProjectStage.LOST,
  ProjectStage.CANCELLED,
  ProjectStage.WON,
  ProjectStage.ASSIGNED,
].join(',');

// ── Role-based column visibility ──────────────────────────────────────────────

const ROLE_VISIBLE_COLUMNS: Record<string, string[]> = {
  admin: COLUMN_ORDER,
  lead: COLUMN_ORDER,
  bidder: ['discovered', 'scripted'],
  closer: ['scripted', 'under_review', 'bid_submitted', 'bid_active'],
  project_manager: ['in_progress'],
};

const BLOCKED_ROLES = ['operator', 'qa'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getColumnForStage(stage: ProjectStage): string | null {
  for (const col of COLUMNS) {
    if (col.stages.includes(stage)) return col.id;
  }
  return null;
}

function getNextColumnId(columnId: string): string | null {
  const idx = COLUMN_ORDER.indexOf(columnId);
  return idx >= 0 && idx < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[idx + 1] : null;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const { user, activeOrganizationId } = useAuthContext();
  const role = user?.role?.toLowerCase() ?? '';

  useEffect(() => {
    if (role && BLOCKED_ROLES.includes(role)) {
      router.replace('/tasks');
    }
  }, [role, router]);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Main board query — excludes terminal + hidden stages
  const { data: mainData, isLoading } = useProjects({
    limit: 200,
    excludeStages: HIDDEN_STAGES,
    organizationId: activeOrganizationId ?? undefined,
  });

  // Separate queries for toggle sections
  const { data: completedData } = useProjects({
    limit: 50,
    stage: ProjectStage.COMPLETED,
    organizationId: activeOrganizationId ?? undefined,
  });
  const { data: lostData } = useProjects({
    limit: 50,
    stage: ProjectStage.LOST,
    organizationId: activeOrganizationId ?? undefined,
  });
  const { data: cancelledData } = useProjects({
    limit: 50,
    stage: ProjectStage.CANCELLED,
    organizationId: activeOrganizationId ?? undefined,
  });

  const advanceStage = useAdvanceStage();
  const createProject = useCreateProject();
  const { data: niches } = useNiches(activeOrganizationId ?? undefined);
  const { data: usersData } = useUsers({ limit: 100 });
  const closers = usersData?.data.filter((u) => u.role?.name === 'closer') ?? [];

  // Bucket projects into columns
  const columnProjects = useMemo(() => {
    const buckets: Record<string, Project[]> = {};
    for (const col of COLUMNS) {
      buckets[col.id] = [];
    }
    if (mainData?.data) {
      for (const project of mainData.data) {
        const colId = getColumnForStage(project.stage);
        if (colId && buckets[colId]) {
          buckets[colId].push(project);
        }
      }
    }
    return buckets;
  }, [mainData]);

  // Visible columns based on role
  const visibleColumns = useMemo(() => {
    const allowed = ROLE_VISIBLE_COLUMNS[role] ?? COLUMN_ORDER;
    return COLUMNS.filter((c) => allowed.includes(c.id));
  }, [role]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const project = mainData?.data.find((p) => p.id === event.active.id);
      setActiveProject(project ?? null);
    },
    [mainData],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveProject(null);
      const { active, over } = event;
      if (!over || !active) return;

      const project = mainData?.data.find((p) => p.id === active.id);
      if (!project) return;

      const sourceCol = getColumnForStage(project.stage);
      const targetCol = over.id as string;

      // Only allow drops on columns (not other cards)
      if (!COLUMN_ORDER.includes(targetCol)) return;
      // Same column — no-op
      if (sourceCol === targetCol) return;
      // Validate: can only move to the NEXT column
      const nextCol = sourceCol ? getNextColumnId(sourceCol) : null;
      if (targetCol !== nextCol) return;

      // Execute advance
      advanceStage.mutate(project.id);
    },
    [mainData, advanceStage],
  );

  const handleCardClick = useCallback((project: Project) => {
    setSelectedProjectId(project.id);
  }, []);

  // Create project form
  const [form, setForm] = useState({
    title: '',
    pricingType: PricingType.HOURLY as string,
    jobUrl: '',
    jobDescription: '',
    hourlyRateMin: '',
    hourlyRateMax: '',
    fixedPrice: '',
    nicheId: '',
    assignedCloserId: '',
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
      discoveredById: user?.id,
      assignedCloserId:
        form.assignedCloserId && form.assignedCloserId !== 'none'
          ? form.assignedCloserId
          : undefined,
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
      assignedCloserId: '',
    });
    setCreateOpen(false);
  };

  const canCreate = ['admin', 'lead'].includes(role);

  if (BLOCKED_ROLES.includes(role)) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards to the next column to advance stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle buttons for terminal states */}
          <Button
            variant={showCompleted ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowCompleted((v) => !v)}
          >
            <Trophy className="mr-1.5 h-3 w-3" />
            Completed
            {completedData?.meta.total ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {completedData.meta.total}
              </Badge>
            ) : null}
          </Button>
          <Button
            variant={showLost ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowLost((v) => !v)}
          >
            <XCircle className="mr-1.5 h-3 w-3" />
            Lost
            {lostData?.meta.total ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {lostData.meta.total}
              </Badge>
            ) : null}
          </Button>
          <Button
            variant={showCancelled ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowCancelled((v) => !v)}
          >
            <Archive className="mr-1.5 h-3 w-3" />
            Cancelled
            {cancelledData?.meta.total ? (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {cancelledData.meta.total}
              </Badge>
            ) : null}
          </Button>

          {canCreate && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
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
                    {/* Closer assignment — admin/lead only */}
                    <div className="grid gap-2">
                      <Label htmlFor="projCloser">Assign Closer</Label>
                      <Select
                        value={form.assignedCloserId}
                        onValueChange={(v) => setForm((p) => ({ ...p, assignedCloserId: v }))}
                      >
                        <SelectTrigger id="projCloser">
                          <SelectValue placeholder="Select closer (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {closers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                            onChange={(e) =>
                              setForm((p) => ({ ...p, hourlyRateMin: e.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="projRateMax">Hourly Max ($)</Label>
                          <Input
                            id="projRateMax"
                            type="number"
                            min="0"
                            value={form.hourlyRateMax}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, hourlyRateMax: e.target.value }))
                            }
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
          )}
        </div>
      </div>

      {/* ── Kanban Board ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {isLoading ? (
          <div className="flex h-full gap-4">
            {visibleColumns.map((col) => (
              <div
                key={col.id}
                className="flex h-full min-w-[280px] max-w-[320px] flex-1 animate-pulse flex-col rounded-lg border bg-muted/30"
              >
                <div className="border-b px-3 py-2.5">
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-md bg-muted/50" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-4">
              {visibleColumns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  count={columnProjects[col.id]?.length ?? 0}
                  projects={columnProjects[col.id] ?? []}
                  color={col.color}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeProject ? (
                <div className="w-[280px]">
                  <ProjectCard project={activeProject} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Toggle sections: Completed / Lost / Cancelled ─────────────── */}
      {(showCompleted || showLost || showCancelled) && (
        <div className="shrink-0 space-y-3 border-t pt-3">
          {showCompleted && completedData?.data && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" />
                Completed ({completedData.meta.total})
              </h3>
              <div className="flex flex-wrap gap-2">
                {completedData.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="font-medium">{p.title}</span>
                    {p.niche && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {p.niche.name}
                      </Badge>
                    )}
                  </button>
                ))}
                {completedData.data.length === 0 && (
                  <p className="text-xs text-muted-foreground">No completed projects.</p>
                )}
              </div>
            </div>
          )}
          {showLost && lostData?.data && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                Lost ({lostData.meta.total})
              </h3>
              <div className="flex flex-wrap gap-2">
                {lostData.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="font-medium">{p.title}</span>
                  </button>
                ))}
                {lostData.data.length === 0 && (
                  <p className="text-xs text-muted-foreground">No lost projects.</p>
                )}
              </div>
            </div>
          )}
          {showCancelled && cancelledData?.data && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Archive className="h-3.5 w-3.5" />
                Cancelled ({cancelledData.meta.total})
              </h3>
              <div className="flex flex-wrap gap-2">
                {cancelledData.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="font-medium">{p.title}</span>
                  </button>
                ))}
                {cancelledData.data.length === 0 && (
                  <p className="text-xs text-muted-foreground">No cancelled projects.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Project Detail Sheet ──────────────────────────────────────── */}
      <ProjectDetailSheet
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}
