// src/components/toolbar/Toolbar.tsx
// Top toolbar with board selector, view toggle, and action buttons

import { useRef } from 'react';
import { Plus, Download, Upload, Pencil, Trash2, ChevronDown, LayoutList, Eye } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { CreateModal } from '@/components/modals/CreateModal';
import { CreateBoardDialog, RenameBoardDialog, DeleteBoardDialog } from '@/components/modals/BoardDialogs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Vista } from '@/types';

export function Toolbar() {
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const setActiveBoard = useAppStore(s => s.setActiveBoard);
  const vista = useAppStore(s => s.vista);
  const setVista = useAppStore(s => s.setVista);
  const exportBoard = useAppStore(s => s.exportBoard);
  const importBoard = useAppStore(s => s.importBoard);
  const proyectos = useAppStore(s => s.proyectos);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [renameBoardOpen, setRenameBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);

  const importRef = useRef<HTMLInputElement>(null);
  const activeBoard = boards[activeBoardId];

  const vivoCount = countVivos(proyectos);

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

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap">
      {/* Board selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 font-semibold px-2">
            {activeBoard?.name || 'Sin tablero'}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          {Object.entries(boards).map(([id, board]) => (
            <DropdownMenuItem
              key={id}
              className={cn(id === activeBoardId && 'font-medium text-primary')}
              onClick={() => setActiveBoard(id)}
            >
              {board.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateBoardOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo tablero
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRenameBoardOpen(true)}>
            <Pencil className="h-4 w-4" />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteBoardOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Separator */}
      <div className="h-5 w-px bg-border hidden sm:block" />

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
        <button
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
            vista === 'completa'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setVista('completa')}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Completa
        </button>
        <button
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
            vista === 'viva'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setVista('viva')}
        >
          <Eye className="h-3.5 w-3.5" />
          Viva
          {vivoCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs leading-none">
              {vivoCount}
            </span>
          )}
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={exportBoard}
          title="Exportar tablero JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => importRef.current?.click()}
          title="Importar tablero JSON"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Dialogs */}
      <CreateModal open={createOpen} onOpenChange={setCreateOpen} />
      <CreateBoardDialog open={createBoardOpen} onOpenChange={setCreateBoardOpen} />
      {activeBoard && (
        <>
          <RenameBoardDialog
            open={renameBoardOpen}
            onOpenChange={setRenameBoardOpen}
            boardId={activeBoardId}
            currentName={activeBoard.name}
          />
          <DeleteBoardDialog
            open={deleteBoardOpen}
            onOpenChange={setDeleteBoardOpen}
            boardId={activeBoardId}
            boardName={activeBoard.name}
          />
        </>
      )}
    </header>
  );
}

// Count elements that are "vivos": Pendiente or En progreso
import type { Proyecto, Elemento } from '@/types';

function countVivos(proyectos: Proyecto[]): number {
  let count = 0;
  function walk(el: Elemento) {
    if (!Array.isArray(el.elementos) || el.elementos.length === 0) {
      if (el.estado === 'Pendiente' || el.estado === 'En progreso') count++;
    } else {
      el.elementos.forEach(walk);
    }
  }
  proyectos.forEach(p => {
    if (p.estadoProyecto !== 'Archivado' && Array.isArray(p.elementos)) {
      p.elementos.forEach(walk);
    }
  });
  return count;
}
