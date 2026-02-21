// src/components/board/BoardSelectorView.tsx
// Full-screen board selector with stats cards

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ArrowRight, CheckCircle2, Zap, AlertOctagon, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { CreateBoardDialog, RenameBoardDialog, DeleteBoardDialog } from '@/components/modals/BoardDialogs';
import { cn } from '@/lib/utils';
import type { Proyecto, BoardMeta } from '@/types';

// ─── Stats computation ────────────────────────────────────────────────────────

interface BoardStats {
  totalProjects: number;
  active: number;
  backlog: number;
  archived: number;
  totalLeaf: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
  vivos: number;
  progress: number;
}

function loadBoardStats(boardId: string): BoardStats | null {
  try {
    const raw = localStorage.getItem(`boardData_${boardId}`);
    if (!raw) return null;
    const proyectos: Proyecto[] = JSON.parse(raw);

    let active = 0, backlog = 0, archived = 0;
    let totalLeaf = 0, completed = 0, inProgress = 0, blocked = 0, pending = 0;

    function walkEl(el: Proyecto | { estado?: string; elementos?: unknown[] }) {
      const elAny = el as any;
      if (!Array.isArray(elAny.elementos) || elAny.elementos.length === 0) {
        totalLeaf++;
        if (elAny.estado === 'Completado') completed++;
        else if (elAny.estado === 'En progreso') inProgress++;
        else if (elAny.estado === 'Bloqueado') blocked++;
        else if (elAny.estado === 'Pendiente') pending++;
      } else {
        elAny.elementos.forEach(walkEl);
      }
    }

    proyectos.forEach(p => {
      if (p.estadoProyecto === 'Activo') active++;
      else if (p.estadoProyecto === 'Backlog') backlog++;
      else if (p.estadoProyecto === 'Archivado') archived++;
      (p.elementos || []).forEach(walkEl);
    });

    const progress = totalLeaf > 0 ? Math.round((completed / totalLeaf) * 100) : 0;
    const vivos = pending + inProgress;

    return { totalProjects: proyectos.length, active, backlog, archived, totalLeaf, completed, inProgress, blocked, pending, vivos, progress };
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return '—';
  }
}

// ─── Board Card ───────────────────────────────────────────────────────────────

interface BoardCardProps {
  boardId: string;
  board: BoardMeta;
  stats: BoardStats | null;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  animIndex: number;
}

