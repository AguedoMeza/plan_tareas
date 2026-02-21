// src/components/board/BoardView.tsx
// Board view: Activos+Backlog como secciones, Archivados en tab separado

import { useAppStore } from '@/store/appStore';
import { BoardSection } from './BoardSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutGrid, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const boardEmpty = activos.length === 0 && backlog.length === 0;
  const totalEmpty = boardEmpty && archivados.length === 0;

  if (totalEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-base font-semibold">Sin proyectos</p>
        <p className="text-sm mt-1 opacity-60">Crea tu primer proyecto con el botón «+ Nuevo»</p>
      </div>
    );
  }

  // Clases para tabs estilo underline (Gmail)
  const triggerCls = cn(
    'relative rounded-none bg-transparent px-4 py-2.5 text-sm font-semibold shadow-none',
    'text-muted-foreground border-b-2 border-transparent -mb-px',
    'transition-colors hover:text-foreground',
    'data-[state=active]:text-foreground data-[state=active]:border-primary',
    'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
    'focus-visible:ring-0 focus-visible:ring-offset-0'
  );

  return (
    <Tabs defaultValue="tablero" className="flex flex-col flex-1">
      {/* Tab bar — underline style, alineada con max-w-5xl */}
      <div className="border-b border-border flex-shrink-0">
        <div className="px-6 w-full max-w-5xl mx-auto">
        <TabsList className="h-auto bg-transparent p-0 gap-1">
          <TabsTrigger value="tablero" className={triggerCls}>
            Tablero
            {(activos.length + backlog.length) > 0 && (
              <span className="ml-1.5 text-[11px] bg-muted text-muted-foreground rounded-full px-1.5 py-px leading-none">
                {activos.length + backlog.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archivados" className={triggerCls}>
            <Archive className="h-3.5 w-3.5 mr-1.5 opacity-60" />
            Archivados
            {archivados.length > 0 && (
              <span className="ml-1.5 text-[11px] bg-muted text-muted-foreground rounded-full px-1.5 py-px leading-none">
                {archivados.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        </div>
      </div>

      {/* Tablero: Activos + Backlog */}
      <TabsContent value="tablero" className="mt-0 flex-1 overflow-auto">
        {boardEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <LayoutGrid className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-semibold">Sin proyectos activos o en backlog</p>
            <p className="text-xs mt-1 opacity-60">Crea uno con «+ Nuevo» o revisa los archivados</p>
          </div>
        ) : (
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
          </div>
        )}
      </TabsContent>

      {/* Archivados */}
      <TabsContent value="archivados" className="mt-0 flex-1 overflow-auto">
        {archivados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Archive className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-semibold">Sin proyectos archivados</p>
          </div>
        ) : (
          <div className="p-6 w-full max-w-5xl mx-auto">
            <BoardSection
              title="Archivados"
              proyectos={archivados}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
