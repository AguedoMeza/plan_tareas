// src/components/board/BoardView.tsx
// Full board view with sections: Activos, Backlog, Archivados

import { useAppStore } from '@/store/appStore';
import { BoardSection } from './BoardSection';
import { LayoutGrid } from 'lucide-react';
import type { Proyecto } from '@/types';

export function BoardView() {
  const proyectos = useAppStore(s => s.proyectos);

  const activos: { proyecto: Proyecto; originalIndex: number }[] = [];
  const backlog: { proyecto: Proyecto; originalIndex: number }[] = [];
  const archivados: { proyecto: Proyecto; originalIndex: number }[] = [];

  proyectos.forEach((p, i) => {
    const estado = p.estadoProyecto || 'Activo';
    if (estado === 'Activo') activos.push({ proyecto: p, originalIndex: i });
    else if (estado === 'Backlog') backlog.push({ proyecto: p, originalIndex: i });
    else if (estado === 'Archivado') archivados.push({ proyecto: p, originalIndex: i });
  });

  const isEmpty = activos.length === 0 && backlog.length === 0 && archivados.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Sin proyectos</p>
        <p className="text-sm mt-1">Crea tu primer proyecto con el botón «+ Nuevo»</p>
      </div>
    );
  }

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <BoardSection
        title="Activos"
        proyectos={activos}
        sortable
        emptyMessage="No hay proyectos activos"
      />
      <BoardSection
        title="Backlog"
        proyectos={backlog}
        sortable
        defaultCollapsed={false}
      />
      <BoardSection
        title="Archivados"
        proyectos={archivados}
        defaultCollapsed={archivados.length > 0}
      />
    </div>
  );
}
