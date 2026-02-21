// src/components/toolbar/Toolbar.tsx
// Toolbar: breadcrumb + actions. Board navigation lives in LeftSidebar.

import { useRef, useState, useEffect } from 'react';
import { Plus, Download, Upload, Bot, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { CreateModal } from '@/components/modals/CreateModal';
import { CommandPalette } from '@/components/CommandPalette';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function Toolbar() {
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const exportBoard = useAppStore(s => s.exportBoard);
  const importBoard = useAppStore(s => s.importBoard);
  const aiOpen = useAppStore(s => s.aiOpen);
  const toggleAI = useAppStore(s => s.toggleAI);
  const boardSelectorOpen = useAppStore(s => s.boardSelectorOpen);
  const vista = useAppStore(s => s.vista);

  const [createOpen, setCreateOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const activeBoard = boards[activeBoardId];

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.proyectosData || !Array.isArray(data.proyectosData)) {
          toast.error('Archivo inválido: no contiene proyectos');
          return;
        }
        importBoard(data);
        toast.success(`Tablero "${data.boardName || 'Importado'}" cargado`);
      } catch {
        toast.error('Error al leer el archivo');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Breadcrumb segments
  const boardName = activeBoard?.name || '—';
  const viewLabel = boardSelectorOpen ? null : vista === 'viva' ? 'Vista Viva' : 'Tablero';

  return (
    <>
      <header className="sticky top-0 z-20 bg-card border-b border-border px-5 h-[52px] flex items-center gap-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {boardSelectorOpen ? (
            <span className="text-[14px] font-semibold text-foreground">Todos los tableros</span>
          ) : (
            <>
              {/* Board color dot */}
              {activeBoard?.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: activeBoard.color }}
                />
              )}
              <span className="text-[14px] font-semibold text-foreground truncate">
                {boardName}
              </span>
              {viewLabel && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{viewLabel}</span>
                </>
              )}
            </>
          )}

          {/* Cmd+K hint */}
          <button
            className="ml-2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground hover:border-border/80 transition-colors"
            onClick={() => setPaletteOpen(true)}
            title="Abrir buscador (Ctrl+K)"
          >
            <span>⌘K</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={exportBoard}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar tablero</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => importRef.current?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Importar tablero</TooltipContent>
          </Tooltip>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={aiOpen ? 'default' : 'outline'} size="icon" onClick={toggleAI}>
                <Bot className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Asistente IA</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <CreateModal open={createOpen} onOpenChange={setCreateOpen} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
