// projectController.js
// Controlador para acciones sobre proyectos (colapsar, cambiar estado)

const ProjectController = {
    
    /**
     * Colapsa o expande un proyecto mostrando/ocultando sus elementos hijos.
     * @param {number} index - Índice del proyecto en proyectosData
     */
    toggle: function(index) {
        const projectRow = document.querySelector(`tr.proyecto-row[data-project-index="${index}"]`);
        if (!projectRow) return;
        
        const button = document.getElementById(`btn-${index}`);
        if (!button) return;
        
        const icon = button.querySelector('.collapse-icon');
        const allRelatedRows = document.querySelectorAll(`tr[data-project-index="${index}"]:not(.proyecto-row)`);
        
        if (projectRow.classList.contains('proyecto-collapsed')) {
            // Expandir
            projectRow.classList.remove('proyecto-collapsed');
            icon.innerHTML = '<i class="bi bi-chevron-down"></i>';
            button.title = 'Contraer proyecto';
            
            allRelatedRows.forEach(row => {
                row.style.display = '';
            });
            
            const summaryRow = document.querySelector(`tr.recuento-row[data-project-index="${index}"]`);
            if (summaryRow) {
                summaryRow.style.display = '';
            }
        } else {
            // Colapsar
            projectRow.classList.add('proyecto-collapsed');
            icon.innerHTML = '<i class="bi bi-chevron-right"></i>';
            button.title = 'Expandir proyecto';
            
            allRelatedRows.forEach(row => {
                row.style.display = 'none';
            });
            
            const summaryRow = document.querySelector(`tr.recuento-row[data-project-index="${index}"]`);
            if (summaryRow) {
                summaryRow.style.display = 'none';
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
                `tr[data-project-index="${newIndex}"] .proyecto-estado-select`
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
