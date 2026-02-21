// dragDropController.js
// Controlador para Drag & Drop de proyectos usando SortableJS

const DragDropController = {
    // Instancias activas de SortableJS
    sortableActivos: null,
    sortableBacklog: null,

    /**
     * Inicializa Drag & Drop en las listas de proyectos activos y backlog.
     * Usa grupo compartido para permitir arrastrar entre listas.
     */
    initialize: function() {
        const containerActivos = document.getElementById('projListActivos');
        const containerBacklog = document.getElementById('projListBacklog');
        
        // Destruir instancias anteriores si existen
        DragDropController.destroy();
        
        // Opciones compartidas para ambas listas
        const sharedOptions = {
            group: 'proyectos',     // Grupo compartido para drag entre listas
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
        };
        
        // Crear instancia para Activos
        if (containerActivos) {
            DragDropController.sortableActivos = new Sortable(containerActivos, sharedOptions);
        }
        
        // Crear instancia para Backlog
        if (containerBacklog) {
            DragDropController.sortableBacklog = new Sortable(containerBacklog, sharedOptions);
        }
    },

    /**
     * Destruye las instancias de SortableJS.
     */
    destroy: function() {
        if (DragDropController.sortableActivos) {
            DragDropController.sortableActivos.destroy();
            DragDropController.sortableActivos = null;
        }
        if (DragDropController.sortableBacklog) {
            DragDropController.sortableBacklog.destroy();
            DragDropController.sortableBacklog = null;
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
        const fromListId = evt.from.id;
        window._dragContext = {
            collapsedStates: DragDropController.getCollapsedStatesByName(),
            scrollPosition: window.scrollY,
            draggedProjectName: evt.item.querySelector('.projTitle .name')?.textContent?.trim() || '',
            fromList: fromListId === 'projListActivos' ? 'Activo' : 'Backlog'
        };
    },

    /**
     * Handler para fin del arrastre.
     * Maneja movimiento dentro de la misma lista y entre listas (Activos ↔ Backlog).
     */
    _onDragEnd: function(evt) {
        try {
            const oldIdx = evt.oldDraggableIndex;
            const newIdx = evt.newDraggableIndex;
            const fromListId = evt.from.id;
            const toListId = evt.to.id;
            
            // Determinar estados origen y destino
            const fromEstado = fromListId === 'projListActivos' ? 'Activo' : 'Backlog';
            const toEstado = toListId === 'projListActivos' ? 'Activo' : 'Backlog';
            const crossListMove = fromEstado !== toEstado;
            
            // Si no hay cambio real (misma lista, mismo índice)
            if (!crossListMove && oldIdx === newIdx) {
                RenderController.renderTable();
                DragDropController.restoreCollapsedStatesByName(window._dragContext.collapsedStates);
                return;
            }
            
            // Separar proyectos por estado
            const proyectosActivos = window.proyectosData.filter(p => 
                p && (p.estadoProyecto || 'Activo') === 'Activo'
            );
            const proyectosBacklog = window.proyectosData.filter(p => 
                p && (p.estadoProyecto || 'Activo') === 'Backlog'
            );
            const proyectosArchivados = window.proyectosData.filter(p => 
                p && (p.estadoProyecto || 'Activo') === 'Archivado'
            );
            
            // Obtener lista origen
            const listaOrigen = fromEstado === 'Activo' ? proyectosActivos : proyectosBacklog;
            const listaDestino = toEstado === 'Activo' ? proyectosActivos : proyectosBacklog;
            
            // Validar índice origen
            if (oldIdx < 0 || oldIdx >= listaOrigen.length) {
                console.error('Índice origen fuera de rango:', oldIdx, 'total:', listaOrigen.length);
                RenderController.renderTable();
                DragDropController.restoreCollapsedStatesByName(window._dragContext.collapsedStates);
                return;
            }
            
            // Extraer proyecto de lista origen
            const [movedProject] = listaOrigen.splice(oldIdx, 1);
            
            // Si es movimiento entre listas, cambiar estadoProyecto
            if (crossListMove) {
                movedProject.estadoProyecto = toEstado;
            }
            
            // Insertar en lista destino (puede ser la misma si no es crossListMove)
            const insertIdx = Math.min(newIdx, listaDestino.length);
            if (crossListMove) {
                listaDestino.splice(insertIdx, 0, movedProject);
            } else {
                // Misma lista: ya fue removido, insertar en nueva posición
                listaOrigen.splice(insertIdx, 0, movedProject);
            }
            
            // Reconstruir arrays después de las modificaciones
            const activosFinal = crossListMove 
                ? (toEstado === 'Activo' ? listaDestino : listaOrigen)
                : (fromEstado === 'Activo' ? listaOrigen : proyectosActivos);
            const backlogFinal = crossListMove 
                ? (toEstado === 'Backlog' ? listaDestino : listaOrigen)
                : (fromEstado === 'Backlog' ? listaOrigen : proyectosBacklog);
            
            // Reconstruir array global: Activos + Backlog + Archivados
            window.proyectosData = [...activosFinal, ...backlogFinal, ...proyectosArchivados];
            
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
            let message;
            if (crossListMove) {
                message = `Proyecto "${movedProject.nombre}" movido a ${toEstado}`;
            } else {
                const direction = newIdx < oldIdx ? 'arriba' : 'abajo';
                message = `Proyecto "${movedProject.nombre}" movido hacia ${direction}`;
            }
            StorageController.notify(message, 'success');
            
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
