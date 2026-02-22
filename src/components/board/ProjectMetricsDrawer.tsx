// src/components/board/ProjectMetricsDrawer.tsx
// Per-project metrics drawer — 2-col chart layout, falta-first hierarchy

import { useMemo } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { X, CheckCircle2, Clock, AlertOctagon, Circle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Proyecto, Elemento, EstadoElemento } from '@/types';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const CFG: Record<EstadoElemento, { ring: string; text: string; label: string }> = {
  'Completado':  { ring: '#1BD27A',              text: '#1BD27A',              label: 'Completadas'  },
  'En progreso': { ring: '#F5A524',              text: '#F5A524',              label: 'En progreso'  },
  'Bloqueado':   { ring: '#FF5A6A',              text: '#FF5A6A',              label: 'Bloqueadas'   },
  'Pendiente':   { ring: 'rgba(231,238,248,.2)', text: 'rgba(231,238,248,.5)', label: 'Pendientes'   },
  'Backlog':     { ring: 'rgba(231,238,248,.1)', text: 'rgba(231,238,248,.3)', label: 'Backlog'      },
};

const ORDEN: EstadoElemento[] = ['Completado', 'En progreso', 'Bloqueado', 'Pendiente', 'Backlog'];

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Counts {
  total: number; completado: number; enProgreso: number;
  bloqueado: number; pendiente: number; backlog: number;
}

function countLeaves(elementos: Elemento[]): Counts {
  const c: Counts = { total: 0, completado: 0, enProgreso: 0, bloqueado: 0, pendiente: 0, backlog: 0 };
  function walk(el: Elemento) {
    if (!Array.isArray(el.elementos) || el.elementos.length === 0) {
      c.total++;
      if      (el.estado === 'Completado')  c.completado++;
      else if (el.estado === 'En progreso') c.enProgreso++;
      else if (el.estado === 'Bloqueado')   c.bloqueado++;
      else if (el.estado === 'Backlog')     c.backlog++;
      else                                   c.pendiente++;
    } else { el.elementos.forEach(walk); }
  }
  elementos.forEach(walk);
  return c;
}

interface Item {
  nombre: string;
  estado: EstadoElemento;
  isGrouper: boolean;
  counts?: Counts;
}

function buildItems(elementos: Elemento[]): Item[] {
  return elementos.map(el => {
    const isGrouper = Array.isArray(el.elementos) && el.elementos.length > 0;
    return {
      nombre: el.nombre,
      estado: el.estado,
      isGrouper,
      counts: isGrouper ? countLeaves(el.elementos!) : undefined,
    };
  });
}

// ─── SVG Donut ────────────────────────────────────────────────────────────────

