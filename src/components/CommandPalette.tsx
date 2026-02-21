// src/components/CommandPalette.tsx
// Cmd+K command palette: switch boards, switch views, quick actions

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { LayoutGrid, LayoutList, Eye, ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type CommandItem =
  | { kind: 'board'; id: string; name: string; color: string }
  | { kind: 'view'; view: 'completa' | 'viva'; label: string }
  | { kind: 'boards-screen' };

// ─── Component ────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const setActiveBoard = useAppStore(s => s.setActiveBoard);
  const setVista = useAppStore(s => s.setVista);
  const vista = useAppStore(s => s.vista);
  const toggleBoardSelector = useAppStore(s => s.toggleBoardSelector);
  const closeBoardSelector = useAppStore(s => s.closeBoardSelector);

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build full item list
  const allItems: CommandItem[] = [
    { kind: 'boards-screen' },
    { kind: 'view', view: 'completa', label: 'Vista Completa' },
    { kind: 'view', view: 'viva', label: 'Vista Viva' },
    ...Object.entries(boards).map(([id, b]) => ({
      kind: 'board' as const,
      id,
      name: b.name,
      color: b.color || '#1BD27A',
    })),
  ];

  // Filter by query
  const filtered = query.trim()
    ? allItems.filter(item => {
        if (item.kind === 'board') return item.name.toLowerCase().includes(query.toLowerCase());
        if (item.kind === 'view') return item.label.toLowerCase().includes(query.toLowerCase());
        return 'tableros'.includes(query.toLowerCase());
      })
    : allItems;

  // Reset cursor when filter changes
  useEffect(() => { setCursor(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback((item: CommandItem) => {
    if (item.kind === 'board') {
      setActiveBoard(item.id);
      closeBoardSelector();
    } else if (item.kind === 'view') {
      setVista(item.view);
      closeBoardSelector();
    } else if (item.kind === 'boards-screen') {
      toggleBoardSelector();
    }
    onClose();
  }, [setActiveBoard, setVista, toggleBoardSelector, closeBoardSelector, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[cursor]) execute(filtered[cursor]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const itemLabel = (item: CommandItem) => {
    if (item.kind === 'board') return item.name;
    if (item.kind === 'view') return item.label;
    return 'Ver todos los tableros';
  };

  const itemIcon = (item: CommandItem) => {
    if (item.kind === 'board') return (
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
    );
    if (item.kind === 'view' && item.view === 'completa') return <LayoutList className="h-3.5 w-3.5 shrink-0 text-[rgba(231,238,248,.4)]" />;
    if (item.kind === 'view' && item.view === 'viva') return <Eye className="h-3.5 w-3.5 shrink-0 text-[rgba(231,238,248,.4)]" />;
    return <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[rgba(231,238,248,.4)]" />;
  };

  const isActive = (item: CommandItem) => {
    if (item.kind === 'board') return item.id === activeBoardId;
    if (item.kind === 'view') return item.view === vista;
    return false;
  };

  const sectionLabel = (item: CommandItem, idx: number): string | null => {
    const prev = filtered[idx - 1];
    if (idx === 0) return null;
    if (item.kind === 'board' && prev?.kind !== 'board') return 'Tableros';
    if (item.kind === 'view' && prev?.kind !== 'view') return 'Vistas';
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-md border-[rgba(255,255,255,.1)] bg-[#0e1623] shadow-2xl overflow-hidden"
        style={{ borderRadius: '12px' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,.07)]">
          <Search className="h-4 w-4 text-[rgba(231,238,248,.3)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tablero, vista…"
            className="flex-1 bg-transparent text-[13px] text-[#E7EEF8] placeholder:text-[rgba(231,238,248,.3)] outline-none"
          />
          <kbd className="text-[10px] font-mono text-[rgba(231,238,248,.2)] border border-[rgba(255,255,255,.1)] rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="py-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-[12px] text-[rgba(231,238,248,.3)]">
              Sin resultados
            </p>
          )}

          {filtered.map((item, idx) => {
            const section = sectionLabel(item, idx);
            const active = cursor === idx;
            return (
              <div key={idx}>
                {section && (
                  <p className="px-4 pt-3 pb-1 text-[9px] font-mono uppercase tracking-[0.14em] text-[rgba(231,238,248,.22)]">
                    {section}
                  </p>
                )}
                <div
                  data-idx={idx}
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2 rounded-md cursor-pointer transition-colors duration-75',
                    active
                      ? 'bg-[rgba(27,210,122,.1)] text-[#E7EEF8]'
                      : 'text-[rgba(231,238,248,.7)] hover:bg-[rgba(255,255,255,.05)]'
                  )}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setCursor(idx)}
                >
                  {itemIcon(item)}
                  <span className="flex-1 text-[13px] truncate">{itemLabel(item)}</span>
                  {isActive(item) && (
                    <span className="text-[10px] font-mono text-[#1BD27A]">activo</span>
                  )}
                  {active && !isActive(item) && (
                    <ArrowRight className="h-3 w-3 text-[rgba(231,238,248,.3)]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[rgba(255,255,255,.06)]">
          <span className="text-[10px] text-[rgba(231,238,248,.2)] font-mono">↑↓ navegar</span>
          <span className="text-[10px] text-[rgba(231,238,248,.2)] font-mono">↵ seleccionar</span>
          <span className="text-[10px] text-[rgba(231,238,248,.2)] font-mono">esc cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
