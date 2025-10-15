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

// Exponer las funciones en window para uso desde otros archivos
window.reglasNegocio = {
    calcularAvanceGeneral,
    calcularAvanceRecursivo,
    contarElementosRecursivo
};
