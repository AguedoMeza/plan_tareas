// dataController.js
// Controlador para limpieza y migración de datos

const DataController = {
    
    /**
     * Limpia datos corruptos del array de proyectos.
     * Elimina entradas null, no-objeto o sin nombre.
     * @returns {boolean} true si se limpiaron datos corruptos
     */
    cleanupCorruptedData: function() {
        if (!Array.isArray(window.proyectosData)) {
            console.error('proyectosData no es un array válido');
            window.proyectosData = [];
            return false;
        }
        
        const originalLength = window.proyectosData.length;
        window.proyectosData = window.proyectosData.filter(proyecto => {
            if (!proyecto || typeof proyecto !== 'object') {
                console.warn('Proyecto inválido encontrado (null o no es objeto):', proyecto);
                return false;
            }
            
            if (!proyecto.nombre || proyecto.nombre.trim() === '') {
                console.warn('Proyecto sin nombre encontrado:', proyecto);
                return false;
            }
            
            return true;
        });
        
        const removedCount = originalLength - window.proyectosData.length;
        if (removedCount > 0) {
            console.log(`Se eliminaron ${removedCount} proyecto(s) corrupto(s)`);
            StorageController.save();
            StorageController.notify(
                `Se limpiaron ${removedCount} proyecto(s) con datos corruptos`, 
                'warning'
            );
            return true;
        }
        
        return false;
    },

    /**
     * Migra datos de la estructura antigua (tareas/subtareas) 
     * a la nueva estructura recursiva (elementos).
     * También asegura que todos los proyectos tengan estadoProyecto.
     */
    migrateOldData: function() {
        let needsMigration = false;
        
        window.proyectosData.forEach((proyecto) => {
            // Migrar estructura tareas → elementos
            if (proyecto.tareas && !proyecto.elementos) {
                proyecto.elementos = proyecto.tareas.map(tarea => {
                    const elemento = {
                        nombre: tarea.nombre,
                        descripcion: tarea.descripcion || '',
                        tipo: 'tarea',
                        prioridad: tarea.prioridad || '',
                        avance: tarea.avance || '',
                        esfuerzo: tarea.esfuerzo || '',
                        deadline: tarea.deadline || '',
                        estado: tarea.estado || 'Pendiente',
                        elementos: []
                    };
                    
                    if (Array.isArray(tarea.subtareas)) {
                        elemento.elementos = tarea.subtareas.map(subtarea => ({
                            nombre: subtarea.nombre,
                            descripcion: subtarea.descripcion || '',
                            tipo: 'subtarea',
                            prioridad: subtarea.prioridad || '',
                            avance: subtarea.avance || '',
                            esfuerzo: subtarea.esfuerzo || '',
                            deadline: subtarea.deadline || '',
                            estado: subtarea.estado || 'Pendiente',
                            elementos: []
                        }));
                    }
                    
                    return elemento;
                });
                
                delete proyecto.tareas;
                delete proyecto.recuento;
                
                if (!proyecto.tipo) proyecto.tipo = 'proyecto';
                if (!proyecto.avance) proyecto.avance = '';
                if (!proyecto.prioridad) proyecto.prioridad = '';
                if (!proyecto.esfuerzo) proyecto.esfuerzo = '';
                if (!proyecto.deadline) proyecto.deadline = '';
                if (!proyecto.estado) proyecto.estado = 'Pendiente';
                
                needsMigration = true;
            }
            
            // Asegurar que todos tengan estadoProyecto
            if (!proyecto.estadoProyecto) {
                proyecto.estadoProyecto = 'Activo';
                needsMigration = true;
            }
        });
        
        if (needsMigration) {
            StorageController.save();
            StorageController.notify('Datos migrados a nueva estructura recursiva', 'success');
        }
    }
};

// Exponer globalmente
window.DataController = DataController;
