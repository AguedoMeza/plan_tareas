// renderController.js
// Controlador para renderizado de tablas y elementos del DOM

const RenderController = {
    
    /**
     * Renderiza la tabla principal separando proyectos por estado.
     * Orquesta el renderizado de las 3 secciones: Activos, Backlog, Archivados.
     */
    renderTable: function() {
        // Limpiar datos corruptos ANTES de cualquier operación
        DataController.cleanupCorruptedData();
        
        // Separar proyectos por estado
        const proyectosActivos = [];
        const proyectosBacklog = [];
        const proyectosArchivados = [];
        
        window.proyectosData.forEach((proyecto, index) => {
            const estado = proyecto.estadoProyecto || 'Activo';
            const proyectoOrdenado = window.reglasNegocio.aplicarOrdenamientoRecursivo({...proyecto});
            
            if (estado === 'Activo') {
                proyectosActivos.push({ proyecto: proyectoOrdenado, originalIndex: index });
            } else if (estado === 'Backlog') {
                proyectosBacklog.push({ proyecto: proyectoOrdenado, originalIndex: index });
            } else if (estado === 'Archivado') {
                proyectosArchivados.push({ proyecto: proyectoOrdenado, originalIndex: index });
            }
        });

        // Renderizar cada sección
        RenderController.renderSection('tableBodyActive', proyectosActivos, 'emptyStateActive');
        RenderController.renderSection('tableBodyBacklog', proyectosBacklog);
        RenderController.renderSection('tableBodyArchived', proyectosArchivados);
        
        // Mostrar/ocultar secciones según contenido
        document.getElementById('backlogSection').style.display = proyectosBacklog.length > 0 ? 'block' : 'none';
        document.getElementById('archivedSection').style.display = proyectosArchivados.length > 0 ? 'block' : 'none';
        
        // Actualizar contadores
        document.getElementById('contadorActivos').textContent = proyectosActivos.length;
        document.getElementById('contadorBacklog').textContent = proyectosBacklog.length;
        document.getElementById('contadorArchivado').textContent = proyectosArchivados.length;

        // Inicializar drag & drop solo para proyectos activos
        DragDropController.initialize();
    },

    /**
     * Renderiza una sección específica (Activos, Backlog o Archivados).
     * @param {string} tbodyId - ID del tbody donde renderizar
     * @param {Array} proyectos - Array de {proyecto, originalIndex}
     * @param {string|null} emptyStateId - ID del elemento de estado vacío (opcional)
     */
    renderSection: function(tbodyId, proyectos, emptyStateId = null) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        
        if (proyectos.length === 0 && emptyStateId) {
            document.getElementById(emptyStateId).style.display = 'block';
            document.getElementById(tbodyId).parentElement.style.display = 'none';
            return;
        }
        
        if (emptyStateId) {
            document.getElementById(emptyStateId).style.display = 'none';
            document.getElementById(tbodyId).parentElement.style.display = 'table';
        }
        
        proyectos.forEach(({ proyecto, originalIndex }) => {
            RenderController.renderElement(proyecto, [originalIndex], 0, tbody);
        });
    },

    /**
     * Renderiza un elemento de manera recursiva (proyecto, tarea, subtarea, etc.).
     * @param {Object} elemento - Datos del elemento
     * @param {Array} elementPath - Ruta de índices [projectIdx, taskIdx, ...]
     * @param {number} level - Nivel de profundidad (0 = proyecto)
     * @param {HTMLElement} container - Contenedor tbody donde insertar
     */
    renderElement: function(elemento, elementPath, level, container) {
        const isProject = level === 0;
        const pathString = elementPath.join('-');
        
        // Crear fila del elemento
        const elementRow = document.createElement('tr');
        elementRow.className = isProject ? 'proyecto-row' : (level === 1 ? 'tarea-row' : 'subtarea-row');
        if (!isProject && Array.isArray(elemento.elementos) && elemento.elementos.length > 0) {
            elementRow.className += ' tarea-con-subtareas';
        }
        
        elementRow.dataset.elementPath = pathString;
        elementRow.dataset.projectIndex = elementPath[0];
        elementRow.dataset.level = level;
        if (!isProject) {
            elementRow.dataset.parentPath = elementPath.slice(0, -1).join('-');
        }

        // Generar HTML según el tipo
        const rowContent = isProject
            ? RenderController._buildProjectRow(elemento, elementPath)
            : RenderController._buildElementRow(elemento, elementPath, level);

        elementRow.innerHTML = rowContent;
        container.appendChild(elementRow);

        // Fila de resumen para proyectos
        if (isProject) {
            RenderController._appendSummaryRow(elemento, elementPath, container);
        }

        // Renderizar hijos recursivamente
        if (Array.isArray(elemento.elementos)) {
            elemento.elementos.forEach((hijo, hijoIndex) => {
                const childPath = [...elementPath, hijoIndex];
                RenderController.renderElement(hijo, childPath, level + 1, container);
            });
        }
    },

    // =============================================
    // MÉTODOS PRIVADOS DE CONSTRUCCIÓN DE HTML
    // =============================================

    /**
     * Construye el HTML de una fila de proyecto.
     */
    _buildProjectRow: function(elemento, elementPath) {
        const estadoProyecto = elemento.estadoProyecto || 'Activo';
        const dragHandle = estadoProyecto === 'Activo' 
            ? '<span class="drag-handle" title="Arrastra para reordenar"><i class="bi bi-grip-vertical"></i></span>'
            : '';
        
        return `
            <td class="proyecto-nombre" data-field="nombre">
                <div class="project-controls">
                    ${dragHandle}
                    <button class="collapse-btn" onclick="ProjectController.toggle(${elementPath[0]})" id="btn-${elementPath[0]}" title="Contraer/Expandir proyecto">
                        <span class="collapse-icon"><i class="bi bi-chevron-down"></i></span>
                    </button>
                </div>
                <select class="proyecto-estado-select" 
                        data-current="${elemento.estadoProyecto || 'Activo'}"
                        onchange="ProjectController.cambiarEstado(${elementPath[0]}, this.value)">
                    <option value="Activo" ${(!elemento.estadoProyecto || elemento.estadoProyecto === 'Activo') ? 'selected' : ''}>Activo</option>
                    <option value="Backlog" ${elemento.estadoProyecto === 'Backlog' ? 'selected' : ''}>Backlog</option>
                    <option value="Archivado" ${elemento.estadoProyecto === 'Archivado' ? 'selected' : ''}>Archivado</option>
                </select>
                ${RenderController.escapeHtml(elemento.nombre)}
            </td>
            <td colspan="2" class="descripcion-proyecto" data-field="descripcion">${RenderController.escapeHtml(elemento.descripcion || '')}</td>
            <td colspan="5"></td>
            <td class="actions-cell">
                <div class="dropdown">
                    <button class="btn action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="StorageController.editRow([${elementPath.join(',')}])"><i class="bi bi-pencil me-2"></i>Editar</a></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="StorageController.deleteElement([${elementPath.join(',')}])"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                    </ul>
                </div>
            </td>
        `;
    },

    /**
     * Construye el HTML de una fila de elemento hijo (tarea, subtarea, etc.).
     */
    _buildElementRow: function(elemento, elementPath, level) {
        const indent = level * 20;
        const icon = level === 1 ? '<i class="bi bi-file-text"></i>' : '<i class="bi bi-file-earmark"></i>';
        
        return `
            <td data-field="nombre" style="padding-left: ${indent}px;">
                ${icon} <strong>${RenderController.escapeHtml(elemento.nombre)}</strong>
            </td>
            <td data-field="descripcion">${RenderController.escapeHtml(elemento.descripcion || '')}</td>
            <td data-field="prioridad" class="prioridad">${RenderController.escapeHtml(elemento.prioridad || '')}</td>
            <td data-field="avance" class="avance">${RenderController.escapeHtml(elemento.avance || '')}</td>
            <td data-field="esfuerzo" class="esfuerzo">${RenderController.escapeHtml(elemento.esfuerzo || '')}</td>
            <td data-field="deadline">${RenderController.escapeHtml(elemento.deadline || '')}</td>
            <td>
                <select class="estado estado-select" data-current="${elemento.estado || 'Pendiente'}" 
                        onchange="StorageController.updateElementEstado([${elementPath.join(',')}], this.value)">
                    <option value="Pendiente" ${(elemento.estado || 'Pendiente') === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En progreso" ${elemento.estado === 'En progreso' ? 'selected' : ''}>En progreso</option>
                    <option value="Completado" ${elemento.estado === 'Completado' ? 'selected' : ''}>Completado</option>
                    <option value="Bloqueado" ${elemento.estado === 'Bloqueado' ? 'selected' : ''}>Bloqueado</option>
                    <option value="Backlog" ${elemento.estado === 'Backlog' ? 'selected' : ''}>Backlog</option>
                </select>
            </td>
            <td class="actions-cell">
                <div class="dropdown">
                    <button class="btn action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="StorageController.editRow([${elementPath.join(',')}])"><i class="bi bi-pencil me-2"></i>Editar</a></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="StorageController.deleteElement([${elementPath.join(',')}])"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                    </ul>
                </div>
            </td>
        `;
    },

    /**
     * Añade fila de resumen (recuento + avance) debajo de un proyecto.
     */
    _appendSummaryRow: function(elemento, elementPath, container) {
        const totalElementos = window.reglasNegocio.contarElementosRecursivo(elemento) - 1;
        const avanceGeneral = window.reglasNegocio.calcularAvanceGeneral(elemento);
        
        const recuentoRow = document.createElement('tr');
        recuentoRow.className = 'recuento-row';
        recuentoRow.dataset.projectIndex = elementPath[0];
        recuentoRow.innerHTML = `
            <td>Elementos: ${totalElementos}</td>
            <td colspan="2">Avance general: <strong>${avanceGeneral}%</strong></td>
            <td colspan="5"></td>
            <td></td>
        `;
        container.appendChild(recuentoRow);
    },

    // =============================================
    // UTILIDADES
    // =============================================

    /**
     * Escapa caracteres HTML para prevenir XSS.
     * @param {*} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml: function(text) {
        if (text === null || text === undefined) return '';
        
        const str = String(text);
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
};

// Exponer globalmente
window.RenderController = RenderController;

// Compatibilidad con funciones globales usadas por otros controladores
window.renderTable = RenderController.renderTable;
window.escapeHtml = RenderController.escapeHtml;
