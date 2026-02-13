// dragDropController.js
// Controlador para Drag & Drop de proyectos usando SortableJS

const DragDropController = {
    // Instancia activa de SortableJS
    sortableInstance: null,

    /**
     * Inicializa Drag & Drop en la lista de proyectos activos.
     * Ahora opera sobre el contenedor div #projListActivos con .projRow items.
     */
    initialize: function() {
        const container = document.getElementById('projListActivos');
        if (!container) return;
        
        // Destruir instancia anterior si existe
        DragDropController.destroy();
        
        // Crear nueva instancia de Sortable
        DragDropController.sortableInstance = new Sortable(container, {
            animation: 200,
            handle: '.drag-handle',
            draggable: '.projRow',
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            forceFallback: true,
            fallbackTolerance: 3,
            
            onStart: function(evt) {
                DragDropController._onDragStart(evt);
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
     * Guarda contexto.
     */
    _onDragStart: function(evt) {
        window._dragContext = {
            collapsedStates: DragDropController.getCollapsedStatesByName(),
            scrollPosition: window.scrollY,
            draggedProjectName: evt.item.querySelector('.projTitle .name')?.textContent?.trim() || ''
        };
    },

    /**
     * Handler para fin del arrastre.
     * Usa oldDraggableIndex/newDraggableIndex.
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
     * Captura estados colapsados (expandidos) usando NOMBRE del proyecto como clave.
     * En el nuevo layout, un proyecto está "expandido" si su detail div está visible.
     * @returns {Object} { "Nombre Proyecto": true, ... }  (true = expandido)
     */
    getCollapsedStatesByName: function() {
        const states = {};
        document.querySelectorAll('.projRow').forEach(card => {
            const index = parseInt(card.dataset.projectIndex);
            const project = window.proyectosData[index];
            const detail = document.getElementById('detail-' + index);
            if (project && project.nombre && detail && detail.style.display !== 'none') {
                states[project.nombre] = true; // expanded
            }
        });
        return states;
    },

    /**
     * Restaura estados expandidos buscando proyectos por nombre.
     * @param {Object} expandedStates - Objeto con nombres de proyectos expandidos
     */
    restoreCollapsedStatesByName: function(expandedStates) {
        if (!expandedStates) return;
        
        Object.keys(expandedStates).forEach(projectName => {
            const currentIndex = window.proyectosData.findIndex(p => p && p.nombre === projectName);
            
            if (currentIndex !== -1 && expandedStates[projectName]) {
                const detail = document.getElementById('detail-' + currentIndex);
                // Expand if not already expanded
                if (detail && detail.style.display === 'none') {
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
            const movedCard = document.querySelector(
                `.projRow[data-project-index="${projectIndex}"]`
            );
            if (movedCard) {
                movedCard.classList.add('project-moved-highlight');
                setTimeout(() => {
                    movedCard.classList.remove('project-moved-highlight');
                }, 1500);
            }
        }
    }
};

// Exponer globalmente
window.DragDropController = DragDropController;
