// src/components/sidebar/LeftSidebar.tsx
// Left navigation sidebar — spacing calibrated to professional app standards

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  LayoutGrid, Eye, LayoutList, Plus, Pencil, Trash2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateBoardDialog, RenameBoardDialog, DeleteBoardDialog } from '@/components/modals/BoardDialogs';

// ─── Nav item ─────────────────────────────────────────────────────────────────

interface NavItemProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

function NavItem({ label, icon, active, badge, onClick, onRename, onDelete }: NavItemProps) {
  const [hovered, setHovered] = useState(false);
  const hasActions = onRename || onDelete;

  return (
    <div
      className={cn(
        // 40px target height: py-2.5 + text = ~40px
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer select-none',
        'transition-colors duration-100',
        active
          ? 'bg-[rgba(27,210,122,.1)] text-[#E7EEF8]'
          : 'text-[rgba(231,238,248,.55)] hover:bg-[rgba(255,255,255,.05)] hover:text-[rgba(231,238,248,.9)]',
      )}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#1BD27A]" />
      )}

      {/* Icon — 16px, proper size */}
      {icon && (
        <span className={cn(
          'shrink-0 flex items-center justify-center',
          active ? 'text-[#1BD27A]' : 'text-[rgba(231,238,248,.35)] group-hover:text-[rgba(231,238,248,.6)]'
        )}>
          {icon}
        </span>
      )}

      {/* Label — 13px */}
      <span className="flex-1 text-[13px] font-medium truncate leading-none">
        {label}
      </span>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="shrink-0 font-mono text-[11px] text-[#1BD27A] font-bold tabular-nums bg-[rgba(27,210,122,.12)] px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}

      {/* Hover action buttons */}
      {hasActions && hovered && (
        <div
          className="absolute right-2 flex items-center gap-0.5"
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <button
              className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,.1)] text-[rgba(231,238,248,.4)] hover:text-[rgba(231,238,248,.85)] transition-colors"
              onClick={onRename}
              title="Renombrar"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              className="p-1.5 rounded-md hover:bg-[rgba(255,90,106,.15)] text-[rgba(231,238,248,.4)] hover:text-[#FF5A6A] transition-colors"
              onClick={onDelete}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  label, collapsible, collapsed, onToggle,
}: {
  label: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className={cn('flex items-center gap-1 px-3 pt-5 pb-1.5', collapsible && 'cursor-pointer')}
      onClick={collapsible ? onToggle : undefined}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(231,238,248,.28)] flex-1 select-none">
        {label}
      </span>
      {collapsible && (
        <span className="text-[rgba(231,238,248,.25)]">
          {collapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />
          }
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeftSidebar() {
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const setActiveBoard = useAppStore(s => s.setActiveBoard);
  const vista = useAppStore(s => s.vista);
  const setVista = useAppStore(s => s.setVista);
  const boardSelectorOpen = useAppStore(s => s.boardSelectorOpen);
  const toggleBoardSelector = useAppStore(s => s.toggleBoardSelector);
  const closeBoardSelector = useAppStore(s => s.closeBoardSelector);
  const proyectos = useAppStore(s => s.proyectos);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [boardsCollapsed, setBoardsCollapsed] = useState(false);

  const boardEntries = Object.entries(boards);
  const vivoCount = countVivos(proyectos);

  const handleSelectBoard = (id: string) => { setActiveBoard(id); closeBoardSelector(); };
  const handleSelectVista = (v: 'completa' | 'viva') => { setVista(v); closeBoardSelector(); };

  return (
    <>
      {/* w-52 = 208px — professional sidebar width */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-[rgba(255,255,255,.06)] bg-[#09111a]">

        {/* App brand — 52px height matches toolbar */}
        <div className="flex items-center gap-3 px-5 h-[52px] shrink-0 border-b border-[rgba(255,255,255,.06)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1BD27A] shrink-0 shadow-[0_0_12px_rgba(27,210,122,.3)]">
            <LayoutGrid className="h-3.5 w-3.5 text-[#09111a]" />
          </span>
          <span className="text-[14px] font-bold text-[#E7EEF8] tracking-tight">
            Plan Tareas
          </span>
        </div>

        {/* Scrollable nav area */}
        <ScrollArea className="flex-1">
          {/* Views section */}
          <div className="px-3 pt-1">
            <SectionHeader label="Vistas" />
            <NavItem
              label="Tableros"
              icon={<LayoutGrid className="h-4 w-4" />}
              active={boardSelectorOpen}
              onClick={toggleBoardSelector}
            />
            <NavItem
              label="Completa"
              icon={<LayoutList className="h-4 w-4" />}
              active={!boardSelectorOpen && vista === 'completa'}
              onClick={() => handleSelectVista('completa')}
            />
            <NavItem
              label="Viva"
              icon={<Eye className="h-4 w-4" />}
              active={!boardSelectorOpen && vista === 'viva'}
              badge={vivoCount}
              onClick={() => handleSelectVista('viva')}
            />
          </div>

          {/* Divider */}
          <div className="mx-4 mt-4 h-px bg-[rgba(255,255,255,.05)]" />

          {/* Boards section */}
          <div className="px-3">
            <SectionHeader
              label="Mis tableros"
              collapsible
              collapsed={boardsCollapsed}
              onToggle={() => setBoardsCollapsed(c => !c)}
            />

            {!boardsCollapsed && (
              <>
                {boardEntries.map(([id, board]) => (
                  <NavItem
                    key={id}
                    label={board.name}
                    icon={
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: board.color || '#1BD27A' }}
                      />
                    }
                    active={!boardSelectorOpen && id === activeBoardId}
                    onClick={() => handleSelectBoard(id)}
                    onRename={() => setRenameTarget({ id, name: board.name })}
                    onDelete={boardEntries.length > 1 ? () => setDeleteTarget({ id, name: board.name }) : undefined}
                  />
                ))}

                {/* Add board row */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-[rgba(231,238,248,.35)] hover:text-[rgba(231,238,248,.65)] hover:bg-[rgba(255,255,255,.04)] transition-colors"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="text-[13px] font-medium">Nuevo tablero</span>
                </button>
              </>
            )}
          </div>

          <div className="h-6" />
        </ScrollArea>
      </aside>

      {/* Dialogs */}
      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />
      {renameTarget && (
        <RenameBoardDialog
          open
          onOpenChange={open => !open && setRenameTarget(null)}
          boardId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
      {deleteTarget && (
        <DeleteBoardDialog
          open
          onOpenChange={open => !open && setDeleteTarget(null)}
          boardId={deleteTarget.id}
          boardName={deleteTarget.name}
        />
      )}
    </>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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
