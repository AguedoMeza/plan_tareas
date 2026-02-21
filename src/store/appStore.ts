// src/store/appStore.ts
// Zustand store - migrated from storageController.js
// Compatible with existing localStorage keys: boardData_${boardId}, boards, lastUsedBoard

import { create } from 'zustand';
import type { Proyecto, Elemento, EstadoElemento, EstadoProyecto, BoardsRegistry, Vista } from '@/types';
import {
  cleanupCorruptedData,
  migrateOldData,
  generateBoardId,
  findByPath,
} from '@/lib/dataUtils';
import {
  ordenarElementosPorEstado,
  computeEstadoFromChildren,
} from '@/lib/businessRules';

// ─── Board color palette ──────────────────────────────────────────────────────

export const BOARD_COLORS = [
  '#1BD27A', // emerald (default accent)
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#A3E635', // lime
  '#64748B', // slate
] as const;

function pickBoardColor(boards: BoardsRegistry): string {
  const used = new Set(Object.values(boards).map(b => b.color).filter(Boolean));
  const available = BOARD_COLORS.filter(c => !used.has(c));
  if (available.length > 0) return available[0];
  // All used: cycle by index
  return BOARD_COLORS[Object.keys(boards).length % BOARD_COLORS.length];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadBoardsRegistry(): BoardsRegistry {
  try {
    return JSON.parse(localStorage.getItem('boards') || '{}');
  } catch {
    return {};
  }
}

function saveBoardsRegistry(boards: BoardsRegistry) {
  localStorage.setItem('boards', JSON.stringify(boards));
}

function loadBoardData(boardId: string): Proyecto[] {
  try {
    const raw = localStorage.getItem(`boardData_${boardId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    const migrated = migrateOldData(parsed);
    return cleanupCorruptedData(migrated);
  } catch {
    return [];
  }
}

function saveBoardData(boardId: string, proyectos: Proyecto[]) {
  localStorage.setItem(`boardData_${boardId}`, JSON.stringify(proyectos));
}

function loadCollapsedStates(boardId: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(`collapsedStates_${boardId}`) || '{}');
  } catch {
    return {};
  }
}

function saveCollapsedStates(boardId: string, states: Record<string, boolean>) {
  localStorage.setItem(`collapsedStates_${boardId}`, JSON.stringify(states));
}

// ─── Initialization ───────────────────────────────────────────────────────────

function initializeBoards(): { boardId: string; boards: BoardsRegistry; proyectos: Proyecto[] } {
  let boards = loadBoardsRegistry();

  if (Object.keys(boards).length === 0) {
    // Create default board
    const boardId = generateBoardId();
    boards[boardId] = {
      name: 'Tablero Principal',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    saveBoardsRegistry(boards);
    saveBoardData(boardId, []);
    localStorage.setItem('lastUsedBoard', boardId);
    return { boardId, boards, proyectos: [] };
  }

  const lastBoardId = localStorage.getItem('lastUsedBoard');
  const boardId = (lastBoardId && boards[lastBoardId]) ? lastBoardId : Object.keys(boards)[0];
  const proyectos = loadBoardData(boardId);

  return { boardId, boards, proyectos };
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppState {
  // Data
  proyectos: Proyecto[];
  boards: BoardsRegistry;
  activeBoardId: string;
  vista: Vista;
  collapsed: Record<string, boolean>; // key: projectIndex stringified or groupPath
  aiOpen: boolean;
  boardSelectorOpen: boolean;

  // ── Board actions ──
  setActiveBoard: (boardId: string) => void;
  createBoard: (name: string) => string | null;
  renameBoard: (boardId: string, newName: string) => boolean;
  deleteBoard: (boardId: string) => boolean;

  // ── Vista ──
  setVista: (vista: Vista) => void;

  // ── AI Panel ──
  toggleAI: () => void;

  // ── Board Selector ──
  toggleBoardSelector: () => void;
  closeBoardSelector: () => void;

  // ── Collapse ──
  toggleCollapsed: (key: string) => void;
  setCollapsed: (key: string, value: boolean) => void;

  // ── Project CRUD ──
  addProject: (nombre: string, descripcion?: string) => boolean;
  updateProject: (projectIndex: number, fields: Partial<Proyecto>) => void;
  deleteProject: (projectIndex: number) => void;
  setProjectEstado: (projectIndex: number, estado: EstadoProyecto) => void;
  reorderProjects: (newOrder: Proyecto[]) => void;

  // ── Element CRUD ──
  addElement: (
    parentPath: number[],
    nombre: string,
    opts?: {
      descripcion?: string;
      prioridad?: string;
      esfuerzo?: string;
      deadline?: string;
      estado?: EstadoElemento;
      tipo?: string;
    }
  ) => boolean;
  updateElement: (path: number[], fields: Partial<Elemento & { nombre: string }>) => void;
  deleteElement: (path: number[]) => void;
  setElementEstado: (path: number[], estado: EstadoElemento) => void;
  reorderElements: (parentPath: number[], newOrder: Elemento[]) => void;

  // ── Export / Import ──
  exportBoard: () => void;
  importBoard: (data: { boardName?: string; proyectosData: Proyecto[] }) => void;

  // ── Internal ──
  _save: () => void;
}

// ─── Create store ─────────────────────────────────────────────────────────────

const { boardId: initBoardId, boards: initBoards, proyectos: initProyectos } = initializeBoards();

export const useAppStore = create<AppState>((set, get) => ({
  proyectos: initProyectos,
  boards: initBoards,
  activeBoardId: initBoardId,
  vista: 'completa',
  collapsed: loadCollapsedStates(initBoardId),
  aiOpen: false,
  boardSelectorOpen: false,

  // ── Internal save ──
  _save: () => {
    const { activeBoardId, proyectos } = get();
    saveBoardData(activeBoardId, proyectos);
  },

  // ─── AI Panel ────────────────────────────────────────────────────────────
  toggleAI: () => set(state => ({ aiOpen: !state.aiOpen })),

  // ─── Board Selector ──────────────────────────────────────────────────────
  toggleBoardSelector: () => set(state => ({ boardSelectorOpen: !state.boardSelectorOpen })),
  closeBoardSelector: () => set({ boardSelectorOpen: false }),

  // ─── Vista ───────────────────────────────────────────────────────────────
  setVista: (vista) => set({ vista }),

  // ─── Collapse ────────────────────────────────────────────────────────────
  toggleCollapsed: (key) => {
    set(state => {
      const next = { ...state.collapsed, [key]: !state.collapsed[key] };
      saveCollapsedStates(state.activeBoardId, next);
      return { collapsed: next };
    });
  },
  setCollapsed: (key, value) => {
    set(state => {
      const next = { ...state.collapsed, [key]: value };
      saveCollapsedStates(state.activeBoardId, next);
      return { collapsed: next };
    });
  },

  // ─── Board actions ────────────────────────────────────────────────────────
  setActiveBoard: (boardId) => {
    const { boards } = get();
    if (!boards[boardId]) return;

    const proyectos = loadBoardData(boardId);
    const collapsed = loadCollapsedStates(boardId);

    // Update lastModified
    const updatedBoards = {
      ...boards,
      [boardId]: { ...boards[boardId], lastModified: new Date().toISOString() },
    };
    saveBoardsRegistry(updatedBoards);
    localStorage.setItem('lastUsedBoard', boardId);

    set({ activeBoardId: boardId, boards: updatedBoards, proyectos, collapsed });
  },

  createBoard: (name) => {
    const { boards } = get();
    const cleanName = name.trim();
    if (!cleanName) return null;
    if (Object.values(boards).some(b => b.name === cleanName)) return null;

    const boardId = generateBoardId();
    const updatedBoards: BoardsRegistry = {
      ...boards,
      [boardId]: {
        name: cleanName,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        color: pickBoardColor(boards),
      },
    };

    saveBoardsRegistry(updatedBoards);
    saveBoardData(boardId, []);
    set({ boards: updatedBoards });
    return boardId;
  },

  renameBoard: (boardId, newName) => {
    const { boards } = get();
    const cleanName = newName.trim();
    if (!cleanName || !boards[boardId]) return false;
    if (Object.entries(boards).some(([id, b]) => id !== boardId && b.name === cleanName)) return false;

    const updatedBoards: BoardsRegistry = {
      ...boards,
      [boardId]: { ...boards[boardId], name: cleanName, lastModified: new Date().toISOString() },
    };
    saveBoardsRegistry(updatedBoards);
    set({ boards: updatedBoards });
    return true;
  },

  deleteBoard: (boardId) => {
    const { boards, activeBoardId } = get();
    if (!boards[boardId] || Object.keys(boards).length <= 1) return false;

    const updatedBoards = { ...boards };
    delete updatedBoards[boardId];
    localStorage.removeItem(`boardData_${boardId}`);
    localStorage.removeItem(`collapsedStates_${boardId}`);
    localStorage.removeItem(`grouperStates_${boardId}`);
    saveBoardsRegistry(updatedBoards);

    if (activeBoardId === boardId) {
      const nextId = Object.keys(updatedBoards)[0];
      const proyectos = loadBoardData(nextId);
      const collapsed = loadCollapsedStates(nextId);
      localStorage.setItem('lastUsedBoard', nextId);
      set({ boards: updatedBoards, activeBoardId: nextId, proyectos, collapsed });
    } else {
      set({ boards: updatedBoards });
    }
    return true;
  },

  // ─── Project CRUD ─────────────────────────────────────────────────────────
  addProject: (nombre, descripcion = '') => {
    if (!nombre.trim()) return false;

    const nuevoProyecto: Proyecto = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipo: 'proyecto',
      estadoProyecto: 'Activo',
      avance: '',
      prioridad: '',
      esfuerzo: '',
      deadline: '',
      estado: 'Pendiente',
      elementos: [],
    };

    set(state => ({ proyectos: [...state.proyectos, nuevoProyecto] }));
    get()._save();
    return true;
  },

  updateProject: (projectIndex, fields) => {
    set(state => {
      const proyectos = [...state.proyectos];
      if (!proyectos[projectIndex]) return state;
      proyectos[projectIndex] = { ...proyectos[projectIndex], ...fields };
      return { proyectos };
    });
    get()._save();
  },

  deleteProject: (projectIndex) => {
    set(state => {
      const proyectos = state.proyectos.filter((_, i) => i !== projectIndex);
      return { proyectos };
    });
    get()._save();
  },

  setProjectEstado: (projectIndex, estado) => {
    set(state => {
      const proyectos = [...state.proyectos];
      if (!proyectos[projectIndex]) return state;
      proyectos[projectIndex] = { ...proyectos[projectIndex], estadoProyecto: estado };
      return { proyectos };
    });
    get()._save();
  },

  reorderProjects: (newOrder) => {
    set({ proyectos: newOrder });
    get()._save();
  },

  // ─── Element CRUD ─────────────────────────────────────────────────────────
  addElement: (parentPath, nombre, opts = {}) => {
    if (!nombre.trim()) return false;

    const nuevoElemento: Elemento = {
      nombre: nombre.trim(),
      descripcion: opts.descripcion?.trim() || '',
      tipo: opts.tipo || 'elemento',
      prioridad: (opts.prioridad as Elemento['prioridad']) || '',
      avance: '',
      esfuerzo: opts.esfuerzo?.trim() || '',
      deadline: opts.deadline?.trim() || '',
      estado: opts.estado || 'Pendiente',
      elementos: [],
    };

    set(state => {
      const proyectos = JSON.parse(JSON.stringify(state.proyectos)) as Proyecto[];
      const parent = findByPath(proyectos, parentPath);
      if (!parent) return state;
      const parentEl = parent as Elemento;
      if (!Array.isArray(parentEl.elementos)) parentEl.elementos = [];
      parentEl.elementos.push(nuevoElemento);
      return { proyectos };
    });
    get()._save();
    return true;
  },

  updateElement: (path, fields) => {
    set(state => {
      const proyectos = JSON.parse(JSON.stringify(state.proyectos)) as Proyecto[];
      const el = findByPath(proyectos, path) as Elemento | null;
      if (!el) return state;
      Object.assign(el, fields);
      // Auto: si completado → 100%
      if (el.estado === 'Completado' && !el.avance) el.avance = '100%';
      return { proyectos };
    });
    get()._save();
  },

  deleteElement: (path) => {
    if (path.length === 0) return;
    if (path.length === 1) {
      get().deleteProject(path[0]);
      return;
    }

    set(state => {
      const proyectos = JSON.parse(JSON.stringify(state.proyectos)) as Proyecto[];
      const parentPath = path.slice(0, -1);
      const parent = findByPath(proyectos, parentPath) as Elemento | null;
      if (!parent || !Array.isArray(parent.elementos)) return state;
      const idx = path[path.length - 1];
      parent.elementos.splice(idx, 1);
      return { proyectos };
    });
    get()._save();
  },

  setElementEstado: (path, estado) => {
    if (path.length === 0) return;

    set(state => {
      const proyectos = JSON.parse(JSON.stringify(state.proyectos)) as Proyecto[];
      const el = findByPath(proyectos, path) as Elemento | null;
      if (!el) return state;

      el.estado = estado;
      if (estado === 'Completado' && !el.avance) el.avance = '100%';
      else if (el.avance === '100%' && estado !== 'Completado') el.avance = '';

      // Reorder siblings (not for project root)
      if (path.length > 1) {
        const parentPath = path.slice(0, -1);
        const parent = findByPath(proyectos, parentPath) as Elemento | null;
        if (parent && Array.isArray(parent.elementos) && parent.elementos.length > 1) {
          parent.elementos = ordenarElementosPorEstado(parent.elementos);
        }
      }

      // Recalculate parent states up the tree
      let currentPath = path.slice(0, -1);
      while (currentPath.length > 0) {
        const parent = findByPath(proyectos, currentPath) as Elemento | null;
        if (parent && Array.isArray(parent.elementos) && parent.elementos.length > 0) {
          const nextEstado = computeEstadoFromChildren(parent.elementos);
          if (nextEstado && parent.estado !== nextEstado) {
            parent.estado = nextEstado;
            if (nextEstado === 'Completado') parent.avance = '100%';
            else if (parent.avance === '100%') parent.avance = '';
          }
          if (currentPath.length > 1) {
            const grandParentPath = currentPath.slice(0, -1);
            const grandParent = findByPath(proyectos, grandParentPath) as Elemento | null;
            if (grandParent && Array.isArray(grandParent.elementos) && grandParent.elementos.length > 1) {
              grandParent.elementos = ordenarElementosPorEstado(grandParent.elementos);
            }
          }
        }
        currentPath = currentPath.slice(0, -1);
      }

      return { proyectos };
    });
    get()._save();
  },

  reorderElements: (parentPath, newOrder) => {
    set(state => {
      const proyectos = JSON.parse(JSON.stringify(state.proyectos)) as Proyecto[];
      const parent = findByPath(proyectos, parentPath) as Elemento | null;
      if (!parent) return state;
      (parent as Elemento).elementos = newOrder;
      return { proyectos };
    });
    get()._save();
  },

  // ─── Export / Import ──────────────────────────────────────────────────────
  exportBoard: () => {
    const { activeBoardId, boards, proyectos } = get();
    const boardMeta = boards[activeBoardId];
    const data = {
      boardName: boardMeta?.name || 'Tablero',
      proyectosData: proyectos,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(boardMeta?.name || 'tablero').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importBoard: (data) => {
    const { boards } = get();
    let boardName = data.boardName || `Tablero_Importado_${new Date().toLocaleString()}`;
    let counter = 1;
    const baseName = boardName;
    while (Object.values(boards).some(b => b.name === boardName)) {
      boardName = `${baseName} (${counter++})`;
    }

    const newBoardId = generateBoardId();
    const updatedBoards: BoardsRegistry = {
      ...boards,
      [newBoardId]: {
        name: boardName,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    };

    const proyectos = cleanupCorruptedData(migrateOldData(data.proyectosData as unknown as Record<string, unknown>[]));
    saveBoardsRegistry(updatedBoards);
    saveBoardData(newBoardId, proyectos);
    localStorage.setItem('lastUsedBoard', newBoardId);

    set({
      boards: updatedBoards,
      activeBoardId: newBoardId,
      proyectos,
      collapsed: {},
    });
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveBoard = (state: AppState) => state.boards[state.activeBoardId];
export const selectProyectos = (state: AppState) => state.proyectos;
export const selectVista = (state: AppState) => state.vista;
export const selectCollapsed = (state: AppState) => state.collapsed;
