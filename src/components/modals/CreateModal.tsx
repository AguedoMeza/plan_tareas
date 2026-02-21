// src/components/modals/CreateModal.tsx
// Modal for creating projects and elements (with tabs)

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { flattenTree } from '@/lib/dataUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { EstadoElemento } from '@/types';

const ESTADOS: EstadoElemento[] = ['Pendiente', 'En progreso', 'Completado', 'Bloqueado', 'Backlog'];

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Create Project Tab ────────────────────────────────────────────────────────
function CreateProjectTab({ onSuccess }: { onSuccess: () => void }) {
  const addProject = useAppStore(s => s.addProject);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    const ok = addProject(nombre, descripcion);
    if (ok) {
      setNombre(''); setDescripcion(''); setError('');
      onSuccess();
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <label className="text-sm font-medium mb-1 block">Nombre *</label>
        <Input
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError(''); }}
          placeholder="Nombre del proyecto"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Descripción</label>
        <Textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción del proyecto (opcional)"
          rows={2}
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Crear Proyecto
      </Button>
    </div>
  );
}

// ─── Create Element Tab ────────────────────────────────────────────────────────
function CreateElementTab({ onSuccess, nested = false }: { onSuccess: () => void; nested?: boolean }) {
  const proyectos = useAppStore(s => s.proyectos);
  const addElement = useAppStore(s => s.addElement);

  // Flatten tree for parent selection
  const allElements = flattenTree(proyectos, true);

  const [parentPath, setParentPath] = useState<number[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [esfuerzo, setEsfuerzo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estado, setEstado] = useState<EstadoElemento>('Pendiente');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (parentPath.length === 0) { setError('Selecciona el elemento padre'); return; }
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    const ok = addElement(parentPath, nombre, { descripcion, prioridad, esfuerzo, deadline, estado });
    if (ok) {
      setNombre(''); setDescripcion(''); setError('');
      onSuccess();
    }
  };

  return (
    <div className="space-y-3 py-2">
      <div>
        <label className="text-sm font-medium mb-1 block">Padre *</label>
        <select
          value={parentPath.join(',')}
          onChange={e => {
            const val = e.target.value;
            setParentPath(val ? val.split(',').map(Number) : []);
            setError('');
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">-- Seleccionar padre --</option>
          {allElements.map(({ element, path, displayName }) => (
            <option key={path.join(',')} value={path.join(',')}>
              {displayName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Nombre *</label>
        <Input
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError(''); }}
          placeholder="Nombre del elemento"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Descripción</label>
        <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-medium mb-1 block">Prioridad</label>
          <select
            value={prioridad}
            onChange={e => setPrioridad(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">—</option>
            <option value="1">Alta</option>
            <option value="2">Media</option>
            <option value="3">Baja</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Esfuerzo</label>
          <Input value={esfuerzo} onChange={e => setEsfuerzo(e.target.value)} placeholder="ej. 3d, 1s" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Deadline</label>
          <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Estado</label>
        <select
          value={estado}
          onChange={e => setEstado(e.target.value as EstadoElemento)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <Button onClick={handleSubmit} className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Crear Elemento
      </Button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function CreateModal({ open, onOpenChange }: CreateModalProps) {
  const [tab, setTab] = useState('proyecto');

  const handleSuccess = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="proyecto" className="flex-1">Proyecto</TabsTrigger>
            <TabsTrigger value="elemento" className="flex-1">Elemento Hijo</TabsTrigger>
            <TabsTrigger value="anidado" className="flex-1">Anidado</TabsTrigger>
          </TabsList>
          <TabsContent value="proyecto">
            <CreateProjectTab onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="elemento">
            <CreateElementTab onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="anidado">
            <CreateElementTab onSuccess={handleSuccess} nested />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
