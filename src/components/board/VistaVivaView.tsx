// src/components/board/VistaVivaView.tsx
// Filtered "vida" view: shows only active/pending leaf elements

import { useAppStore } from '@/store/appStore';
import { useVistaViva } from '@/hooks/useVistaViva';
import { EstadoBadge, PrioridadBadge } from '@/components/board/EstadoBadge';
import { Eye } from 'lucide-react';
import type { EstadoElemento } from '@/types';

export function VistaVivaView() {
  const proyectos = useAppStore(s => s.proyectos);
  const setElementEstado = useAppStore(s => s.setElementEstado);
  const rows = useVistaViva(proyectos);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Eye className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-base font-semibold">Todo bajo control</p>
        <p className="text-sm mt-1 text-muted-foreground/70">No hay elementos pendientes o en progreso</p>
      </div>
    );
  }

  return (
    <div className="p-4 flex-1">
      <div className="mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Vista Viva — <span className="text-primary font-semibold">{rows.length}</span> elemento{rows.length !== 1 ? 's' : ''} activo{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="th-ds">Proyecto</th>
              <th className="th-ds">Elemento</th>
              <th className="th-ds">Contexto</th>
              <th className="th-ds-center">Prior.</th>
              <th className="th-ds">Esfuerzo</th>
              <th className="th-ds-center">Deadline</th>
              <th className="th-ds-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ elemento, path, projectNombre, ancestorNames }) => (
              <tr
                key={path.join('-')}
                className="border-b border-border/40 hover:bg-accent/60 transition-colors"
              >
                <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">
                  {projectNombre}
                </td>
                <td className="py-2 px-2">
                  <p className="font-semibold text-sm leading-tight">{elemento.nombre}</p>
                  {elemento.descripcion && (
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                      {elemento.descripcion}
                    </p>
                  )}
                </td>
                <td className="py-2 px-2 text-[11px] text-muted-foreground">
                  {ancestorNames.length > 0 ? ancestorNames.join(' › ') : '—'}
                </td>
                <td className="py-2 px-2 text-center">
                  <PrioridadBadge prioridad={elemento.prioridad} />
                </td>
                <td className="py-2 px-2 text-xs font-semibold">
                  {elemento.esfuerzo || <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="py-2 px-2 text-center font-mono-date">
                  {elemento.deadline || <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="py-2 px-2 text-center">
                  <select
                    value={elemento.estado}
                    onChange={e => setElementEstado(path, e.target.value as EstadoElemento)}
                    className="text-[11px] rounded-full border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring px-2 py-0.5"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En progreso">En progreso</option>
                    <option value="Completado">Completado</option>
                    <option value="Bloqueado">Bloqueado</option>
                    <option value="Backlog">Backlog</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
