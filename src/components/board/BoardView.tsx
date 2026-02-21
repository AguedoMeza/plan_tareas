// src/components/board/BoardView.tsx
// Board view: Activos+Backlog como secciones, Archivados en tab separado

import { useAppStore } from '@/store/appStore';
import { BoardSection } from './BoardSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreateModal } from '@/components/modals/CreateModal';
import { LayoutGrid, Archive, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Proyecto } from '@/types';

export function BoardView() {
  const proyectos = useAppStore(s => s.proyectos);
  const [createOpen, setCreateOpen] = useState(false);

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
      <>
        <div className="flex flex-col items-center justify-center flex-1 py-16 select-none">
          {/* Icon cluster */}
          <div className="relative mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(27,210,122,.08)] border border-[rgba(27,210,122,.15)]">
              <LayoutGrid className="h-7 w-7 text-[#1BD27A] opacity-60" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(27,210,122,.12)] border border-[rgba(27,210,122,.2)]">
              <Sparkles className="h-3 w-3 text-[#1BD27A]" />
            </div>
          </div>

          <h3 className="text-[15px] font-semibold text-foreground mb-1">
            Tablero vacío
          </h3>
          <p className="text-[13px] text-muted-foreground mb-6 text-center max-w-xs">
            Crea tu primer proyecto para empezar a organizar tareas y hacer seguimiento del progreso.
          </p>

          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear primer proyecto
          </Button>

          <p className="mt-4 text-[11px] text-muted-foreground/50 font-mono">
            también puedes importar un tablero con el botón ↑ del toolbar
          </p>
        </div>
        <CreateModal open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }

  // Clases para tabs estilo underline (Gmail)
  const triggerCls = cn(
    'relative rounded-none bg-transparent px-5 py-3.5 text-[14px] font-semibold shadow-none',
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
              <span className="ml-2 text-[12px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 leading-none font-semibold">
                {activos.length + backlog.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archivados" className={triggerCls}>
            <Archive className="h-4 w-4 mr-1.5 opacity-60" />
            Archivados
            {archivados.length > 0 && (
              <span className="ml-2 text-[12px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 leading-none font-semibold">
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
          <div className="px-8 py-10 w-full max-w-5xl mx-auto">
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
          <div className="px-8 py-10 w-full max-w-5xl mx-auto">
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
