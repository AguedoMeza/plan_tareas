// src/components/board/ProjectDetailRow.tsx
// Recursive row in the detail grid — inline editing, status, delete, drag

import { useState } from 'react';
import { ChevronRight, Trash2, Check, GripVertical, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useInlineEdit, usePriorityCycle } from '@/hooks/useInlineEdit';
import { calcularAvanceRecursivo } from '@/lib/businessRules';
import { EstadoBadge, PrioridadBadge } from '@/components/board/EstadoBadge';
import { ReactSortable } from 'react-sortablejs';
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
import type { Elemento, EstadoElemento } from '@/types';

interface ProjectDetailRowProps {
  elemento: Elemento;
  path: number[]; // full path from root, e.g. [projectIndex, childIdx, ...]
  level: number;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (key: string) => void;
}

interface ChildSortItem {
  id: string;
  elemento: Elemento;
  childIdx: number;
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
  const { isEditing, value: editVal, setValue, inputRef, startEdit, save, handleKeyDown } =
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
  const reorderElements = useAppStore(s => s.reorderElements);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hasChildren = Array.isArray(elemento.elementos) && elemento.elementos.length > 0;
  const pathKey = path.join('-');
  const isCollapsed = collapsed[pathKey] || false;

  // Shared group name for all nested elements within the same project.
  // Enables cross-grouper drag (move tasks between nodes).
  const projectIndex = path[0];
  const childGroupName = `proj-${projectIndex}-children`;

  const avance = hasChildren
    ? calcularAvanceRecursivo(elemento)
    : (elemento.avance ? parseInt(String(elemento.avance)) || 0 : 0);

  const { cycle: cyclePrio } = usePriorityCycle(
    elemento.prioridad || '',
    (v) => updateElement(path, { prioridad: v as Elemento['prioridad'] })
  );

  // Stable id = child name (avoids key churn during drag → fixes glitch)
  const childItems: ChildSortItem[] = (elemento.elementos || []).map((hijo, idx) => ({
    id: hijo.nombre || `${pathKey}-c${idx}`,
    elemento: hijo,
    childIdx: idx,
  }));

  const handleChildSort = (newOrder: ChildSortItem[]) => {
    reorderElements(path, newOrder.map(item => item.elemento));
  };

  const indentPx = (level - 1) * 20 + 12;

  return (
    <>
      <div
        className={cn(
          'element-row border-b border-border/50 transition-colors hover:bg-muted/20 group',
          hasChildren && 'font-medium',
          elemento.estado === 'Completado' && 'opacity-50'
        )}
        data-element-path={pathKey}
        data-level={level}
      >
        {/* Col 1: Nombre */}
        <div className="py-2.5 px-3" style={{ paddingLeft: `${indentPx}px` }}>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(pathKey); }}
              >
                <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', !isCollapsed && 'rotate-90')} />
              </button>
            )}
            <div className="min-w-0">
              <EditCell value={elemento.nombre} field="nombre" path={path} className="font-semibold text-[14px] leading-snug" />
              <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                {hasChildren ? `Agrupador · ${elemento.elementos!.length} items` : level > 1 ? 'Subtarea' : 'Tarea'}
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Descripción */}
        <div className="py-2.5 px-3">
          <EditCell
            value={elemento.descripcion || ''}
            field="descripcion"
            path={path}
            multiline
            className="text-[13px] text-muted-foreground"
          />
        </div>

        {/* Col 4: Prioridad */}
        <div className="py-2.5 px-3 text-center">
          <span
            onClick={cyclePrio}
            className="cursor-pointer"
            title="Clic para cambiar prioridad"
          >
            {elemento.prioridad
              ? <PrioridadBadge prioridad={elemento.prioridad} />
              : <span className="text-muted-foreground/30 text-xs">—</span>}
          </span>
        </div>

        {/* Col 5: Avance */}
        <div className="py-2.5 px-3">
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
        </div>

        {/* Col 6: Esfuerzo */}
        <div className="py-2.5 px-3">
          <EditCell value={elemento.esfuerzo || ''} field="esfuerzo" path={path} className="text-[13px] font-medium" />
        </div>

        {/* Col 7: Deadline */}
        <div className="py-2.5 px-3 text-center">
          <EditCell value={elemento.deadline || ''} field="deadline" path={path} className="font-mono-date" />
        </div>

        {/* Col 8: Estado */}
        <div className="py-2.5 px-3 text-center">
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
        </div>

        {/* Col 8: Acciones + handle */}
        <div className="flex items-center justify-end gap-0.5 pr-2">
          {/* ⋮ menu — visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1.5 rounded transition-colors">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Drag handle — always visible */}
          <button className="drag-handle p-1.5 text-muted-foreground/30 hover:text-muted-foreground rounded transition-colors flex-shrink-0">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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

      {/* Hijos: sortable dentro del agrupador, comparte grupo con otros agrupadores */}
      {hasChildren && !isCollapsed && (
        <ReactSortable
          list={childItems}
          setList={handleChildSort}
          className="el-sortable"
          handle=".drag-handle"
          animation={200}
          easing="cubic-bezier(0.2, 0, 0, 1)"
          ghostClass="sortable-ghost"
          chosenClass="sortable-chosen"
          group={{ name: childGroupName, pull: true, put: true }}
        >
          {childItems.map(item => (
            <div key={item.id}>
              <ProjectDetailRow
                elemento={item.elemento}
                path={[...path, item.childIdx]}
                level={level + 1}
                collapsed={collapsed}
                onToggleCollapse={onToggleCollapse}
              />
            </div>
          ))}
        </ReactSortable>
      )}
    </>
  );
}
