// src/components/board/ProjectCard.tsx
// Project card with expandable detail table

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, MoreVertical, Trash2, BarChart2, GripVertical, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import {
  calcularAvanceGeneral,
  contarElementosRecursivo,
  calcTotalEsfuerzo,
} from '@/lib/businessRules';
import { ReactSortable } from 'react-sortablejs';
import { ProjectDetailRow } from '@/components/board/ProjectDetailRow';
import { ProjectMetricsDrawer } from '@/components/board/ProjectMetricsDrawer';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Proyecto, Elemento, EstadoProyecto } from '@/types';

const ESTADO_CHIP: Record<EstadoProyecto, string> = {
  'Activo':    'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  'Backlog':   'border-border/60 text-muted-foreground',
  'Archivado': 'border-border/40 text-muted-foreground/50',
};

const ESTADOS_PROYECTO: EstadoProyecto[] = ['Activo', 'Backlog', 'Archivado'];

interface SortableElementItem {
  id: string;
  elemento: Elemento;
  originalIdx: number;
}

interface ProjectCardProps {
  proyecto: Proyecto;
  projectIndex: number;
}

export function ProjectCard({ proyecto, projectIndex }: ProjectCardProps) {
  const setProjectEstado = useAppStore(s => s.setProjectEstado);
  const updateProject = useAppStore(s => s.updateProject);
  const deleteProject = useAppStore(s => s.deleteProject);
  const reorderElements = useAppStore(s => s.reorderElements);
  const collapsed = useAppStore(s => s.collapsed);
  const toggleCollapsed = useAppStore(s => s.toggleCollapsed);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);

  type SortField = 'nombre' | 'prioridad' | 'avance' | 'esfuerzo' | 'deadline' | 'estado';
  type SortDir = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const PRIORIDAD_W: Record<string, number> = { Alta: 1, Media: 2, Baja: 3 };
  const ESTADO_W: Record<string, number> = { 'En progreso': 1, Bloqueado: 2, Pendiente: 3, Backlog: 4, Completado: 5 };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') { setSortDir('desc'); }
      else { setSortField(null); setSortDir('asc'); }
    } else {
      setSortField(field); setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30 shrink-0" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary shrink-0" />
      : <ArrowDown className="h-3 w-3 text-primary shrink-0" />;
  };

  const collapseKey = `proj-${projectIndex}`;
  const isExpanded = !collapsed[collapseKey];

  const avance = calcularAvanceGeneral(proyecto);
  const totalHijos = contarElementosRecursivo(proyecto) - 1;
  const esfuerzoTotal = calcTotalEsfuerzo(proyecto);
  const hasChildren = Array.isArray(proyecto.elementos) && proyecto.elementos.length > 0;

  // Stable id = element name (avoids key churn during drag → fixes glitch)
  const sortableElementItems: SortableElementItem[] = (proyecto.elementos || []).map((el, idx) => ({
    id: el.nombre || `${projectIndex}-${idx}`,
    elemento: el,
    originalIdx: idx,
  }));

  const handleElementSort = (newOrder: SortableElementItem[]) => {
    reorderElements([projectIndex], newOrder.map(item => item.elemento));
  };

  const nombreEdit = useInlineEdit({
    initialValue: proyecto.nombre,
    onSave: (v) => updateProject(projectIndex, { nombre: v }),
    validate: v => v.length > 0,
  });

  const descEdit = useInlineEdit({
    initialValue: proyecto.descripcion || '',
    onSave: (v) => updateProject(projectIndex, { descripcion: v }),
  });

  const toggleExpand = useCallback(() => {
    if (!hasChildren) return;
    toggleCollapsed(collapseKey);
  }, [hasChildren, collapseKey, toggleCollapsed]);

  const handleGrouperToggle = useCallback((key: string) => {
    toggleCollapsed(key);
  }, [toggleCollapsed]);

  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card mb-3 overflow-hidden shadow-card',
        proyecto.estadoProyecto === 'Archivado' && 'opacity-60'
      )}
      data-project-index={projectIndex}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4 min-h-[72px]">
        {/* Collapse toggle */}
        <button
          onClick={toggleExpand}
          disabled={!hasChildren}
          className={cn(
            'flex-shrink-0 text-muted-foreground transition-colors',
            hasChildren ? 'hover:text-foreground' : 'opacity-30 cursor-default'
          )}
        >
          {isExpanded && hasChildren
            ? <ChevronDown className="h-[18px] w-[18px]" />
            : <ChevronRight className="h-[18px] w-[18px]" />}
        </button>

        {/* Estado proyecto — badge compacto con dropdown */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'text-[12px] font-semibold border rounded-full px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity',
                  ESTADO_CHIP[proyecto.estadoProyecto]
                )}
              >
                {proyecto.estadoProyecto}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {ESTADOS_PROYECTO.map(e => (
                <DropdownMenuItem
                  key={e}
                  onClick={() => setProjectEstado(projectIndex, e)}
                  className={cn(e === proyecto.estadoProyecto && 'font-medium')}
                >
                  {e}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          {nombreEdit.isEditing ? (
            <input
              ref={nombreEdit.inputRef as React.RefObject<HTMLInputElement>}
              value={nombreEdit.value}
              onChange={e => nombreEdit.setValue(e.target.value)}
              onKeyDown={nombreEdit.handleKeyDown}
              onBlur={nombreEdit.save}
              className="w-full bg-background border border-ring rounded px-1 py-0.5 text-sm font-semibold"
            />
          ) : (
            <p
              className="text-[16px] font-bold truncate cursor-text leading-tight"
              onDoubleClick={nombreEdit.startEdit}
              title="Doble clic para editar"
            >
              {proyecto.nombre}
            </p>
          )}
          {descEdit.isEditing ? (
            <input
              ref={descEdit.inputRef as React.RefObject<HTMLInputElement>}
              value={descEdit.value}
              onChange={e => descEdit.setValue(e.target.value)}
              onKeyDown={descEdit.handleKeyDown}
              onBlur={descEdit.save}
              className="w-full bg-background border border-ring rounded px-1 py-0.5 text-xs text-muted-foreground mt-0.5"
            />
          ) : (
            <p
              className="text-[13px] text-muted-foreground truncate cursor-text mt-1"
              onDoubleClick={descEdit.startEdit}
              title="Doble clic para editar"
            >
              {proyecto.descripcion || <span className="opacity-40">Sin descripción</span>}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex-shrink-0 text-[13px] text-muted-foreground hidden sm:block">
          {totalHijos} tarea{totalHijos !== 1 ? 's' : ''}
          {esfuerzoTotal && ` · ${esfuerzoTotal}`}
        </div>

        {/* Progress */}
        {hasChildren && (
          <div className="flex-shrink-0 w-24 hidden md:block">
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.max(avance, 2)}%` }}
              />
            </div>
            {proyecto.estadoProyecto !== 'Completado' && (
              <div className="text-right text-[13px] text-muted-foreground mt-1">{avance}%</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {/* Metrics trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMetricsOpen(true)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <BarChart2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ver métricas del proyecto</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <GripVertical className="drag-handle h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
      </div>

      {/* Metrics drawer */}
      <ProjectMetricsDrawer
        proyecto={proyecto}
        open={metricsOpen}
        onOpenChange={setMetricsOpen}
      />

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasChildren
                ? `¿Seguro que deseas eliminar "${proyecto.nombre}" y todos sus elementos?`
                : `¿Seguro que deseas eliminar "${proyecto.nombre}"?`}
              {' '}Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProject(projectIndex)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Detail section ── */}
      {hasChildren && isExpanded && (
        <div className="border-t border-border/50">
          <div className="overflow-x-auto">

            {/* Column headers with sort */}
            {(() => {
              const SortBtn = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
                <button
                  onClick={() => handleSort(field)}
                  className={cn(
                    'flex items-center gap-1 w-full transition-colors text-[11px] font-semibold uppercase tracking-[0.07em]',
                    sortField === field ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    className
                  )}
                >
                  {label}
                  <SortIcon field={field} />
                </button>
              );
              return (
                <div className="element-row border-b border-border/50 bg-muted/40">
                  <div className="py-3 px-3" style={{ paddingLeft: 12 }}><SortBtn field="nombre" label="Nombre" /></div>
                  <div className="py-3 px-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">Descripción</div>
                  <div className="py-3 px-3 flex justify-center"><SortBtn field="prioridad" label="Prior." className="justify-center" /></div>
                  <div className="py-3 px-3"><SortBtn field="avance" label="Avance" /></div>
                  <div className="py-3 px-3"><SortBtn field="esfuerzo" label="Esfuerzo" /></div>
                  <div className="py-3 px-3 flex justify-center"><SortBtn field="deadline" label="Deadline" className="justify-center" /></div>
                  <div className="py-3 px-3 flex justify-center"><SortBtn field="estado" label="Estado" className="justify-center" /></div>
                  <div className="py-3 px-3" />
                </div>
              );
            })()}

            {/* Element list: sorted (static) or drag-enabled */}
            {sortField ? (
              <div>
                {[...sortableElementItems]
                  .sort((a, b) => {
                    const av = a.elemento, bv = b.elemento;
                    let va: string | number = '', vb: string | number = '';
                    if (sortField === 'nombre')    { va = av.nombre.toLowerCase(); vb = bv.nombre.toLowerCase(); }
                    if (sortField === 'prioridad') { va = PRIORIDAD_W[av.prioridad || ''] ?? 99; vb = PRIORIDAD_W[bv.prioridad || ''] ?? 99; }
                    if (sortField === 'avance')    { va = parseInt(String(av.avance ?? 0)) || 0; vb = parseInt(String(bv.avance ?? 0)) || 0; }
                    if (sortField === 'esfuerzo')  { va = (av.esfuerzo ?? '').toLowerCase(); vb = (bv.esfuerzo ?? '').toLowerCase(); }
                    if (sortField === 'deadline')  { va = av.deadline ?? ''; vb = bv.deadline ?? ''; }
                    if (sortField === 'estado')    { va = ESTADO_W[av.estado || ''] ?? 99; vb = ESTADO_W[bv.estado || ''] ?? 99; }
                    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
                    return sortDir === 'asc' ? cmp : -cmp;
                  })
                  .map(item => (
                    <ProjectDetailRow
                      key={item.id}
                      elemento={item.elemento}
                      path={[projectIndex, item.originalIdx]}
                      level={1}
                      collapsed={collapsed}
                      onToggleCollapse={handleGrouperToggle}
                    />
                  ))}
              </div>
            ) : (
              <ReactSortable
                list={sortableElementItems}
                setList={handleElementSort}
                className="el-sortable"
                handle=".drag-handle"
                animation={200}
                easing="cubic-bezier(0.2, 0, 0, 1)"
                ghostClass="sortable-ghost"
                chosenClass="sortable-chosen"
              >
                {sortableElementItems.map(item => (
                  <div key={item.id}>
                    <ProjectDetailRow
                      elemento={item.elemento}
                      path={[projectIndex, item.originalIdx]}
                      level={1}
                      collapsed={collapsed}
                      onToggleCollapse={handleGrouperToggle}
                    />
                  </div>
                ))}
              </ReactSortable>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
