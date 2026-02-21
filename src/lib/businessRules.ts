// src/lib/businessRules.ts
// Pure business logic functions migrated from reglasNegocio.js

import type { Elemento, Proyecto, EstadoElemento } from '@/types';

type ElementoOrProyecto = Elemento | Proyecto;

/**
 * Calcula el avance general de un proyecto considerando elementos recursivamente.
 */
export function calcularAvanceGeneral(proyecto: Proyecto): number {
  return calcularAvanceRecursivo(proyecto as unknown as Elemento);
}

/**
 * Calcula el avance de manera recursiva para cualquier elemento.
 */
export function calcularAvanceRecursivo(elemento: ElementoOrProyecto): number {
  const hijos = (elemento as Elemento).elementos;

  // Sin hijos: calcular avance propio
  if (!Array.isArray(hijos) || hijos.length === 0) {
    if ((elemento as Elemento).estado === 'Bloqueado') return 0;

    let avance = (elemento as Elemento).avance || '';
    if ((elemento as Elemento).estado === 'Completado' && (!avance || avance.trim() === '')) {
      avance = '100%';
    }

    if (typeof avance === 'string' && avance.includes('%')) {
      return parseInt(avance.replace('%', '').trim()) || 0;
    }
    if (!isNaN(Number(avance))) return Number(avance);
    return 0;
  }

  // Con hijos: promedio recursivo
  let sumaAvance = 0;
  let totalItems = 0;

  hijos.forEach(hijo => {
    if (hijo.estado === 'Bloqueado') return;
    sumaAvance += calcularAvanceRecursivo(hijo);
    totalItems++;
  });

  return totalItems > 0 ? Math.round(sumaAvance / totalItems) : 0;
}

/**
 * Cuenta el total de elementos recursivamente.
 */
export function contarElementosRecursivo(elemento: ElementoOrProyecto): number {
  const hijos = (elemento as Elemento).elementos;
  if (!Array.isArray(hijos) || hijos.length === 0) return 1;

  let total = 1;
  hijos.forEach(hijo => {
    total += contarElementosRecursivo(hijo);
  });
  return total;
}

const PRIORIDAD_ESTADO: Record<EstadoElemento, number> = {
  'Pendiente': 1,
  'En progreso': 2,
  'Bloqueado': 3,
  'Backlog': 4,
  'Completado': 5,
};

/**
 * Ordena los elementos hijos según su estado de prioridad.
 */
export function ordenarElementosPorEstado(elementos: Elemento[]): Elemento[] {
  if (!Array.isArray(elementos) || elementos.length === 0) return elementos;

  return [...elementos].sort((a, b) => {
    const prioA = PRIORIDAD_ESTADO[a.estado] ?? 6;
    const prioB = PRIORIDAD_ESTADO[b.estado] ?? 6;
    if (prioA === prioB) return a.nombre.localeCompare(b.nombre);
    return prioA - prioB;
  });
}

/**
 * Aplica ordenamiento recursivo a todos los elementos hijo.
 * NOTA: Solo ordena elementos hijo, NO ordena proyectos.
 */
export function aplicarOrdenamientoRecursivo<T extends ElementoOrProyecto>(elemento: T): T {
  const hijos = (elemento as Elemento).elementos;
  if (!Array.isArray(hijos) || hijos.length === 0) return elemento;

  const hijosordenados = ordenarElementosPorEstado(hijos).map(hijo =>
    aplicarOrdenamientoRecursivo(hijo)
  );

  return { ...elemento, elementos: hijosordenados };
}

/**
 * Determina el estado agregado de un conjunto de hijos (el "mejor" estado).
 */
export function computeEstadoFromChildren(children: Elemento[]): EstadoElemento | null {
  if (!Array.isArray(children) || children.length === 0) return null;

  let best: EstadoElemento | null = null;
  let bestPriority = Infinity;

  children.forEach(child => {
    const estado = (child.estado || 'Pendiente') as EstadoElemento;
    const priority = PRIORIDAD_ESTADO[estado] ?? 6;
    if (priority < bestPriority) {
      bestPriority = priority;
      best = estado;
    }
  });

  return best ?? 'Pendiente';
}

/**
 * Calcula la suma heurística de esfuerzo de hijos (solo valores numéricos).
 */
export function calcTotalEsfuerzo(proyecto: Proyecto): string {
  let totalDias = 0;
  let totalSemanas = 0;
  let hasData = false;

  function walk(el: ElementoOrProyecto) {
    const esfuerzo = (el as Elemento).esfuerzo;
    if (esfuerzo) {
      const val = esfuerzo.toString().toLowerCase().trim();
      const num = parseFloat(val);
      if (!isNaN(num)) {
        hasData = true;
        if (val.includes('sem') || val.includes('w')) totalSemanas += num;
        else totalDias += num;
      }
    }
    const hijos = (el as Elemento).elementos;
    if (Array.isArray(hijos)) hijos.forEach(walk);
  }

  if (Array.isArray(proyecto.elementos)) proyecto.elementos.forEach(walk);
  if (!hasData) return '';

  const parts: string[] = [];
  if (totalSemanas) parts.push(`${totalSemanas}s`);
  if (totalDias) parts.push(`${totalDias}d`);
  return parts.join(' ') || '';
}

/**
 * Encuentra el deadline más próximo entre todos los hijos.
 */
export function getNextDeadline(proyecto: Proyecto): string | null {
  let nearest: string | null = null;
  const today = new Date().toISOString().slice(0, 10);

  function walk(el: ElementoOrProyecto) {
    const deadline = (el as Elemento).deadline;
    if (deadline && deadline >= today) {
      if (!nearest || deadline < nearest) nearest = deadline;
    }
    const hijos = (el as Elemento).elementos;
    if (Array.isArray(hijos)) hijos.forEach(walk);
  }

  if (Array.isArray(proyecto.elementos)) proyecto.elementos.forEach(walk);
  return nearest;
}
