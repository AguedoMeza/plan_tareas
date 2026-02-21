// src/components/board/ProjectDetailRow.tsx
// Recursive row in the detail table — inline editing, status, delete

import { ChevronRight, ChevronDown, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useInlineEdit, usePriorityCycle } from '@/hooks/useInlineEdit';
import { calcularAvanceRecursivo } from '@/lib/businessRules';
import { EstadoBadge, PrioridadBadge } from '@/components/board/EstadoBadge';
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
            'w-full bg-background border border-ring rounded px-2 py-1 text-[13px] resize-none',
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
          'w-full bg-background border border-ring rounded px-2 py-1 text-[13px]',
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

  const indentPx = (level - 1) * 20 + 12;

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
        <td className="py-2.5 px-3" style={{ paddingLeft: `${indentPx}px` }}>
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
              <EditCell value={elemento.nombre} field="nombre" path={path} className="font-semibold text-[14px] leading-snug" />
              <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                {hasChildren ? `Agrupador · ${elemento.elementos!.length} items` : level > 1 ? 'Subtarea' : 'Tarea'}
              </div>
            </div>
          </div>
        </td>

        {/* Descripción */}
        <td className="py-2.5 px-3 max-w-[200px]">
          <EditCell
            value={elemento.descripcion || ''}
            field="descripcion"
            path={path}
            multiline
            className="text-[13px] text-muted-foreground"
          />
        </td>

        {/* Prioridad */}
        <td className="py-2.5 px-3 text-center">
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
        <td className="py-2.5 px-3">
          {hasChildren ? (
            <div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.max(avance, 2)}%` }}
                />
              </div>
              <div className="text-right text-[12px] text-muted-foreground mt-1">{avance}%</div>
            </div>
          ) : (
            <EditCell value={elemento.avance || ''} field="avance" path={path} className="text-[13px] text-center" />
          )}
        </td>

        {/* Esfuerzo */}
        <td className="py-2.5 px-3">
          <EditCell value={elemento.esfuerzo || ''} field="esfuerzo" path={path} className="text-[13px] font-medium" />
        </td>

        {/* Deadline */}
        <td className="py-2.5 px-3 text-center">
          <EditCell value={elemento.deadline || ''} field="deadline" path={path} className="font-mono-date" />
        </td>

        {/* Estado */}
        <td className="py-2.5 px-3 text-center">
          {hasChildren ? (
            <span className="text-muted-foreground/30">—</span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full">
                  <EstadoBadge estado={elemento.estado} className="cursor-pointer hover:opacity-80 transition-opacity" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[148px]">
                {ESTADOS.map(e => (
                  <DropdownMenuItem
                    key={e}
                    onClick={() => setElementEstado(path, e)}
                    className="flex items-center justify-between gap-2"
                  >
                    <EstadoBadge estado={e} />
                    {e === elemento.estado && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </td>

        {/* Acciones */}
        <td className="py-2.5 px-3 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Eliminar</TooltipContent>
              </Tooltip>
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