function DonutChart({ counts }: { counts: Counts }) {
  const CX = 72, CY = 72, R = 54, SW = 16;
  const circ = 2 * Math.PI * R;
  const pct = counts.total > 0 ? Math.round((counts.completado / counts.total) * 100) : 0;

  const countMap: Record<EstadoElemento, number> = {
    'Completado': counts.completado, 'En progreso': counts.enProgreso,
    'Bloqueado': counts.bloqueado,   'Pendiente': counts.pendiente,
    'Backlog': counts.backlog,
  };
  const segs = ORDEN.map(e => ({ e, v: countMap[e] })).filter(s => s.v > 0);

  let cumFrac = 0;
  return (
    <svg viewBox="0 0 144 144" className="w-[120px] h-[120px] shrink-0">
      <circle cx={CX} cy={CY} r={R} fill="none"
        stroke="rgba(255,255,255,.055)" strokeWidth={SW} />

      {counts.total > 0 && (
        <g transform={`rotate(-90, ${CX}, ${CY})`}>
          {segs.map((s, i) => {
            const frac = s.v / counts.total;
            const dash = frac * circ;
            const off  = -cumFrac * circ;
            cumFrac += frac;
            return (
              <circle key={i} cx={CX} cy={CY} r={R}
                fill="none"
                stroke={CFG[s.e].ring}
                strokeWidth={SW}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={off}
              />
            );
          })}
        </g>
      )}

      <text x={CX} y={CY - 8} textAnchor="middle"
        fill="#E7EEF8" fontSize="26" fontWeight="700"
        fontFamily="ui-monospace, monospace">
        {counts.total > 0 ? `${pct}%` : '—'}
      </text>
      <text x={CX} y={CY + 12} textAnchor="middle"
        fill="rgba(231,238,248,.35)" fontSize="10"
        fontFamily="system-ui, -apple-system, sans-serif">
        {counts.total > 0 ? `${counts.completado}/${counts.total}` : 'sin tareas'}
      </text>
    </svg>
  );
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function MiniBar({ value, total, blocked }: { value: number; total: number; blocked: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const blkPct = total > 0 ? Math.round((blocked / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-[3px] rounded-full bg-[rgba(255,255,255,.07)] overflow-hidden">
        <div className="h-full flex">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? '#1BD27A'
                : 'linear-gradient(90deg, rgba(27,210,122,.45), #1BD27A)',
            }} />
          {blkPct > 0 && (
            <div className="h-full" style={{ width: `${blkPct}%`, background: '#FF5A6A55' }} />
          )}
        </div>
      </div>
      <span className="text-[10px] font-mono tabular-nums text-[rgba(231,238,248,.28)] shrink-0 w-8 text-right">
        {value}/{total}
      </span>
    </div>
  );
}

// ─── Estado icon ──────────────────────────────────────────────────────────────

function EstIcon({ estado }: { estado: EstadoElemento }) {
  const s = 'h-3.5 w-3.5 shrink-0';
  switch (estado) {
    case 'Completado':  return <CheckCircle2 className={s} style={{ color: CFG['Completado'].text }} />;
    case 'En progreso': return <Clock        className={s} style={{ color: CFG['En progreso'].text }} />;
    case 'Bloqueado':   return <AlertOctagon className={s} style={{ color: CFG['Bloqueado'].text }} />;
    default:            return <Circle       className={cn(s, 'opacity-30')} />;
  }
}

// ─── Section label ────────────────────────────────────────────────────────────

function SLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(231,238,248,.28)] select-none">
        {children}
      </p>
      {right}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { proyecto: Proyecto; open: boolean; onOpenChange: (v: boolean) => void; }

