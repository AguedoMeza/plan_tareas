// src/components/board/ProjectDetailRow.tsx
// Recursive row in the detail table — inline editing, status, delete

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useInlineEdit, usePriorityCycle } from '@/hooks/useInlineEdit';
import { calcularAvanceRecursivo } from '@/lib/businessRules';
import { EstadoBadge, PrioridadBadge } from '@/components/board/EstadoBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Elemento, EstadoElemento } from '@/types';

interface ProjectDetailRowProps {
  elemento: Elemento;
  path: number[]; // full path from root, e.g. [projectIndex, childIdx, ...]
  level: number;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (key: string) => void;
}

// Inline editable cell
function EditCell({
  value,
  field,
  path,
  multiline = false,
  className,
}: {
  value: string;
  field: keyof Elemento | 'nombre';
  path: number[];
  multiline?: boolean;
  className?: string;
}) {
  const updateElement = useAppStore(s => s.updateElement);
  const { isEditing, value: editVal, setValue, inputRef, startEdit, save, cancel, handleKeyDown } =
    useInlineEdit({
      initialValue: value,
      onSave: (v) => updateElement(path, { [field]: v } as Partial<Elemento>),
      validate: field === 'nombre' ? (v) => v.length > 0 : undefined,
    });

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editVal}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          className={cn(
            'w-full bg-background border border-ring rounded px-1 py-0.5 text-xs resize-none',
            className
          )}
          rows={2}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editVal}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={save}
        className={cn(
          'w-full bg-background border border-ring rounded px-1 py-0.5 text-xs',
          field === 'nombre' && 'font-medium',
          className
        )}
      />
    );
  }

  return (
    <span
      onDoubleClick={startEdit}
      className={cn('cursor-text select-none block min-h-[1rem]', className)}
      title="Doble clic para editar"
    >
      {value || <span className="text-muted-foreground/50">—</span>}
    </span>
  );
}

const NEXT_ESTADO: Record<EstadoElemento, EstadoElemento> = {
  'Pendiente':   'En progreso',
  'En progreso': 'Completado',
  'Completado':  'Pendiente',
  'Bloqueado':   'Pendiente',
  'Backlog':     'Pendiente',
};

const ESTADOS: EstadoElemento[] = ['Pendiente', 'En progreso', 'Completado', 'Bloqueado', 'Backlog'];

export function ProjectDetailRow({
  elemento,
  path,
  level,
  collapsed,
  onToggleCollapse,
}: ProjectDetailRowProps) {
  const setElementEstado = useAppStore(s => s.setElementEstado);
  const deleteElement = useAppStore(s => s.deleteElement);
  const updateElement = useAppStore(s => s.updateElement);

  const hasChildren = Array.isArray(elemento.elementos) && elemento.elementos.length > 0;
  const pathKey = path.join('-');
  const isCollapsed = collapsed[pathKey] || false;

  const avance = hasChildren
    ? calcularAvanceRecursivo(elemento)
    : (elemento.avance ? parseInt(String(elemento.avance)) || 0 : 0);

  // Priority cycling
  const { cycle: cyclePrio } = usePriorityCycle(
    elemento.prioridad || '',
    (v) => updateElement(path, { prioridad: v as Elemento['prioridad'] })
  );

  // Estado select inline
  const [estadoOpen, setEstadoOpen] = useState(false);

  const handleEstadoChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setElementEstado(path, e.target.value as EstadoElemento);
    },
    [path, setElementEstado]
  );

  const indentPx = (level - 1) * 20 + 8;

  return (
    <>
      <tr
        className={cn(
          'border-b border-border/50 transition-colors hover:bg-muted/20 group',
          level === 1 ? 'task-row' : 'subtask-row',
          hasChildren && 'font-medium',
          elemento.estado === 'Completado' && 'opacity-60'
        )}
        data-element-path={pathKey}
        data-level={level}
      >
        {/* Nombre */}
        <td className="py-1.5 px-2" style={{ paddingLeft: `${indentPx}px` }}>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                onClick={() => onToggleCollapse(pathKey)}
              >
                {isCollapsed
                  ? <ChevronRight className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <div className="min-w-0">
              <EditCell value={elemento.nombre} field="nombre" path={path} className="font-medium text-sm" />
              <div className="text-xs text-muted-foreground">
                {hasChildren ? `Agrupador · ${elemento.elementos!.length} items` : level > 1 ? 'Subtarea' : 'Tarea'}
              </div>
            </div>
          </div>
        </td>

        {/* Descripción */}
        <td className="py-1.5 px-2 max-w-[200px]">
          <EditCell
            value={elemento.descripcion || ''}
            field="descripcion"
            path={path}
            multiline
            className="text-xs text-muted-foreground"
          />
        </td>

        {/* Prioridad */}
        <td className="py-1.5 px-2 text-center">
          <span
            onClick={cyclePrio}
            className="cursor-pointer"
            title="Clic para cambiar prioridad"
          >
            {elemento.prioridad
              ? <PrioridadBadge prioridad={elemento.prioridad} />
              : <span className="text-muted-foreground/30 text-xs">—</span>}
          </span>
        </td>

        {/* Avance */}
        <td className="py-1.5 px-2">
          {hasChildren ? (
            <div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.max(avance, 2)}%` }}
                />
              </div>
              <div className="text-right text-xs text-muted-foreground mt-0.5">{avance}%</div>
            </div>
          ) : (
            <EditCell value={elemento.avance || ''} field="avance" path={path} className="text-xs text-center" />
          )}
        </td>

        {/* Esfuerzo */}
        <td className="py-1.5 px-2">
          <EditCell value={elemento.esfuerzo || ''} field="esfuerzo" path={path} className="text-xs font-medium" />
        </td>

        {/* Deadline */}
        <td className="py-1.5 px-2 text-center">
          <EditCell value={elemento.deadline || ''} field="deadline" path={path} className="font-mono-date" />
        </td>

        {/* Estado */}
        <td className="py-1.5 px-2 text-center">
          {hasChildren ? (
            <span className="text-muted-foreground/30">—</span>
          ) : (
            <select
              value={elemento.estado}
              onChange={handleEstadoChange}
              className="text-xs rounded border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring px-1 py-0.5"
            >
              {ESTADOS.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          )}
        </td>

        {/* Acciones */}
        <td className="py-1.5 px-2 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {hasChildren
                      ? `¿Seguro que deseas eliminar "${elemento.nombre}" y todos sus ${elemento.elementos!.length} elementos hijo?`
                      : `¿Seguro que deseas eliminar "${elemento.nombre}"?`}
                    {' '}Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteElement(path)}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      </tr>

      {/* Hijos recursivos */}
      {hasChildren && !isCollapsed &&
        elemento.elementos!.map((hijo, idx) => (
          <ProjectDetailRow
            key={`${pathKey}-${idx}`}
            elemento={hijo}
            path={[...path, idx]}
            level={level + 1}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
    </>
  );
}
