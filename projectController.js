// projectController.js
// Controlador para acciones sobre proyectos (colapsar, cambiar estado)

const ProjectController = {
    
    /**
     * Colapsa o expande un proyecto mostrando/ocultando su detalle.
     * @param {number} index - Índice del proyecto en proyectosData
     */
    toggle: function(index) {
        const card = document.querySelector(`.projRow[data-project-index="${index}"]`);
        if (!card) return;
        
        const button = document.getElementById(`btn-${index}`);
        if (!button) return;
        
        const detail = document.getElementById(`detail-${index}`);
        
        if (detail && detail.style.display !== 'none') {
            // Colapsar
            detail.style.display = 'none';
            button.innerHTML = '<i class="bi bi-chevron-right"></i>';
            if (window.App && typeof App.updateTooltipText === 'function') {
                App.updateTooltipText(button, 'Expandir');
            } else {
                button.title = 'Expandir';
            }
        } else if (detail) {
            // Expandir
            detail.style.display = '';
            button.innerHTML = '<i class="bi bi-chevron-down"></i>';
            if (window.App && typeof App.updateTooltipText === 'function') {
                App.updateTooltipText(button, 'Contraer');
            } else {
                button.title = 'Contraer';
            }
        }
        
        StorageController.toggleProjectPersistent(index);
    },

    /**
     * Cambia el estado de un proyecto (Activo, Backlog, Archivado).
     * Reorganiza el array para mantener activos primero.
     * @param {number} projectIndex - Índice del proyecto en proyectosData
     * @param {string} nuevoEstado - 'Activo', 'Backlog' o 'Archivado'
     */
    cambiarEstado: function(projectIndex, nuevoEstado) {
        if (!window.proyectosData[projectIndex]) {
            StorageController.notify('Proyecto no encontrado', 'error');
            return;
        }
        
        const proyecto = window.proyectosData[projectIndex];
        const estadoAnterior = proyecto.estadoProyecto || 'Activo';
        
        // Si no hay cambio real, no hacer nada
        if (estadoAnterior === nuevoEstado) return;
        
        proyecto.estadoProyecto = nuevoEstado;
        
        // Reorganizar: Activos primero, luego otros
        const proyectosActivos = window.proyectosData.filter(p => 
            (p.estadoProyecto || 'Activo') === 'Activo'
        );
        const otrosProyectos = window.proyectosData.filter(p => 
            (p.estadoProyecto || 'Activo') !== 'Activo'
        );
        
        window.proyectosData = [...proyectosActivos, ...otrosProyectos];
        
        StorageController.save();
        
        const mensajes = {
            'Activo': 'activado',
            'Backlog': 'movido a backlog',
            'Archivado': 'archivado'
        };
        
        StorageController.notify(
            `Proyecto "${proyecto.nombre}" ${mensajes[nuevoEstado]}`, 
            'success'
        );
        
        if (VistaVivaController.vistaActual === 'viva') {
            VistaVivaController.renderVistaViva();
        } else {
            RenderController.renderTable();
            StorageController.loadCollapsedStates();
        }
        
        // Actualizar el data-current del select tras re-render
        setTimeout(() => {
            const newIndex = window.proyectosData.findIndex(p => p.nombre === proyecto.nombre);
            const selectElement = document.querySelector(
                `.projRow[data-project-index="${newIndex}"] .proyecto-estado-select`
            );
            if (selectElement) {
                selectElement.setAttribute('data-current', nuevoEstado);
            }
        }, 100);
    }
};

// Exponer globalmente
window.ProjectController = ProjectController;

// Compatibilidad con funciones globales usadas en onclick del HTML
window.toggleProject = ProjectController.toggle;
window.cambiarEstadoProyecto = ProjectController.cambiarEstado;
