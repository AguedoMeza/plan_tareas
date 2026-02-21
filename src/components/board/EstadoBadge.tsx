// src/components/board/EstadoBadge.tsx
// Design system: pills con colores semánticos
import { cn } from '@/lib/utils';
import type { EstadoElemento, EstadoProyecto } from '@/types';

// ── Estado elemento ───────────────────────────────────────────────────────────
// Done:Accent(#1BD27A)  Progress:#F5A524  Blocked:#FF5A6A  Pending:muted
const ESTADO_STYLES: Record<EstadoElemento, string> = {
  'Completado':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  'En progreso':  'bg-amber-500/10   text-amber-400   border-amber-500/25',
  'Bloqueado':    'bg-rose-500/10    text-rose-400    border-rose-500/25',
  'Pendiente':    'text-muted-foreground border-border/60',
  'Backlog':      'text-muted-foreground/60 border-border/40',
};

interface EstadoElementoBadgeProps {
  estado: EstadoElemento;
  className?: string;
  onClick?: () => void;
}

export function EstadoBadge({ estado, className, onClick }: EstadoElementoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors select-none',
        ESTADO_STYLES[estado] ?? 'border-border text-muted-foreground',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {estado}
    </span>
  );
}

// ── Estado proyecto ───────────────────────────────────────────────────────────
const PROYECTO_ESTADO_STYLES: Record<EstadoProyecto, string> = {
  'Activo':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  'Backlog':   'text-muted-foreground border-border/60',
  'Archivado': 'text-muted-foreground/50 border-border/40',
};

interface ProyectoEstadoBadgeProps {
  estado: EstadoProyecto;
  className?: string;
}

export function ProyectoEstadoBadge({ estado, className }: ProyectoEstadoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        PROYECTO_ESTADO_STYLES[estado] ?? 'border-border text-muted-foreground',
        className
      )}
    >
      {estado}
    </span>
  );
}

// ── Prioridad ─────────────────────────────────────────────────────────────────
const PRIORIDAD_STYLES: Record<string, string> = {
  '1': 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  '2': 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  '3': 'text-muted-foreground border-border/40',
};
const PRIORIDAD_LABELS: Record<string, string> = { '1': 'Alta', '2': 'Media', '3': 'Baja' };

interface PrioridadBadgeProps {
  prioridad?: string;
  className?: string;
}

export function PrioridadBadge({ prioridad, className }: PrioridadBadgeProps) {
  if (!prioridad) return null;
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
      PRIORIDAD_STYLES[prioridad] ?? 'border-border text-muted-foreground',
      className
    )}>
      {PRIORIDAD_LABELS[prioridad] ?? prioridad}
    </span>
  );
}
