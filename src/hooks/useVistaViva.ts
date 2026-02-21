// src/hooks/useVistaViva.ts
// Filter and flatten tree to show only "vivos" elements (Pendiente or En progreso)

import { useMemo } from 'react';
import type { Proyecto, Elemento } from '@/types';

export interface VivaRow {
  elemento: Elemento;
  path: number[];
  projectNombre: string;
  ancestorNames: string[];
}

export function useVistaViva(proyectos: Proyecto[]): VivaRow[] {
  return useMemo(() => {
    const rows: VivaRow[] = [];

    function walk(el: Elemento, path: number[], projectNombre: string, ancestors: string[]) {
      const hasChildren = Array.isArray(el.elementos) && el.elementos.length > 0;

      if (!hasChildren) {
        // Leaf node: include if "vivo"
        if (el.estado === 'Pendiente' || el.estado === 'En progreso') {
          rows.push({
            elemento: el,
            path,
            projectNombre,
            ancestorNames: ancestors,
          });
        }
      } else {
        // Grouper: recurse into children
        el.elementos!.forEach((hijo, idx) => {
          walk(hijo, [...path, idx], projectNombre, [...ancestors, el.nombre]);
        });
      }
    }

    proyectos.forEach((proyecto, pIdx) => {
      // Skip archived projects
      if (proyecto.estadoProyecto === 'Archivado') return;
      if (!Array.isArray(proyecto.elementos)) return;

      proyecto.elementos.forEach((el, idx) => {
        walk(el, [pIdx, idx], proyecto.nombre, []);
      });
    });

    return rows;
  }, [proyectos]);
}
