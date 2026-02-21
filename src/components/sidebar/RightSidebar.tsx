// src/components/sidebar/RightSidebar.tsx
// Contextual right sidebar: board stats, project progress, upcoming deadlines

import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  Zap, AlertOctagon, FolderOpen, Calendar,
  CheckCircle2, ChevronLeft, ChevronRight,
  Clock, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Proyecto, Elemento } from '@/types';

// ─── Data computation ─────────────────────────────────────────────────────────

interface BoardStats {
  totalActive: number;
  totalBacklog: number;
  vivos: number;
  blocked: number;
  completed: number;
  total: number;
  progress: number;
}

function computeStats(proyectos: Proyecto[]): BoardStats {
  let vivos = 0, blocked = 0, completed = 0, total = 0;
  let totalActive = 0, totalBacklog = 0;

  function walkEl(el: Elemento) {
    if (!Array.isArray(el.elementos) || el.elementos.length === 0) {
      total++;
      if (el.estado === 'Completado') completed++;
      else if (el.estado === 'Bloqueado') blocked++;
      else if (el.estado === 'Pendiente' || el.estado === 'En progreso') vivos++;
    } else {
      el.elementos.forEach(walkEl);
    }
  }

  proyectos.forEach(p => {
    if (p.estadoProyecto === 'Activo') totalActive++;
    else if (p.estadoProyecto === 'Backlog') totalBacklog++;
    if (p.estadoProyecto !== 'Archivado') {
      (p.elementos || []).forEach(walkEl);
    }
  });

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { totalActive, totalBacklog, vivos, blocked, completed, total, progress };
}

interface ProjectRow {
  nombre: string;
  progress: number;
  vivos: number;
  estado: string;
}

function computeProjectRow(proyecto: Proyecto): ProjectRow {
  let total = 0, completed = 0, vivos = 0;

  function walkEl(el: Elemento) {
    if (!Array.isArray(el.elementos) || el.elementos.length === 0) {
      total++;
      if (el.estado === 'Completado') completed++;
      else if (el.estado === 'Pendiente' || el.estado === 'En progreso') vivos++;
    } else {
      el.elementos.forEach(walkEl);
    }
  }

  (proyecto.elementos || []).forEach(walkEl);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { nombre: proyecto.nombre, progress, vivos, estado: proyecto.estadoProyecto };
}

interface DeadlineItem {
  nombre: string;
  proyecto: string;
  daysLeft: number;
  estado: string;
}

function collectDeadlines(proyectos: Proyecto[]): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  function walkEl(el: Elemento, projectName: string) {
    if (el.deadline && el.estado !== 'Completado') {
      const d = new Date(el.deadline + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const daysLeft = Math.ceil((d.getTime() - now.getTime()) / 86400000);
        if (daysLeft <= 14) {
          items.push({ nombre: el.nombre, proyecto: projectName, daysLeft, estado: el.estado });
        }
      }
    }
    (el.elementos || []).forEach(child => walkEl(child, projectName));
  }

  proyectos.forEach(p => {
    if (p.estadoProyecto !== 'Archivado') {
      (p.elementos || []).forEach(el => walkEl(el, p.nombre));
    }
  });

  return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 7);
}

function deadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `−${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'hoy';
  if (daysLeft === 1) return 'mañana';
  return `${daysLeft}d`;
}

function deadlineColor(daysLeft: number): string {
  if (daysLeft < 0) return '#FF5A6A';
  if (daysLeft <= 1) return '#FF5A6A';
  if (daysLeft <= 3) return '#F5A524';
  return 'rgba(231,238,248,.35)';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(231,238,248,.28)] mb-3 select-none">
      {children}
    </p>
  );
}

function Divider() {
  return <Separator className="bg-[rgba(255,255,255,.05)]" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RightSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function RightSidebar({ collapsed, onToggle }: RightSidebarProps) {
  const proyectos = useAppStore(s => s.proyectos);
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const activeBoard = boards[activeBoardId];

  const stats = useMemo(() => computeStats(proyectos), [proyectos]);

  const projectList = useMemo(() =>
    proyectos
      .filter(p => p.estadoProyecto !== 'Archivado')
      .map(computeProjectRow)
      .slice(0, 9),
    [proyectos]
  );

  const deadlines = useMemo(() => collectDeadlines(proyectos), [proyectos]);

  return (
    <aside
      className={cn(
        'relative shrink-0 border-l border-[rgba(255,255,255,.055)] bg-[#0d1520] flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-9' : 'w-60'
      )}
    >
      {/* Toggle button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              'absolute z-10 flex items-center justify-center h-7 w-7 rounded-full',
              'border border-[rgba(255,255,255,.08)] bg-[#111822]',
              'text-[rgba(231,238,248,.4)] hover:text-[#E7EEF8] hover:border-[rgba(255,255,255,.15)]',
              'transition-colors duration-150 cursor-pointer',
              collapsed ? 'top-3 left-1' : 'top-3 right-2'
            )}
          >
            {collapsed
              ? <ChevronLeft className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            }
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {collapsed ? 'Expandir panel' : 'Colapsar panel'}
        </TooltipContent>
      </Tooltip>

      {/* Content — hidden when collapsed */}
      <ScrollArea
        className={cn(
          'flex flex-col flex-1 transition-opacity duration-200',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        style={{ width: '240px' }} // fixed width to avoid reflow during transition
      >
        {/* Board header — 52px to match toolbar height */}
        <div className="flex items-center gap-2 px-4 h-[52px] shrink-0 border-b border-[rgba(255,255,255,.06)]">
          <TrendingUp className="h-3.5 w-3.5 text-[#1BD27A] shrink-0" />
          <h2 className="text-[13px] font-semibold text-[rgba(231,238,248,.75)] truncate">
            {activeBoard?.name || '—'}
          </h2>
        </div>

        {/* Stats */}
        <div className="px-4 py-4">
          <SectionLabel>Resumen</SectionLabel>
          <div className="flex flex-col gap-3">
            {/* Projects active */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5 text-[rgba(231,238,248,.3)]" />
                <span className="text-[12px] text-[rgba(231,238,248,.65)]">Activos</span>
              </div>
              <span className="font-mono text-[12px] text-[#E7EEF8] font-semibold tabular-nums">
                {stats.totalActive}
              </span>
            </div>

            {/* Vivas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#1BD27A]" />
                <span className="text-[12px] text-[rgba(231,238,248,.65)]">Vivas</span>
              </div>
              <span className="font-mono text-[12px] text-[#1BD27A] font-semibold tabular-nums">
                {stats.vivos}
              </span>
            </div>

            {/* Blocked */}
            {stats.blocked > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-3.5 w-3.5 text-[#FF5A6A]" />
                  <span className="text-[12px] text-[rgba(231,238,248,.65)]">Bloqueadas</span>
                </div>
                <span className="font-mono text-[12px] text-[#FF5A6A] font-semibold tabular-nums">
                  {stats.blocked}
                </span>
              </div>
            )}

            {/* Completed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[rgba(231,238,248,.25)]" />
                <span className="text-[12px] text-[rgba(231,238,248,.65)]">Completas</span>
              </div>
              <span className="font-mono text-[12px] text-[rgba(231,238,248,.4)] tabular-nums">
                {stats.completed}<span className="text-[rgba(231,238,248,.25)]">/{stats.total}</span>
              </span>
            </div>
          </div>

          {/* Overall progress bar */}
          {stats.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[rgba(231,238,248,.25)]">
                  Progreso global
                </span>
                <span className="font-mono text-[11px] text-[rgba(231,238,248,.45)] tabular-nums">
                  {stats.progress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[rgba(255,255,255,.055)]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${stats.progress}%`,
                    background: stats.progress === 100
                      ? '#1BD27A'
                      : 'linear-gradient(90deg, rgba(27,210,122,.5), #1BD27A)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Projects list */}
        {projectList.length > 0 && (
          <>
            <div className="px-4 py-4">
              <SectionLabel>Proyectos</SectionLabel>
              <div className="flex flex-col gap-3.5">
                {projectList.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span
                        className="text-[12px] text-[rgba(231,238,248,.75)] truncate flex-1 pr-2 leading-tight"
                        title={p.nombre}
                      >
                        {p.nombre}
                      </span>
                      <span className="font-mono text-[10px] text-[rgba(231,238,248,.35)] shrink-0 tabular-nums">
                        {p.progress}%
                      </span>
                    </div>
                    <div className="h-[3px] rounded-full bg-[rgba(255,255,255,.05)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${p.progress}%`,
                          background:
                            p.progress === 100
                              ? '#1BD27A'
                              : p.estado === 'Backlog'
                              ? 'rgba(231,238,248,.15)'
                              : 'linear-gradient(90deg, rgba(27,210,122,.4), rgba(27,210,122,.75))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Upcoming deadlines */}
        {deadlines.length > 0 ? (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3.5 w-3.5 text-[rgba(231,238,248,.28)]" />
              <SectionLabel>Próximos vencimientos</SectionLabel>
            </div>
            <div className="flex flex-col gap-3">
              {deadlines.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="font-mono text-[11px] shrink-0 mt-0.5 w-11 text-right leading-tight tabular-nums"
                    style={{ color: deadlineColor(d.daysLeft) }}
                  >
                    {deadlineLabel(d.daysLeft)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[rgba(231,238,248,.75)] truncate leading-tight">
                      {d.nombre}
                    </p>
                    <p className="text-[10px] text-[rgba(231,238,248,.35)] truncate mt-0.5">
                      {d.proyecto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-[rgba(231,238,248,.28)]" />
              <SectionLabel>Próximos vencimientos</SectionLabel>
            </div>
            <p className="text-[10px] text-[rgba(231,238,248,.2)] italic">
              Sin vencimientos próximos
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="h-4" />
      </ScrollArea>
    </aside>
  );
}
