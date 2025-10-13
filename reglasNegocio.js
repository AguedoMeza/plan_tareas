// reglasNegocio.js
// Capa de negocio para lógica de proyectos y tareas

/**
 * Calcula el avance general de un proyecto considerando tareas y subtareas.
 * @param {Object} proyecto - Proyecto con tareas y posibles subtareas.
 * @returns {number} Porcentaje de avance general (0-100)
 */
function calcularAvanceGeneral(proyecto) {
    let totalItems = 0;
    let sumaAvance = 0;
    if (!proyecto.tareas) return 0;
    proyecto.tareas.forEach(tarea => {
        if (Array.isArray(tarea.subtareas) && tarea.subtareas.length > 0) {
            tarea.subtareas.forEach(subtarea => {
                let avance = subtarea.avance;
                if (subtarea.estado === 'Completado' && (!avance || avance.trim() === '')) {
                    avance = '100%';
                }
                let porcentaje = 0;
                if (typeof avance === 'string' && avance.includes('%')) {
                    porcentaje = parseInt(avance.replace('%', '').trim()) || 0;
                } else if (!isNaN(avance)) {
                    porcentaje = Number(avance);
                }
                sumaAvance += porcentaje;
                totalItems++;
            });
        } else {
            let avance = tarea.avance;
            if (tarea.estado === 'Completado' && (!avance || avance.trim() === '')) {
                avance = '100%';
            }
            let porcentaje = 0;
            if (typeof avance === 'string' && avance.includes('%')) {
                porcentaje = parseInt(avance.replace('%', '').trim()) || 0;
            } else if (!isNaN(avance)) {
                porcentaje = Number(avance);
            }
            sumaAvance += porcentaje;
            totalItems++;
        }
    });
    return totalItems > 0 ? Math.round(sumaAvance / totalItems) : 0;
}

// Puedes agregar más funciones de negocio aquí

// Exponer la función en window para uso desde index.html
window.reglasNegocio = {
    calcularAvanceGeneral
};
