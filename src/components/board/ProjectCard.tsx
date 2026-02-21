// src/components/board/ProjectCard.tsx
// Project card with expandable detail table

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, MoreVertical, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useInlineEdit } from '@/hooks/useInlineEdit';
import {
  calcularAvanceGeneral,
  contarElementosRecursivo,
  calcTotalEsfuerzo,
  aplicarOrdenamientoRecursivo,
} from '@/lib/businessRules';
import { ProjectDetailRow } from '@/components/board/ProjectDetailRow';
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
import type { Proyecto, EstadoProyecto } from '@/types';

const ESTADO_CHIP: Record<EstadoProyecto, string> = {
  'Activo':    'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  'Backlog':   'border-border/60 text-muted-foreground',
  'Archivado': 'border-border/40 text-muted-foreground/50',
};

const ESTADOS_PROYECTO: EstadoProyecto[] = ['Activo', 'Backlog', 'Archivado'];

interface ProjectCardProps {
  proyecto: Proyecto;
  projectIndex: number;
}

export function ProjectCard({ proyecto, projectIndex }: ProjectCardProps) {
  const setProjectEstado = useAppStore(s => s.setProjectEstado);
  const updateProject = useAppStore(s => s.updateProject);
  const deleteProject = useAppStore(s => s.deleteProject);
  const collapsed = useAppStore(s => s.collapsed);
  const toggleCollapsed = useAppStore(s => s.toggleCollapsed);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const collapseKey = `proj-${projectIndex}`;
  const isExpanded = !collapsed[collapseKey];

  const proyectoOrdenado = aplicarOrdenamientoRecursivo({ ...proyecto });
  const avance = calcularAvanceGeneral(proyectoOrdenado);
  const totalHijos = contarElementosRecursivo(proyectoOrdenado) - 1;
  const esfuerzoTotal = calcTotalEsfuerzo(proyectoOrdenado);
  const hasChildren = Array.isArray(proyecto.elementos) && proyecto.elementos.length > 0;

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
        'rounded-lg border border-border bg-card mb-2 overflow-hidden shadow-card',
        proyecto.estadoProyecto === 'Archivado' && 'opacity-60'
      )}
      data-project-index={projectIndex}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 min-h-[52px]">
        {/* Drag handle */}
        <span className="drag-handle text-muted-foreground/40 flex-shrink-0">
          <GripVertical className="h-4 w-4" />
        </span>

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
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </button>

        {/* Estado proyecto — badge compacto con dropdown */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'text-[11px] font-semibold border rounded-full px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity',
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
              className="text-sm font-bold truncate cursor-text"
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
              className="text-xs text-muted-foreground truncate cursor-text mt-0.5"
              onDoubleClick={descEdit.startEdit}
              title="Doble clic para editar"
            >
              {proyecto.descripcion || <span className="opacity-40">Sin descripción</span>}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex-shrink-0 text-xs text-muted-foreground hidden sm:block">
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
            <div className="text-right text-xs text-muted-foreground mt-0.5">{avance}%</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex-shrink-0">
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
        </div>
      </div>

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

      {/* ── Detail table ── */}
      {hasChildren && isExpanded && (
        <div className="border-t border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  <th className="th-ds" style={{ minWidth: 180 }}>Nombre</th>
                  <th className="th-ds">Descripción</th>
                  <th className="th-ds-center" style={{ width: 60 }}>Prior.</th>
                  <th className="th-ds" style={{ width: 120 }}>Avance</th>
                  <th className="th-ds" style={{ width: 80 }}>Esfuerzo</th>
                  <th className="th-ds-center" style={{ width: 100 }}>Deadline</th>
                  <th className="th-ds-center" style={{ width: 110 }}>Estado</th>
                  <th className="th-ds-right" style={{ width: 60 }}>Acc.</th>
                </tr>
              </thead>
              <tbody>
                {proyectoOrdenado.elementos!.map((hijo, idx) => (
                  <ProjectDetailRow
                    key={`${projectIndex}-${idx}`}
                    elemento={hijo}
                    path={[projectIndex, idx]}
                    level={1}
                    collapsed={collapsed}
                    onToggleCollapse={handleGrouperToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
