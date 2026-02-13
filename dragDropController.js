// dragDropController.js
// Controlador para Drag & Drop de proyectos usando SortableJS

const DragDropController = {
    // Instancia activa de SortableJS
    sortableInstance: null,

    /**
     * Inicializa Drag & Drop en la tabla de proyectos activos.
     * Usa forceFallback para evitar bugs del HTML5 DnD nativo en tablas.
     */
    initialize: function() {
        const tbody = document.getElementById('boardTableBody');
        if (!tbody) return;
        
        // Destruir instancia anterior si existe
        DragDropController.destroy();
        
        // Crear nueva instancia de Sortable
        DragDropController.sortableInstance = new Sortable(tbody, {
            animation: 200,
            handle: '.drag-handle',
            draggable: '.proyecto-row',
            filter: '.section-row, .tarea-row, .subtarea-row',
            preventOnFilter: true,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            forceFallback: true,
            fallbackTolerance: 3,
            
            onStart: function(evt) {
                DragDropController._onDragStart(evt, tbody);
            },
            
            onEnd: function(evt) {
                DragDropController._onDragEnd(evt);
            }
        });
    },

    /**
     * Destruye la instancia de SortableJS.
     */
    destroy: function() {
        if (DragDropController.sortableInstance) {
            DragDropController.sortableInstance.destroy();
            DragDropController.sortableInstance = null;
        }
    },

    // =============================================
    // HANDLERS DE EVENTOS
    // =============================================

    /**
     * Handler para inicio del arrastre.
     * Guarda contexto y oculta filas no-proyecto para cálculo correcto de posiciones.
     */
    _onDragStart: function(evt, tbody) {
        // Guardar contexto ANTES de ocultar filas
        window._dragContext = {
            collapsedStates: DragDropController.getCollapsedStatesByName(),
            scrollPosition: window.scrollY,
            draggedProjectName: evt.item.querySelector('.proyecto-nombre')?.textContent?.trim() || ''
        };
        
        // CLAVE: Ocultar TODAS las filas no-proyecto del tbody
        // Permite que SortableJS calcule posiciones correctamente
        const nonProjectRows = tbody.querySelectorAll('tr:not(.proyecto-row)');
        nonProjectRows.forEach(row => {
            row.style.display = 'none';
        });

        // También ocultar proyecto-rows que NO son activos (backlog/archivados)
        tbody.querySelectorAll('tr.proyecto-row').forEach(row => {
            const idx = parseInt(row.dataset.projectIndex);
            const p = window.proyectosData[idx];
            if (p && (p.estadoProyecto || 'Activo') !== 'Activo') {
                row.style.display = 'none';
            }
        });
    },

    /**
     * Handler para fin del arrastre.
     * Usa oldDraggableIndex/newDraggableIndex que cuentan solo filas .proyecto-row.
     */
    _onDragEnd: function(evt) {
        try {
            const oldIdx = evt.oldDraggableIndex;
            const newIdx = evt.newDraggableIndex;
            
            // Si no hay cambio real o índices inválidos, restaurar
            if (oldIdx === newIdx || oldIdx == null || newIdx == null) {
                RenderController.renderTable();
                DragDropController.restoreCollapsedStatesByName(window._dragContext.collapsedStates);
                return;
            }
            
            // Separar proyectos
            const proyectosActivos = window.proyectosData.filter(p => 
                p && (p.estadoProyecto || 'Activo') === 'Activo'
            );
            const otrosProyectos = window.proyectosData.filter(p => 
                p && (p.estadoProyecto || 'Activo') !== 'Activo'
            );
            
            // Validar rango
            if (oldIdx < 0 || oldIdx >= proyectosActivos.length ||
                newIdx < 0 || newIdx >= proyectosActivos.length) {
                console.error('Índices D&D fuera de rango:', oldIdx, newIdx, 'total:', proyectosActivos.length);
                RenderController.renderTable();
                DragDropController.restoreCollapsedStatesByName(window._dragContext.collapsedStates);
                return;
            }
            
            // Reordenar dentro de activos
            const [movedProject] = proyectosActivos.splice(oldIdx, 1);
            proyectosActivos.splice(newIdx, 0, movedProject);
            
            // Reconstruir array global
            window.proyectosData = [...proyectosActivos, ...otrosProyectos];
            
            // Guardar y re-renderizar
            StorageController.save();
            RenderController.renderTable();
            
            // Restaurar colapsos por nombre
            setTimeout(() => {
                DragDropController.restoreCollapsedStatesByName(window._dragContext.collapsedStates);
                window.scrollTo(0, window._dragContext.scrollPosition);
                StorageController.saveCollapsedStates();
            }, 50);
            
            // Notificación
            const direction = newIdx < oldIdx ? 'arriba' : 'abajo';
            StorageController.notify(
                `Proyecto "${movedProject.nombre}" movido hacia ${direction}`, 
                'success'
            );
            
            setTimeout(() => DragDropController.highlightMovedProject(movedProject.nombre), 100);
            
        } catch (error) {
            console.error('Error en drag & drop:', error);
            StorageController.notify('Error al reordenar proyecto', 'error');
            RenderController.renderTable();
        }
    },

    // =============================================
    // GESTIÓN DE ESTADOS COLAPSADOS POR NOMBRE
    // =============================================

    /**
     * Captura estados colapsados usando NOMBRE del proyecto como clave.
     * Esto es resistente a cambios de índice al reordenar.
     * @returns {Object} { "Nombre Proyecto": true, ... }
     */
    getCollapsedStatesByName: function() {
        const states = {};
        document.querySelectorAll('tr.proyecto-row.proyecto-collapsed').forEach(row => {
            const index = parseInt(row.dataset.projectIndex);
            const project = window.proyectosData[index];
            if (project && project.nombre) {
                states[project.nombre] = true;
            }
        });
        return states;
    },

    /**
     * Restaura estados colapsados buscando proyectos por nombre.
     * @param {Object} collapsedStates - Objeto con nombres de proyectos colapsados
     */
    restoreCollapsedStatesByName: function(collapsedStates) {
        if (!collapsedStates) return;
        
        Object.keys(collapsedStates).forEach(projectName => {
            const currentIndex = window.proyectosData.findIndex(p => p && p.nombre === projectName);
            
            if (currentIndex !== -1 && collapsedStates[projectName]) {
                const projectRow = document.querySelector(
                    `tr.proyecto-row[data-project-index="${currentIndex}"]`
                );
                
                // Solo toggle si NO está ya colapsado
                if (projectRow && !projectRow.classList.contains('proyecto-collapsed')) {
                    ProjectController.toggle(currentIndex);
                }
            }
        });
    },

    // =============================================
    // EFECTOS VISUALES
    // =============================================

    /**
     * Aplica highlight temporal al proyecto recién movido.
     * @param {string} projectName - Nombre del proyecto a resaltar
     */
    highlightMovedProject: function(projectName) {
        const projectIndex = window.proyectosData.findIndex(p => p && p.nombre === projectName);
        if (projectIndex !== -1) {
            const movedRow = document.querySelector(
                `tr.proyecto-row[data-project-index="${projectIndex}"]`
            );
            if (movedRow) {
                movedRow.classList.add('project-moved-highlight');
                setTimeout(() => {
                    movedRow.classList.remove('project-moved-highlight');
                }, 1500);
            }
        }
    }
};

// Exponer globalmente
window.DragDropController = DragDropController;
