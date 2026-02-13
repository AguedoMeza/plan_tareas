// renderController.js
// Controlador para renderizado – tabla global única con filas de sección

const RenderController = {

    /**
     * Renderiza la tabla global única.
     * Flujo: separar por estado → insertar section-header-row → proyectos → tareas.
     */
    renderTable: function() {
        DataController.cleanupCorruptedData();

        const activos = [];
        const backlog = [];
        const archivados = [];

        window.proyectosData.forEach((proyecto, index) => {
            const estado = proyecto.estadoProyecto || 'Activo';
            const proyectoOrdenado = window.reglasNegocio.aplicarOrdenamientoRecursivo({...proyecto});
            const entry = { proyecto: proyectoOrdenado, originalIndex: index };
            if (estado === 'Activo') activos.push(entry);
            else if (estado === 'Backlog') backlog.push(entry);
            else if (estado === 'Archivado') archivados.push(entry);
        });

        const tbody = document.getElementById('boardTableBody');
        tbody.innerHTML = '';

        const emptyState = document.getElementById('emptyStateActive');
        const table = document.getElementById('boardTable');

        if (activos.length === 0 && backlog.length === 0 && archivados.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            table.style.display = 'table';
            emptyState.style.display = 'none';
        }

        // Sección Activos
        if (activos.length > 0) {
            RenderController._insertSectionRow(tbody, 'Activos', activos.length, 'success');
            activos.forEach(entry => {
                RenderController._renderProject(entry.proyecto, entry.originalIndex, tbody);
            });
        }

        // Sección Backlog
        if (backlog.length > 0) {
            RenderController._insertSectionRow(tbody, 'Backlog', backlog.length, 'warning');
            backlog.forEach(entry => {
                RenderController._renderProject(entry.proyecto, entry.originalIndex, tbody);
            });
        }

        // Sección Archivados
        if (archivados.length > 0) {
            RenderController._insertSectionRow(tbody, 'Archivados', archivados.length, 'muted');
            archivados.forEach(entry => {
                RenderController._renderProject(entry.proyecto, entry.originalIndex, tbody);
            });
        }

        // Contadores en toolbar (si existen)
        const ca = document.getElementById('contadorActivos');
        const cb = document.getElementById('contadorBacklog');
        const cr = document.getElementById('contadorArchivado');
        if (ca) ca.textContent = activos.length;
        if (cb) cb.textContent = backlog.length;
        if (cr) cr.textContent = archivados.length;

        DragDropController.initialize();
    },

    // --------------------------------------------------
    // Fila de encabezado de sección (no es un <thead>, es un <tr> especial)
    // --------------------------------------------------
    _insertSectionRow: function(tbody, label, count, colorKey) {
        const tr = document.createElement('tr');
        tr.className = 'section-row section-' + colorKey;
        tr.innerHTML = `<td colspan="8">
            <span class="section-label">${label}</span>
            <span class="section-count">${count}</span>
        </td>`;
        tbody.appendChild(tr);
    },

    // --------------------------------------------------
    // Renderiza un proyecto como fila compacta + sus hijos
    // --------------------------------------------------
    _renderProject: function(proyecto, originalIndex, tbody) {
        const pathString = String(originalIndex);
        const avance = window.reglasNegocio.calcularAvanceGeneral(proyecto);
        const totalHijos = window.reglasNegocio.contarElementosRecursivo(proyecto) - 1;
        const estadoProyecto = proyecto.estadoProyecto || 'Activo';
        const proximoDeadline = RenderController._getNextDeadline(proyecto);
        const esfuerzoTotal = RenderController._calcTotalEsfuerzo(proyecto);

        const dragHandle = estadoProyecto === 'Activo'
            ? '<span class="drag-handle" title="Arrastra para reordenar"><i class="bi bi-grip-vertical"></i></span>'
            : '';

        const tr = document.createElement('tr');
        tr.className = 'proyecto-row';
        tr.dataset.elementPath = pathString;
        tr.dataset.projectIndex = originalIndex;
        tr.dataset.level = '0';

        tr.innerHTML = `
            <td class="proyecto-nombre" data-field="nombre">
                <div class="project-controls">
                    ${dragHandle}
                    <button class="collapse-btn" onclick="ProjectController.toggle(${originalIndex})" id="btn-${originalIndex}" title="Contraer/Expandir">
                        <span class="collapse-icon"><i class="bi bi-chevron-down"></i></span>
                    </button>
                </div>
                <select class="proyecto-estado-select"
                        data-current="${estadoProyecto}"
                        onchange="ProjectController.cambiarEstado(${originalIndex}, this.value)">
                    <option value="Activo" ${estadoProyecto === 'Activo' ? 'selected' : ''}>Activo</option>
                    <option value="Backlog" ${estadoProyecto === 'Backlog' ? 'selected' : ''}>Backlog</option>
                    <option value="Archivado" ${estadoProyecto === 'Archivado' ? 'selected' : ''}>Archivado</option>
                </select>
                <span class="proyecto-name-text">${RenderController.escapeHtml(proyecto.nombre)}</span>
            </td>
            <td class="proyecto-meta" data-field="descripcion">
                ${RenderController.escapeHtml(proyecto.descripcion || '')}
            </td>
            <td></td>
            <td class="avance">
                <div class="progress-mini" title="${avance}%">
                    <div class="progress-mini-bar" style="width:${avance}%"></div>
                </div>
                <span class="progress-label">${avance}%</span>
            </td>
            <td class="esfuerzo">${esfuerzoTotal ? RenderController.escapeHtml(esfuerzoTotal) : ''}</td>
            <td class="deadline-hint">${proximoDeadline ? RenderController.escapeHtml(proximoDeadline) : ''}</td>
            <td>
                <span class="task-count">${totalHijos} elem.</span>
            </td>
            <td class="actions-cell">
                <div class="dropdown">
                    <button class="btn action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="StorageController.editRow([${originalIndex}])"><i class="bi bi-pencil me-2"></i>Editar</a></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="StorageController.deleteElement([${originalIndex}])"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                    </ul>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Hijos recursivos
        if (Array.isArray(proyecto.elementos)) {
            proyecto.elementos.forEach((hijo, hijoIdx) => {
                RenderController._renderChild(hijo, [originalIndex, hijoIdx], 1, tbody);
            });
        }
    },

    // --------------------------------------------------
    // Renderiza un hijo (tarea / subtarea) recursivamente
    // --------------------------------------------------
    _renderChild: function(elemento, elementPath, level, tbody) {
        const pathString = elementPath.join('-');
        const hasChildren = Array.isArray(elemento.elementos) && elemento.elementos.length > 0;
        const indent = level * 20;
        const icon = level === 1 ? '<i class="bi bi-file-text"></i>' : '<i class="bi bi-file-earmark"></i>';

        const tr = document.createElement('tr');
        tr.className = level === 1 ? 'tarea-row' : 'subtarea-row';
        if (hasChildren) tr.classList.add('tarea-con-subtareas');
        tr.dataset.elementPath = pathString;
        tr.dataset.projectIndex = elementPath[0];
        tr.dataset.level = level;
        tr.dataset.parentPath = elementPath.slice(0, -1).join('-');

        tr.innerHTML = `
            <td data-field="nombre" style="padding-left:${indent + 14}px">
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
        tbody.appendChild(tr);

        if (hasChildren) {
            elemento.elementos.forEach((hijo, idx) => {
                RenderController._renderChild(hijo, [...elementPath, idx], level + 1, tbody);
            });
        }
    },

    // --------------------------------------------------
    // Utilidades de cálculo para la fila proyecto
    // --------------------------------------------------

    /** Encuentra el deadline más próximo entre todos los hijos */
    _getNextDeadline: function(proyecto) {
        let nearest = null;
        const today = new Date().toISOString().slice(0, 10);
        function walk(el) {
            if (el.deadline && el.deadline >= today) {
                if (!nearest || el.deadline < nearest) nearest = el.deadline;
            }
            if (Array.isArray(el.elementos)) el.elementos.forEach(walk);
        }
        if (Array.isArray(proyecto.elementos)) proyecto.elementos.forEach(walk);
        return nearest;
    },

    /** Suma heurística de esfuerzo de hijos (solo valores numéricos + unidad) */
    _calcTotalEsfuerzo: function(proyecto) {
        let totalDias = 0;
        let totalSemanas = 0;
        let hasData = false;
        function walk(el) {
            if (el.esfuerzo) {
                const val = el.esfuerzo.toString().toLowerCase().trim();
                const num = parseFloat(val);
                if (!isNaN(num)) {
                    hasData = true;
                    if (val.includes('sem') || val.includes('w')) totalSemanas += num;
                    else totalDias += num;
                }
            }
            if (Array.isArray(el.elementos)) el.elementos.forEach(walk);
        }
        if (Array.isArray(proyecto.elementos)) proyecto.elementos.forEach(walk);
        if (!hasData) return '';
        const parts = [];
        if (totalSemanas) parts.push(totalSemanas + 's');
        if (totalDias) parts.push(totalDias + 'd');
        return parts.join(' ') || '';
    },

    // --------------------------------------------------
    // Escape HTML
    // --------------------------------------------------
    escapeHtml: function(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, m => map[m]);
    }
};

window.RenderController = RenderController;
window.renderTable = RenderController.renderTable;
window.escapeHtml = RenderController.escapeHtml;
