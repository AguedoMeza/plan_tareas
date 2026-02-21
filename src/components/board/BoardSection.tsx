// src/components/board/BoardSection.tsx
// A collapsible section (Activos / Backlog / Archivados)

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectCard } from '@/components/board/ProjectCard';
import { ReactSortable } from 'react-sortablejs';
import { useAppStore } from '@/store/appStore';
import type { Proyecto } from '@/types';

interface BoardSectionProps {
  title: string;
  proyectos: { proyecto: Proyecto; originalIndex: number }[];
  emptyMessage?: string;
  defaultCollapsed?: boolean;
  sortable?: boolean;
}

interface SortableItem {
  id: string;
  proyecto: Proyecto;
  originalIndex: number;
}

const DOT_COLOR: Record<string, string> = {
  Activos:    'bg-emerald-500',
  Backlog:    'bg-muted-foreground/60',
  Archivados: 'bg-muted-foreground/30',
};

export function BoardSection({
  title,
  proyectos,
  emptyMessage,
  defaultCollapsed = false,
  sortable = false,
}: BoardSectionProps) {
  const [sectionCollapsed, setSectionCollapsed] = useState(defaultCollapsed);
  const reorderProjects = useAppStore(s => s.reorderProjects);
  const allProyectos = useAppStore(s => s.proyectos);

  if (proyectos.length === 0 && !emptyMessage) return null;

  const sortableItems: SortableItem[] = proyectos.map(({ proyecto, originalIndex }) => ({
    id: String(originalIndex),
    proyecto,
    originalIndex,
  }));

  const handleSortEnd = (newOrder: SortableItem[]) => {
    const newAllProyectos = [...allProyectos];
    const sectionOriginalIndices = proyectos.map(p => p.originalIndex).sort((a, b) => a - b);
    newOrder.forEach((item, idx) => {
      newAllProyectos[sectionOriginalIndices[idx]] = item.proyecto;
    });
    reorderProjects(newAllProyectos);
  };

  return (
    <div className="mb-12">
      {/* Section header */}
      <button
        className="flex items-center gap-3 mb-5 w-full text-left"
        onClick={() => setSectionCollapsed(v => !v)}
      >
        <span className={cn('w-3 h-3 rounded-full flex-shrink-0', DOT_COLOR[title] ?? 'bg-muted-foreground/40')} />
        <span className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
          {title}
        </span>
        <span className="text-[12px] text-muted-foreground bg-muted rounded-full px-3 py-1 leading-none font-semibold">
          {proyectos.length}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground/40 ml-auto transition-transform duration-200',
            sectionCollapsed && '-rotate-90'
          )}
        />
      </button>

      {!sectionCollapsed && (
        <>
          {proyectos.length === 0 && emptyMessage ? (
            <p className="text-sm text-muted-foreground pl-6">{emptyMessage}</p>
          ) : sortable ? (
            <ReactSortable
              list={sortableItems}
              setList={handleSortEnd}
              handle=".drag-handle"
              animation={150}
              ghostClass="sortable-ghost"
              className="space-y-0"
            >
              {sortableItems.map(item => (
                <div key={item.id}>
                  <ProjectCard proyecto={item.proyecto} projectIndex={item.originalIndex} />
                </div>
              ))}
            </ReactSortable>
          ) : (
            <div>
              {proyectos.map(({ proyecto, originalIndex }) => (
                <ProjectCard
                  key={originalIndex}
                  proyecto={proyecto}
                  projectIndex={originalIndex}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
