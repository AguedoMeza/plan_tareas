// src/lib/dataUtils.ts
// Data cleanup and migration utilities migrated from dataController.js

import type { Proyecto, EstadoProyecto } from '@/types';

/**
 * Limpia datos corruptos del array de proyectos.
 * Elimina entradas null, no-objeto o sin nombre.
 */
export function cleanupCorruptedData(proyectos: unknown[]): Proyecto[] {
  if (!Array.isArray(proyectos)) return [];

  return proyectos.filter((proyecto): proyecto is Proyecto => {
    if (!proyecto || typeof proyecto !== 'object') {
      console.warn('Proyecto inválido encontrado:', proyecto);
      return false;
    }
    const p = proyecto as Record<string, unknown>;
    if (!p.nombre || typeof p.nombre !== 'string' || p.nombre.trim() === '') {
      console.warn('Proyecto sin nombre encontrado:', proyecto);
      return false;
    }
    return true;
  });
}

/**
 * Migra datos de la estructura antigua (tareas/subtareas)
 * a la nueva estructura recursiva (elementos).
 * También asegura que todos los proyectos tengan estadoProyecto.
 */
export function migrateOldData(proyectos: Record<string, unknown>[]): Proyecto[] {
  return proyectos.map(proyecto => {
    const migrated = { ...proyecto } as Record<string, unknown>;

    // Migrar estructura tareas → elementos
    if (migrated.tareas && !migrated.elementos) {
      const tareas = migrated.tareas as Record<string, unknown>[];
      migrated.elementos = tareas.map(tarea => {
        const elemento: Record<string, unknown> = {
          nombre: tarea.nombre,
          descripcion: tarea.descripcion || '',
          tipo: 'tarea',
          prioridad: tarea.prioridad || '',
          avance: tarea.avance || '',
          esfuerzo: tarea.esfuerzo || '',
          deadline: tarea.deadline || '',
          estado: tarea.estado || 'Pendiente',
          elementos: [],
        };

        if (Array.isArray(tarea.subtareas)) {
          elemento.elementos = (tarea.subtareas as Record<string, unknown>[]).map(subtarea => ({
            nombre: subtarea.nombre,
            descripcion: subtarea.descripcion || '',
            tipo: 'subtarea',
            prioridad: subtarea.prioridad || '',
            avance: subtarea.avance || '',
            esfuerzo: subtarea.esfuerzo || '',
            deadline: subtarea.deadline || '',
            estado: subtarea.estado || 'Pendiente',
            elementos: [],
          }));
        }

        return elemento;
      });

      delete migrated.tareas;
      delete migrated.recuento;
      if (!migrated.tipo) migrated.tipo = 'proyecto';
      if (!migrated.avance) migrated.avance = '';
      if (!migrated.prioridad) migrated.prioridad = '';
      if (!migrated.esfuerzo) migrated.esfuerzo = '';
      if (!migrated.deadline) migrated.deadline = '';
      if (!migrated.estado) migrated.estado = 'Pendiente';
    }

    // Asegurar estadoProyecto
    if (!migrated.estadoProyecto) {
      migrated.estadoProyecto = 'Activo' as EstadoProyecto;
    }

    return migrated as unknown as Proyecto;
  });
}

/**
 * Genera un ID único para tableros (compatible con el formato existente).
 */
export function generateBoardId(): string {
  return 'board_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Navega por el array de proyectos usando un path numérico.
 * Retorna null si el path no es válido.
 */
export function findByPath(proyectos: Proyecto[], path: number[]): Proyecto | import('../types').Elemento | null {
  if (!Array.isArray(path) || path.length === 0) return null;

  const root = proyectos[path[0]];
  if (!root) return null;
  if (path.length === 1) return root;

  let current: import('../types').Elemento | Proyecto = root;
  for (let i = 1; i < path.length; i++) {
    const hijos: import('../types').Elemento[] | undefined = (current as import('../types').Elemento).elementos;
    if (!Array.isArray(hijos) || !hijos[path[i]]) return null;
    current = hijos[path[i]];
  }

  return current;
}

/**
 * Aplanar el árbol de proyectos a una lista plana con paths.
 */
export interface FlatElement {
  element: Proyecto | import('../types').Elemento;
  path: number[];
  level: number;
  displayName: string;
}

export function flattenTree(proyectos: Proyecto[], includeProjects = true): FlatElement[] {
  const result: FlatElement[] = [];

  function walkChildren(
    elementos: import('../types').Elemento[],
    basePath: number[],
    level: number
  ) {
    elementos.forEach((el, idx) => {
      const currentPath = [...basePath, idx];
      result.push({
        element: el,
        path: currentPath,
        level,
        displayName: '  '.repeat(level) + el.nombre,
      });
      if (Array.isArray(el.elementos) && el.elementos.length > 0) {
        walkChildren(el.elementos, currentPath, level + 1);
      }
    });
  }

  proyectos.forEach((proyecto, pIdx) => {
    if (includeProjects) {
      result.push({
        element: proyecto,
        path: [pIdx],
        level: 0,
        displayName: proyecto.nombre,
      });
    }
    if (Array.isArray(proyecto.elementos)) {
      walkChildren(proyecto.elementos, [pIdx], 1);
    }
  });

  return result;
}
