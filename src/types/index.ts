// src/types/index.ts
// TypeScript types for the project management app

export type EstadoProyecto = 'Activo' | 'Backlog' | 'Archivado';
export type EstadoElemento = 'Pendiente' | 'En progreso' | 'Completado' | 'Bloqueado' | 'Backlog';
export type Prioridad = '' | '1' | '2' | '3';

export interface Elemento {
  nombre: string;
  descripcion?: string;
  tipo?: string; // 'tarea' | 'subtarea' | 'elemento' | 'agrupador'
  prioridad?: Prioridad;
  avance?: string;
  esfuerzo?: string;
  deadline?: string;
  estado: EstadoElemento;
  elementos?: Elemento[]; // hijos recursivos
  expanded?: boolean;
}

export interface Proyecto {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  estadoProyecto: EstadoProyecto;
  avance?: string;
  prioridad?: Prioridad;
  esfuerzo?: string;
  deadline?: string;
  estado?: EstadoElemento;
  elementos?: Elemento[];
  expanded?: boolean;
}

export interface BoardMeta {
  name: string;
  createdAt: string;
  lastModified: string;
  color?: string;
}

export interface BoardsRegistry {
  [boardId: string]: BoardMeta;
}

export type Vista = 'completa' | 'viva';

// Path to an element: [projectIndex, childIndex?, grandChildIndex?, ...]
export type ElementPath = number[];

// For AI context snapshots
export interface ContextElement {
  path: string[];
  tipo: string;
  estado: string;
  descripcion: string;
}

// AI Action types
export type AIActionType =
  | 'create_project'
  | 'create_element'
  | 'edit_element'
  | 'delete_element'
  | 'change_estado';

export interface AIAction {
  type: AIActionType;
  name?: string;
  description?: string;
  parent?: { path: string[] } | { project: string } | string;
  target?: { path: string[] } | { project: string } | { name: string } | string;
  fields?: Partial<Elemento & { nombre: string }>;
  estado?: EstadoElemento;
  prioridad?: string;
  esfuerzo?: string;
  deadline?: string;
  tipo?: string;
}

export interface AIResponse {
  reply: string;
  actions?: AIAction[];
}