function BoardCard({ boardId, board, stats, isActive, onSelect, onRename, onDelete, animIndex }: BoardCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-[10px] border cursor-pointer overflow-hidden',
        'transition-all duration-200',
        isActive ? 'bg-[#0e1c17]' : 'bg-[#111822]'
      )}
      style={{
        animationDelay: `${animIndex * 60}ms`,
        borderColor: isActive
          ? (board.color || '#1BD27A')
          : hovered
          ? `${board.color || '#1BD27A'}55`
          : 'rgba(255,255,255,.08)',
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top color stripe — uses board color */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: board.color || '#1BD27A',
          opacity: isActive ? 1 : hovered ? 0.5 : 0.25,
          transition: 'opacity 0.2s',
        }}
      />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-[#E7EEF8] leading-tight truncate">
              {board.name}
            </h3>
            {isActive && (
              <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#1BD27A]">
                Activo
              </span>
            )}
          </div>

          {/* Action buttons on hover */}
          <div
            className={cn(
              'flex items-center gap-0.5 transition-opacity duration-150',
              hovered ? 'opacity-100' : 'opacity-0'
            )}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] text-[rgba(231,238,248,.45)] hover:text-[#E7EEF8] transition-colors"
              onClick={onRename}
              title="Renombrar"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-[rgba(255,90,106,.15)] text-[rgba(231,238,248,.45)] hover:text-[#FF5A6A] transition-colors"
              onClick={onDelete}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats ? (
          <div className="flex flex-col gap-2">
            {/* Project count */}
            <div className="flex items-center gap-1.5 text-[12px] text-[rgba(231,238,248,.65)]">
              <FolderOpen className="h-3 w-3 shrink-0" />
              <span>
                <span className="text-[#E7EEF8] font-semibold">{stats.totalProjects}</span> proyectos
                {stats.archived > 0 && (
                  <span className="ml-1.5 text-[11px] text-[rgba(231,238,248,.35)]">({stats.archived} arch.)</span>
                )}
              </span>
            </div>

            {/* Task stats row */}
            <div className="flex items-center gap-3">
              {stats.vivos > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <Zap className="h-3 w-3 text-[#1BD27A]" />
                  <span className="font-mono font-semibold text-[#1BD27A]">{stats.vivos}</span>
                  <span className="text-[rgba(231,238,248,.45)]">vivas</span>
                </div>
              )}
              {stats.blocked > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <AlertOctagon className="h-3 w-3 text-[#FF5A6A]" />
                  <span className="font-mono font-semibold text-[#FF5A6A]">{stats.blocked}</span>
                  <span className="text-[rgba(231,238,248,.45)]">bloq.</span>
                </div>
              )}
              {stats.completed > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="h-3 w-3 text-[rgba(231,238,248,.35)]" />
                  <span className="font-mono text-[rgba(231,238,248,.45)]">{stats.completed}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-[rgba(231,238,248,.35)] italic">Sin datos</p>
        )}
      </div>

      {/* Footer: progress bar + date */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {stats && stats.totalLeaf > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-[rgba(231,238,248,.35)]">progreso</span>
              <span className="text-[10px] font-mono text-[rgba(231,238,248,.55)]">{stats.progress}%</span>
            </div>
            <div className="h-[4px] rounded-full bg-[rgba(255,255,255,.06)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.progress}%`,
                  background: stats.progress === 100
                    ? '#1BD27A'
                    : 'linear-gradient(90deg, #1BD27A88, #1BD27A)',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[rgba(231,238,248,.25)]">
            {formatDate(board.lastModified)}
          </span>
          <ArrowRight
            className={cn(
              'h-3.5 w-3.5 transition-all duration-200',
              hovered
                ? 'text-[#1BD27A] translate-x-0.5'
                : 'text-[rgba(231,238,248,.2)]'
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ─── New Board Card ───────────────────────────────────────────────────────────

function NewBoardCard({ onClick, animIndex }: { onClick: () => void; animIndex: number }) {
  return (
    <button
      className="group flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[rgba(255,255,255,.1)] bg-transparent hover:border-[#1BD27A]/40 hover:bg-[rgba(27,210,122,.03)] transition-all duration-200 min-h-[140px] p-4 cursor-pointer"
      style={{ animationDelay: `${animIndex * 60}ms` }}
      onClick={onClick}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[rgba(255,255,255,.15)] group-hover:border-[#1BD27A]/40 transition-colors">
        <Plus className="h-4 w-4 text-[rgba(231,238,248,.3)] group-hover:text-[#1BD27A] transition-colors" />
      </div>
      <span className="text-[12px] text-[rgba(231,238,248,.35)] group-hover:text-[rgba(231,238,248,.65)] transition-colors">
        Nuevo tablero
      </span>
    </button>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface BoardSelectorViewProps {
  onClose: () => void;
}

export function BoardSelectorView({ onClose }: BoardSelectorViewProps) {
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const setActiveBoard = useAppStore(s => s.setActiveBoard);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Compute stats per board (from localStorage)
  const boardEntries = useMemo(() => Object.entries(boards), [boards]);
  const statsMap = useMemo(() => {
    const map: Record<string, BoardStats | null> = {};
    boardEntries.forEach(([id]) => {
      map[id] = loadBoardStats(id);
    });
    return map;
  }, [boardEntries]);

  const handleSelect = (boardId: string) => {
    setActiveBoard(boardId);
    onClose();
  };

  return (
    <>
      <div className="flex-1 overflow-auto board-selector-container">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-end justify-between max-w-5xl mx-auto">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[rgba(231,238,248,.3)] mb-1">
                plan_tareas
              </p>
              <h1 className="text-[22px] font-bold text-[#E7EEF8] leading-none">
                Tableros
              </h1>
            </div>
            <span className="text-[12px] font-mono text-[rgba(231,238,248,.3)]">
              {boardEntries.length} {boardEntries.length === 1 ? 'tablero' : 'tableros'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 max-w-5xl mx-auto">
          <div className="h-px bg-[rgba(255,255,255,.06)]" />
        </div>

        {/* Grid */}
        <div className="px-6 pt-6 pb-10 max-w-5xl mx-auto">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {boardEntries.map(([id, board], i) => (
              <BoardCard
                key={id}
                boardId={id}
                board={board}
                stats={statsMap[id]}
                isActive={id === activeBoardId}
                onSelect={() => handleSelect(id)}
                onRename={() => setRenameTarget({ id, name: board.name })}
                onDelete={() => setDeleteTarget({ id, name: board.name })}
                animIndex={i}
              />
            ))}
            <NewBoardCard
              onClick={() => setCreateOpen(true)}
              animIndex={boardEntries.length}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} />

      {renameTarget && (
        <RenameBoardDialog
          open={!!renameTarget}
          onOpenChange={open => !open && setRenameTarget(null)}
          boardId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}

      {deleteTarget && (
        <DeleteBoardDialog
          open={!!deleteTarget}
          onOpenChange={open => !open && setDeleteTarget(null)}
          boardId={deleteTarget.id}
          boardName={deleteTarget.name}
        />
      )}
    </>
  );
}
