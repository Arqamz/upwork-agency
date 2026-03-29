'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types';
import { ProjectStage, PricingType, ReviewStatus } from '@/types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  index?: number;
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
  let status: string | undefined | null = null;
  if (project.stage === ProjectStage.UNDER_REVIEW) {
    status = project.reviewStatus;
  } else if (project.stage === ProjectStage.SCRIPT_REVIEW) {
    status = project.scriptReviewStatus;
  }

  if (!status) return null;

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
  const v = variants[status];
  if (!v) return null;
  return (
    <Badge variant="outline" className={cn('text-[10px]', v.className)}>
      {v.label}
    </Badge>
  );
}

export function ProjectCard({ project, onClick, index = 0 }: ProjectCardProps) {
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
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      whileHover={isDragging ? {} : { scale: 1.015, y: -1 }}
      whileTap={isDragging ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur-sm',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-primary/30 hover:shadow-glow-sm',
        isDragging && 'ring-2 ring-primary/30 shadow-lg shadow-primary/10',
      )}
    >
      {/* Title */}
      <p className="line-clamp-2 text-sm font-medium leading-tight">{project.title}</p>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {subStageBadge && (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/20 text-[10px] text-blue-400"
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
    </motion.div>
  );
}
