// reglasNegocio.js
// Capa de negocio para lógica de proyectos y tareas

/**
 * Calcula el avance general de un proyecto considerando elementos recursivamente.
 * @param {Object} proyecto - Proyecto con elementos recursivos.
 * @returns {number} Porcentaje de avance general (0-100)
 */
function calcularAvanceGeneral(proyecto) {
    return calcularAvanceRecursivo(proyecto);
}

/**
 * Calcula el avance de manera recursiva para cualquier elemento.
 * @param {Object} elemento - Elemento que puede contener hijos (elementos).
 * @returns {number} Porcentaje de avance (0-100)
 */
function calcularAvanceRecursivo(elemento) {
    let totalItems = 0;
    let sumaAvance = 0;
    
    // Si no tiene hijos (elementos), solo calcular su propio avance
    if (!Array.isArray(elemento.elementos) || elemento.elementos.length === 0) {
        // Excluir elementos bloqueados del cálculo
        if (elemento.estado === 'Bloqueado') {
            return 0;
        }
        
        let avance = elemento.avance || '';
        if (elemento.estado === 'Completado' && (!avance || avance.trim() === '')) {
            avance = '100%';
        }
        
        let porcentaje = 0;
        if (typeof avance === 'string' && avance.includes('%')) {
            porcentaje = parseInt(avance.replace('%', '').trim()) || 0;
        } else if (!isNaN(avance)) {
            porcentaje = Number(avance);
        }
        
        return porcentaje;
    }
    
    // Si tiene hijos, calcular recursivamente
    elemento.elementos.forEach(hijo => {
        // Excluir elementos bloqueados del cálculo
        if (hijo.estado === 'Bloqueado') {
            return;
        }
        
        const avanceHijo = calcularAvanceRecursivo(hijo);
        sumaAvance += avanceHijo;
        totalItems++;
    });
    
    return totalItems > 0 ? Math.round(sumaAvance / totalItems) : 0;
}

/**
 * Cuenta el total de elementos recursivamente.
 * @param {Object} elemento - Elemento que puede contener hijos.
 * @returns {number} Número total de elementos
 */
function contarElementosRecursivo(elemento) {
    if (!Array.isArray(elemento.elementos) || elemento.elementos.length === 0) {
        return 1;
    }
    
    let total = 1; // Contar el elemento actual
    elemento.elementos.forEach(hijo => {
        total += contarElementosRecursivo(hijo);
    });
    
    return total;
}

/**
 * Ordena los elementos hijos según su estado de prioridad.
 * Orden: Pendiente -> En progreso -> Bloqueado -> Completado
 * @param {Array} elementos - Array de elementos a ordenar
 * @returns {Array} Array ordenado por prioridad de estado
 */
function ordenarElementosPorEstado(elementos) {
    if (!Array.isArray(elementos) || elementos.length === 0) {
        return elementos;
    }

    // Definir prioridades de estado (menor número = mayor prioridad)
    const prioridadEstado = {
        'Pendiente': 1,
        'En progreso': 2, 
        'Bloqueado': 3,
        'Completado': 4
    };

    return elementos.sort((a, b) => {
        const prioridadA = prioridadEstado[a.estado] || 5;
        const prioridadB = prioridadEstado[b.estado] || 5;
        
        // Si tienen la misma prioridad, mantener orden alfabético por nombre
        if (prioridadA === prioridadB) {
            return a.nombre.localeCompare(b.nombre);
        }
        
        return prioridadA - prioridadB;
    });
}

/**
 * Aplica ordenamiento recursivo a todos los elementos que tengan hijos.
 * @param {Object} elemento - Elemento raíz (proyecto o cualquier elemento con hijos)
 * @returns {Object} Elemento con todos sus hijos ordenados recursivamente
 */
function aplicarOrdenamientoRecursivo(elemento) {
    // Si no tiene hijos, retornar sin modificar
    if (!Array.isArray(elemento.elementos) || elemento.elementos.length === 0) {
        return elemento;
    }

    // Ordenar elementos hijos del nivel actual
    elemento.elementos = ordenarElementosPorEstado(elemento.elementos);

    // Aplicar ordenamiento recursivamente a cada hijo que tenga sus propios hijos
    elemento.elementos.forEach(hijo => {
        if (Array.isArray(hijo.elementos) && hijo.elementos.length > 0) {
            aplicarOrdenamientoRecursivo(hijo);
        }
    });

    return elemento;
}

// Exponer las funciones en window para uso desde otros archivos
window.reglasNegocio = {
    calcularAvanceGeneral,
    calcularAvanceRecursivo,
    contarElementosRecursivo,
    ordenarElementosPorEstado,
    aplicarOrdenamientoRecursivo
};
