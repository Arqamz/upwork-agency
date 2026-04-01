'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';
import { useAuthContext } from '@/components/auth-provider';
import { ProjectStage, PricingType } from '@/types';
import type { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Briefcase,
  ListTodo,
  Calendar,
  DollarSign,
  Clock,
  Link2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPricingLabel(project: Project): string {
  if (project.contractValue) {
    return `Contract · ${formatCurrency(project.contractValue)}`;
  }
  if (project.pricingType === PricingType.FIXED && project.fixedPrice != null) {
    return `Fixed · ${formatCurrency(project.fixedPrice)}`;
  }
  if (project.pricingType === PricingType.HOURLY) {
    const min = project.hourlyRateMin;
    const max = project.hourlyRateMax;
    if (min != null && max != null) {
      return `Hourly · $${min}-$${max}/hr`;
    }
    if (min != null) return `Hourly · $${min}/hr`;
    if (max != null) return `Hourly · up to $${max}/hr`;
    return 'Hourly';
  }
  return project.pricingType ?? 'N/A';
}

const STAGE_BADGE: Record<string, { label: string; className: string }> = {
  [ProjectStage.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  [ProjectStage.COMPLETED]: {
    label: 'Completed',
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { activeOrganizationId } = useAuthContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useProjects({
    limit: 200,
    organizationId: activeOrganizationId ?? undefined,
  });

  const filteredProjects = useMemo(() => {
    if (!data?.data) return [];

    return data.data.filter((p) => {
      // Only delivery-phase projects
      if (p.stage !== ProjectStage.IN_PROGRESS && p.stage !== ProjectStage.COMPLETED) {
        return false;
      }

      // Status filter
      if (statusFilter === 'in_progress' && p.stage !== ProjectStage.IN_PROGRESS) return false;
      if (statusFilter === 'completed' && p.stage !== ProjectStage.COMPLETED) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [data, search, statusFilter]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-primary" />
          <div>
            <h1 className="gradient-text text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">Active and completed delivery projects</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border bg-muted/30 p-5 space-y-3">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted/60" />
                <div className="h-4 w-2/3 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground/70">
              {search ? 'Try adjusting your search or filter' : 'No delivery-phase projects yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const badge = STAGE_BADGE[project.stage];
              const taskCount = project._count?.tasks ?? 0;
              const meetingCount = project._count?.meetings ?? 0;
              const milestoneCount = project._count?.milestones ?? 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-xl border bg-card p-5 space-y-3 transition-all hover:shadow-glow-sm hover:border-primary/30"
                >
                  {/* Title + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate text-sm leading-snug">{project.title}</h3>
                    {badge && (
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] ${badge.className}`}
                      >
                        {badge.label}
                      </Badge>
                    )}
                  </div>

                  {/* Client */}
                  <p className="text-xs text-muted-foreground">
                    {project.clientName || 'No client'}
                  </p>

                  {/* Pricing */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>{getPricingLabel(project)}</span>
                  </div>

                  {/* Task / Meeting summary */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListTodo className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {taskCount} task{taskCount !== 1 ? 's' : ''} &middot; {meetingCount} meeting
                      {meetingCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Milestones */}
                  {milestoneCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {project.endDate ? (
                      <>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Ends {formatDate(project.endDate)}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30"
                        >
                          Ongoing
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Open link indicator */}
                  <div className="flex justify-end pt-1">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