export function ProjectMetricsDrawer({ proyecto, open, onOpenChange }: Props) {
  const elementos = proyecto.elementos ?? [];
  const counts  = useMemo(() => countLeaves(elementos),  [elementos]);
  const items   = useMemo(() => buildItems(elementos),   [elementos]);

  const missing = items.filter(it => it.estado !== 'Completado');
  const allDone = missing.length === 0 && counts.total > 0;

  const legend = ORDEN
    .map(e => ({
      e,
      v: e === 'Completado' ? counts.completado :
         e === 'En progreso'? counts.enProgreso  :
         e === 'Bloqueado'  ? counts.bloqueado   :
         e === 'Pendiente'  ? counts.pendiente   : counts.backlog,
    }))
    .filter(r => r.v > 0);

  const chipCls = proyecto.estadoProyecto === 'Activo'
    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
    : proyecto.estadoProyecto === 'Archivado'
    ? 'border-border/40 text-muted-foreground/50'
    : 'border-border/60 text-muted-foreground';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] max-w-full p-0 border-l border-[rgba(255,255,255,.065)] bg-[#111822] flex flex-col"
      >
        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-4 border-b border-[rgba(255,255,255,.055)] flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('text-[11px] font-semibold border rounded-full px-2.5 py-0.5', chipCls)}>
                  {proyecto.estadoProyecto}
                </span>
              </div>
              <SheetTitle className="text-[16px] font-bold text-foreground leading-snug">
                {proyecto.nombre}
              </SheetTitle>
              {proyecto.descripcion && (
                <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {proyecto.descripcion}
                </p>
              )}
            </div>
            <SheetClose asChild>
              <button className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,.06)] transition-colors cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </SheetClose>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          {elementos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/25 select-none">
              <Layers className="h-10 w-10 mb-3" />
              <p className="text-[13px]">Sin elementos en este proyecto</p>
            </div>
          ) : (
            <>
              {/* ═══ ZONE 1: Chart + stats — 2 columns, compact ═══ */}
              <div className="px-5 py-5 flex items-center gap-5">
                <DonutChart counts={counts} />

                {/* Stats column */}
                <div className="flex-1 flex flex-col gap-2.5">
                  {legend.map(row => (
                    <div key={row.e} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: CFG[row.e].ring }} />
                      <span className="text-[12px] text-[rgba(231,238,248,.55)] flex-1 leading-none">
                        {CFG[row.e].label}
                      </span>
                      <span className="font-mono text-[13px] font-semibold tabular-nums shrink-0"
                        style={{ color: CFG[row.e].text }}>
                        {row.v}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,.05)] mt-0.5">
                    <span className="text-[11px] text-[rgba(231,238,248,.3)] flex-1">Total</span>
                    <span className="font-mono text-[12px] text-[rgba(231,238,248,.45)] tabular-nums">
                      {counts.total} tareas
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-[rgba(255,255,255,.055)]" />

              {/* ═══ ZONE 2: Falta para completar ═══ */}
              <div className="px-5 py-4">
                {allDone ? (
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 pl-4 pr-5 py-3.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-emerald-400">¡Proyecto completado!</p>
                      <p className="text-[12px] text-emerald-400/50 mt-0.5">Todos los elementos están completos.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <SLabel right={
                      <span className="text-[11px] font-mono font-semibold text-[rgba(231,238,248,.38)] bg-[rgba(255,255,255,.06)] rounded-full px-2 py-0.5">
                        {missing.length}
                      </span>
                    }>
                      Falta para completar
                    </SLabel>

                    {/* Rows with colored left border */}
                    <div className="flex flex-col rounded-lg border border-[rgba(255,255,255,.07)] divide-y divide-[rgba(255,255,255,.05)]">
                      {[
                        ...missing.filter(it => it.estado === 'Bloqueado'),
                        ...missing.filter(it => it.estado === 'En progreso'),
                        ...missing.filter(it => it.estado !== 'Bloqueado' && it.estado !== 'En progreso'),
                      ].map((item, i, arr) => {
                        const isFirst = i === 0;
                        const isLast  = i === arr.length - 1;
                        const remaining = item.isGrouper && item.counts
                          ? item.counts.total - item.counts.completado
                          : null;
                        return (
                          <div
                            key={i}
                            className={cn(
                              'flex items-center gap-0 overflow-hidden',
                              isFirst && 'rounded-t-[7px]',
                              isLast  && 'rounded-b-[7px]',
                              item.estado === 'Bloqueado' && 'bg-[rgba(255,90,106,.04)]',
                            )}
                          >
                            {/* Colored left accent bar */}
                            <div
                              className="w-[3px] self-stretch shrink-0"
                              style={{ background: CFG[item.estado].ring }}
                            />
                            <div className="flex items-center gap-3 pl-3 pr-6 py-2.5 flex-1 min-w-0">
                              <span className="text-[13px] text-[rgba(231,238,248,.75)] flex-1 truncate min-w-0">
                                {item.nombre}
                                {item.isGrouper && (
                                  <span className="text-[rgba(231,238,248,.3)] text-[11px] ml-1.5">agrupador</span>
                                )}
                              </span>
                              <span className="text-[11px] font-semibold shrink-0 whitespace-nowrap"
                                style={{ color: CFG[item.estado].text }}>
                                {remaining !== null
                                  ? `${remaining} faltante${remaining !== 1 ? 's' : ''}`
                                  : item.estado === 'En progreso' ? 'En curso'
                                  : item.estado}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <Separator className="bg-[rgba(255,255,255,.055)]" />

              {/* ═══ ZONE 3: Full breakdown ═══ */}
              <div className="px-5 pt-4 pb-6">
                <SLabel>Todos los elementos</SLabel>

                <div className="flex flex-col">
                  {items.map((item, i) => {
                    const isDone = item.estado === 'Completado';
                    return (
                      <div key={i}
                        className="flex items-start gap-2.5 py-2.5 border-b border-[rgba(255,255,255,.04)] last:border-0">
                        <div className="mt-px shrink-0">
                          {item.isGrouper
                            ? <Layers className="h-3.5 w-3.5 text-[rgba(231,238,248,.22)]" />
                            : <EstIcon estado={item.estado} />
                          }
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className={cn(
                            'text-[13px] leading-snug truncate',
                            isDone
                              ? 'text-[rgba(231,238,248,.3)] line-through'
                              : 'text-[rgba(231,238,248,.82)]'
                          )}>
                            {item.nombre}
                          </p>
                          {item.isGrouper && item.counts && (
                            <MiniBar
                              value={item.counts.completado}
                              total={item.counts.total}
                              blocked={item.counts.bloqueado}
                            />
                          )}
                        </div>
                        {!item.isGrouper && !isDone && (
                          <span className="text-[11px] font-semibold shrink-0 mt-px whitespace-nowrap"
                            style={{ color: CFG[item.estado].text }}>
                            {item.estado === 'En progreso' ? 'En curso' : item.estado}
                          </span>
                        )}
                        {isDone && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px text-[rgba(27,210,122,.35)]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
