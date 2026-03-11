'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types';
import { ProjectStage, PricingType, ReviewStatus } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const SUB_STAGE_LABELS: Partial<Record<ProjectStage, string>> = {
  [ProjectStage.VIEWED]: 'Viewed',
  [ProjectStage.MESSAGED]: 'Messaged',
  [ProjectStage.INTERVIEW]: 'Interview',
};

function formatPrice(project: Project): string {
  if (project.bidAmount) return `$${project.bidAmount.toLocaleString()}`;
  if (project.pricingType === PricingType.FIXED && project.fixedPrice) {
    return `$${project.fixedPrice.toLocaleString()}`;
  }
  if (project.pricingType === PricingType.HOURLY) {
    const min = project.hourlyRateMin ?? 0;
    const max = project.hourlyRateMax ?? 0;
    if (min && max) return `$${min}-${max}/hr`;
    if (min) return `$${min}/hr`;
    return '';
  }
  return '';
}

function getReviewBadge(project: Project) {
  if (project.stage !== ProjectStage.UNDER_REVIEW || !project.reviewStatus) return null;
  const variants: Record<string, { label: string; className: string }> = {
    [ReviewStatus.PENDING]: {
      label: 'Pending Review',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    [ReviewStatus.APPROVED]: {
      label: 'Approved',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    [ReviewStatus.REJECTED]: {
      label: 'Rejected',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  };
  const v = variants[project.reviewStatus];
  if (!v) return null;
  return (
    <Badge variant="outline" className={cn('text-[10px]', v.className)}>
      {v.label}
    </Badge>
  );
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: 'project', project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const price = formatPrice(project);
  const closerName = project.assignedCloser
    ? `${project.assignedCloser.firstName ?? ''} ${project.assignedCloser.lastName ?? ''}`.trim()
    : null;

  // Sub-stage badge for the "Bid Active" grouped column (VIEWED, MESSAGED, INTERVIEW)
  const subStageBadge = SUB_STAGE_LABELS[project.stage];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/50',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Title */}
      <p className="line-clamp-2 text-sm font-medium leading-tight">{project.title}</p>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {subStageBadge && (
          <Badge
            variant="outline"
            className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            {subStageBadge}
          </Badge>
        )}
        {getReviewBadge(project)}
        {project.niche && (
          <Badge variant="secondary" className="text-[10px]">
            {project.niche.name}
          </Badge>
        )}
      </div>

      {/* Footer: closer + price */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{closerName || 'Unassigned'}</span>
        {price && <span className="font-medium text-foreground">{price}</span>}
      </div>

      {/* Video count indicator */}
      {(project._count?.videoProposals ?? 0) > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          {project._count?.videoProposals} video
          {(project._count?.videoProposals ?? 0) > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
