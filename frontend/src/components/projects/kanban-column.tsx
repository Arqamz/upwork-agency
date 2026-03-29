'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import { ProjectCard } from './project-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  projects: Project[];
  color: string;
  onCardClick: (project: Project) => void;
  index?: number;
}

export function KanbanColumn({
  id,
  title,
  count,
  projects,
  color,
  onCardClick,
  index = 0,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column', id },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      className={cn(
        'flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-md transition-all duration-200',
        isOver &&
          'border-amber/40 bg-amber/5 shadow-[0_0_20px_hsl(var(--amber)/0.15)] ring-1 ring-amber/25',
      )}
    >
      {/* Column Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span
          className={cn(
            'ml-auto rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
            count > 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-x-hidden overflow-y-auto p-2 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border)/0.6)_transparent]"
      >
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {projects.map((project, cardIndex) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onCardClick(project)}
                index={cardIndex}
              />
            ))}
            {projects.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground/60">
                No projects
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  );
}
