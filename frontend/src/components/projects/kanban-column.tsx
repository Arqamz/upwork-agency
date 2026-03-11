'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
}

export function KanbanColumn({
  id,
  title,
  count,
  projects,
  color,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        'flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col rounded-lg border bg-muted/30',
        isOver && 'ring-2 ring-primary/50',
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>
      </div>

      {/* Cards Area */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2">
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onCardClick(project)}
              />
            ))}
            {projects.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                No projects
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
