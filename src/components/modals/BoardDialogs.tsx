// src/components/modals/BoardDialogs.tsx
// Dialogs for board CRUD (create, rename, delete)

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { toast } from 'sonner';

// ─── Create board dialog ──────────────────────────────────────────────────────
interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const createBoard = useAppStore(s => s.createBoard);
  const setActiveBoard = useAppStore(s => s.setActiveBoard);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    const boardId = createBoard(name);
    if (!boardId) { setError('Ya existe un tablero con ese nombre'); return; }
    setActiveBoard(boardId);
    toast.success(`Tablero "${name}" creado`);
    setName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo tablero</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="Nombre del tablero"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rename board dialog ──────────────────────────────────────────────────────
interface RenameBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  currentName: string;
}

export function RenameBoardDialog({ open, onOpenChange, boardId, currentName }: RenameBoardDialogProps) {
  const renameBoard = useAppStore(s => s.renameBoard);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  const handleRename = () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    const ok = renameBoard(boardId, name);
    if (!ok) { setError('Ya existe un tablero con ese nombre'); return; }
    toast.success(`Tablero renombrado a "${name}"`);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Renombrar tablero</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleRename}>Renombrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete board confirm ─────────────────────────────────────────────────────
interface DeleteBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
}

export function DeleteBoardDialog({ open, onOpenChange, boardId, boardName }: DeleteBoardDialogProps) {
  const deleteBoard = useAppStore(s => s.deleteBoard);

  const handleDelete = () => {
    const ok = deleteBoard(boardId);
    if (!ok) {
      toast.error('No se puede eliminar el último tablero');
    } else {
      toast.success(`Tablero "${boardName}" eliminado`);
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tablero?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que deseas eliminar el tablero &quot;{boardName}&quot; y todos sus proyectos?
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
