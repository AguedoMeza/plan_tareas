// renderController.js
// Controlador para renderizado – layout de tarjetas de proyecto con detalle expandible

const RenderController = {

    /**
     * Renderiza el board completo con tarjetas de proyecto.
     * Flujo: separar por estado → secciones Activos/Backlog/Archivados → tarjetas
     */
    renderTable: function() {
        DataController.cleanupCorruptedData();

        // ── Capturar estados antes de destruir el DOM ──
        const prevProjectStates = {};
        const prevGrouperStates = {};
        document.querySelectorAll('.projRow').forEach(card => {
            const idx = card.dataset.projectIndex;
            const detail = document.getElementById('detail-' + idx);
            if (detail && detail.style.display !== 'none') {
                prevProjectStates[idx] = true; // expanded
            }
        });
        document.querySelectorAll('.grouper-toggle').forEach(btn => {
            const icon = btn.querySelector('i');
            const gp = btn.dataset.groupPath;
            if (icon && gp && icon.classList.contains('bi-chevron-right')) {
                prevGrouperStates[gp] = true; // collapsed
            }
        });
        const hadPreviousDOM = Object.keys(prevProjectStates).length > 0 ||
            document.querySelectorAll('.projRow').length > 0;

        const activos = [];
        const backlog = [];
        const archivados = [];

        window.proyectosData.forEach((proyecto, index) => {
            const estado = proyecto.estadoProyecto || 'Activo';
            const proyectoOrdenado = window.reglasNegocio.aplicarOrdenamientoRecursivo({
                ...proyecto,
                elementos: proyecto.elementos ? JSON.parse(JSON.stringify(proyecto.elementos)) : []
            });
            const entry = { proyecto: proyectoOrdenado, originalIndex: index };
            if (estado === 'Activo') activos.push(entry);
            else if (estado === 'Backlog') backlog.push(entry);
            else if (estado === 'Archivado') archivados.push(entry);
        });

        const emptyState = document.getElementById('emptyStateActive');

        // Secciones
        const sectionActivos = document.getElementById('sectionActivos');
        const sectionBacklog = document.getElementById('sectionBacklog');
        const sectionArchivados = document.getElementById('sectionArchivados');
        const listActivos = document.getElementById('projListActivos');
        const listBacklog = document.getElementById('projListBacklog');
        const listArchivados = document.getElementById('projListArchivados');

        // Limpiar
        listActivos.innerHTML = '';
        listBacklog.innerHTML = '';
        listArchivados.innerHTML = '';

        if (activos.length === 0 && backlog.length === 0 && archivados.length === 0) {
            sectionActivos.style.display = 'none';
            sectionBacklog.style.display = 'none';
            sectionArchivados.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';

            // Activos
            if (activos.length > 0) {
                sectionActivos.style.display = '';
                document.getElementById('countActivos').textContent = activos.length;
                activos.forEach(entry => {
                    listActivos.appendChild(
                        RenderController._buildProjectCard(entry.proyecto, entry.originalIndex)
                    );
                });
            } else {
                sectionActivos.style.display = 'none';
            }

            // Backlog
            if (backlog.length > 0) {
                sectionBacklog.style.display = '';
                document.getElementById('countBacklog').textContent = backlog.length;
                backlog.forEach(entry => {
                    listBacklog.appendChild(
                        RenderController._buildProjectCard(entry.proyecto, entry.originalIndex)
                    );
                });
            } else {
                sectionBacklog.style.display = 'none';
            }

            // Archivados
            if (archivados.length > 0) {
                sectionArchivados.style.display = '';
                document.getElementById('countArchivados').textContent = archivados.length;
                archivados.forEach(entry => {
                    listArchivados.appendChild(
                        RenderController._buildProjectCard(entry.proyecto, entry.originalIndex)
                    );
                });
            } else {
                sectionArchivados.style.display = 'none';
            }
        }

        // Badge total en panel header
        const badge = document.getElementById('badgeProyectos');
        if (badge) {
            const total = activos.length + backlog.length + archivados.length;
            badge.textContent = total + ' proyecto' + (total !== 1 ? 's' : '');
        }

        // Contadores en toolbar (si existen)
        const ca = document.getElementById('contadorActivos');
        const cb = document.getElementById('contadorBacklog');
        const cr = document.getElementById('contadorArchivado');
        if (ca) ca.textContent = activos.length;
        if (cb) cb.textContent = backlog.length;
        if (cr) cr.textContent = archivados.length;

        // ── Restaurar estados colapsados si había DOM previo ──
        if (hadPreviousDOM) {
            // Restaurar proyectos expandidos
            Object.keys(prevProjectStates).forEach(idx => {
                const detail = document.getElementById('detail-' + idx);
                if (detail && detail.style.display === 'none') {
                    ProjectController.toggle(parseInt(idx));
                }
            });
            // Restaurar agrupadores colapsados
            setTimeout(() => {
                Object.keys(prevGrouperStates).forEach(gp => {
                    const btn = document.querySelector(`.grouper-toggle[data-group-path="${gp}"]`);
                    if (btn) {
                        const icon = btn.querySelector('i');
                        if (icon && icon.classList.contains('bi-chevron-down')) {
                            RenderController.toggleGroup(gp, btn);
                        }
                    }
                });
            }, 20);
        }

        DragDropController.initialize();
    },

    // --------------------------------------------------
    // Construye una tarjeta de proyecto (.projRow)
    // --------------------------------------------------
    _buildProjectCard: function(proyecto, originalIndex) {
        const avance = window.reglasNegocio.calcularAvanceGeneral(proyecto);
        const totalHijos = window.reglasNegocio.contarElementosRecursivo(proyecto) - 1;
        const estadoProyecto = proyecto.estadoProyecto || 'Activo';
        const esfuerzoTotal = RenderController._calcTotalEsfuerzo(proyecto);
        const hasChildrenProject = Array.isArray(proyecto.elementos) && proyecto.elementos.length > 0;
        const esc = RenderController.escapeHtml;

        const chipClass = estadoProyecto === 'Activo' ? 'statusChip--activo'
            : estadoProyecto === 'Backlog' ? 'statusChip--backlog'
            : 'statusChip--archivado';

        const card = document.createElement('div');
        card.className = 'projRow' + (estadoProyecto === 'Archivado' ? ' projRow--archived' : '');
        card.dataset.projectIndex = originalIndex;
        card.dataset.elementPath = String(originalIndex);

        // ---- Main row (always visible) ----
        const main = document.createElement('div');
        main.className = 'projMain';

        // 1. Collapse button
        const colBtn = document.createElement('button');
        colBtn.className = 'iconBtn';
        colBtn.id = 'btn-' + originalIndex;
        colBtn.title = 'Expandir';
        colBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
        colBtn.addEventListener('click', () => ProjectController.toggle(originalIndex));

        // 2. Status chip (oculto en proyectos padre con barra de avance)
        let chipWrap = null;
        if (!hasChildrenProject) {
            chipWrap = document.createElement('div');
            chipWrap.className = 'statusChip ' + chipClass;
            if (estadoProyecto === 'Archivado') {
                chipWrap.innerHTML = '<i class="bi bi-lock-fill" style="font-size:11px;margin-right:4px"></i>'
                    + '<select class="proyecto-estado-select" data-current="' + esc(estadoProyecto) + '" onchange="ProjectController.cambiarEstado(' + originalIndex + ', this.value)">'
                    + '<option value="Activo">Activo</option>'
                    + '<option value="Backlog">Backlog</option>'
                    + '<option value="Archivado" selected>Archivado</option>'
                    + '</select>';
            } else {
                chipWrap.innerHTML = '<select class="proyecto-estado-select" data-current="' + esc(estadoProyecto) + '" onchange="ProjectController.cambiarEstado(' + originalIndex + ', this.value)">'
                    + '<option value="Activo"' + (estadoProyecto === 'Activo' ? ' selected' : '') + '>Activo</option>'
                    + '<option value="Backlog"' + (estadoProyecto === 'Backlog' ? ' selected' : '') + '>Backlog</option>'
                    + '<option value="Archivado"' + (estadoProyecto === 'Archivado' ? ' selected' : '') + '>Archivado</option>'
                    + '</select>';
            }
        }

        // 3. Title block
        const titleBlock = document.createElement('div');
        titleBlock.className = 'projTitle';
        titleBlock.innerHTML = '<p class="name">' + esc(proyecto.nombre) + '</p>'
            + '<p class="desc">' + esc(proyecto.descripcion || '—') + '</p>';

        // 4. Meta KPIs — compact single line
        const meta = document.createElement('div');
        meta.className = 'projMeta';
        const metaParts = [totalHijos + ' tareas'];
        if (esfuerzoTotal) metaParts.push(esfuerzoTotal);
        meta.innerHTML = '<span>' + metaParts.join(' · ') + '</span>';

        // 5. Progress — % overlay inside bar
        const progressWrap = document.createElement('div');
        progressWrap.className = 'proj-progress-wrap';
        progressWrap.innerHTML = '<div class="proj-progress" title="Avance ' + avance + '%">'
            + '<span class="proj-progress-bar" style="width:' + Math.max(avance, 2) + '%"></span>'
            + '<span class="proj-progress-pct">' + avance + '%</span>'
            + '</div>';

        // 7. Actions (more menu)
        const moreWrap = document.createElement('div');
        moreWrap.className = 'proj-more';
        if (estadoProyecto === 'Activo' || estadoProyecto === 'Backlog') {
            moreWrap.innerHTML = '<span class="drag-handle" title="Arrastra para reordenar"><i class="bi bi-grip-vertical"></i></span>';
        }
        moreWrap.innerHTML += '<div class="dropdown">'
            + '<button class="btn action-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-three-dots-vertical"></i></button>'
            + '<ul class="dropdown-menu dropdown-menu-end">'
            + '<li><a class="dropdown-item" href="#" onclick="StorageController.editRow([' + originalIndex + '])"><i class="bi bi-pencil me-2"></i>Editar</a></li>'
            + '<li><a class="dropdown-item text-danger" href="#" onclick="StorageController.deleteElement([' + originalIndex + '])"><i class="bi bi-trash me-2"></i>Eliminar</a></li>'
            + '</ul></div>';

        main.appendChild(colBtn);
        if (chipWrap) {
            main.appendChild(chipWrap);
        } else {
            const chipSpacer = document.createElement('div');
            chipSpacer.className = 'statusSpacer';
            chipSpacer.setAttribute('aria-hidden', 'true');
            main.appendChild(chipSpacer);
        }
        main.appendChild(titleBlock);
        main.appendChild(meta);
        main.appendChild(progressWrap);
        main.appendChild(moreWrap);
        card.appendChild(main);

        // ---- Detail (collapsed by default) ----
        if (Array.isArray(proyecto.elementos) && proyecto.elementos.length > 0) {
            const detail = document.createElement('div');
            detail.className = 'projDetail';
            detail.id = 'detail-' + originalIndex;
            detail.style.display = 'none';

            const table = document.createElement('table');
            table.innerHTML = '<thead><tr>'
                + '<th style="width:180px">Nombre</th>'
                + '<th>Descripción</th>'
                + '<th style="width:60px">Prior.</th>'
                + '<th class="col-avance" style="width:120px">Avance</th>'
                + '<th style="width:90px">Esfuerzo</th>'
                + '<th style="width:100px">Deadline</th>'
                + '<th class="col-estado" style="width:110px">Estado</th>'
                + '<th style="width:80px;text-align:right">Acciones</th>'
                + '</tr></thead>';

            const tbody = document.createElement('tbody');
            proyecto.elementos.forEach((hijo, hijoIdx) => {
                RenderController._buildDetailRows(hijo, [originalIndex, hijoIdx], 1, tbody, proyecto.nombre);
            });
            table.appendChild(tbody);
            detail.appendChild(table);
            card.appendChild(detail);
        }

        return card;
    },

    // --------------------------------------------------
    // Construye filas recursivas dentro de la tabla de detalle
    // --------------------------------------------------
    _buildDetailRows: function(elemento, elementPath, level, tbody, projectName) {
        const esc = RenderController.escapeHtml;
        const hasChildren = Array.isArray(elemento.elementos) && elemento.elementos.length > 0;
        const pathString = elementPath.join('-');

        const tr = document.createElement('tr');
        tr.className = level === 1 ? 'task-row' : 'subtask-row';
        if (hasChildren) tr.classList.add('task-row-parent');
        tr.dataset.elementPath = pathString;
        tr.dataset.projectIndex = elementPath[0];
        tr.dataset.level = level;
        tr.dataset.parentPath = elementPath.slice(0, -1).join('-');

        // Priority class
        const prioVal = elemento.prioridad ? elemento.prioridad.toString() : '';
        const prioClass = prioVal === '1' ? 'prio-1' : prioVal === '2' ? 'prio-2' : prioVal === '3' ? 'prio-3' : '';

        // Estado class for inline display
        const estado = elemento.estado || 'Pendiente';

        // Avance for elements with children
        let avanceDisplay = esc(elemento.avance || '');
        if (hasChildren) {
            const calc = window.reglasNegocio.calcularAvanceRecursivo(elemento);
            avanceDisplay = '<div class="proj-progress" style="height:6px;"><span class="proj-progress-bar" style="width:' + Math.max(calc, 2) + '%"></span></div>'
                + '<div style="margin-top:4px;color:var(--text-muted);font-size:11px;text-align:right;">' + calc + '%</div>';
        } else if (estado === 'Completado' && !avanceDisplay) {
            avanceDisplay = '100%';
        }

        const indent = level > 1 ? 'style="padding-left:' + ((level - 1) * 20 + 10) + 'px"' : '';

        const toggleBtn = hasChildren
            ? '<span class="grouper-toggle" data-group-path="' + pathString + '" onclick="RenderController.toggleGroup(\'' + pathString + '\', this)" title="Contraer/Expandir"><i class="bi bi-chevron-down"></i></span> '
            : '';

        tr.innerHTML = ''
            + '<td ' + indent + ' data-field="nombre">'
            + '<div class="itemName">' + toggleBtn + esc(elemento.nombre) + '</div>'
            + (hasChildren ? '<div class="itemSub">Agrupador · ' + elemento.elementos.length + ' items</div>' : (level > 1 ? '<div class="itemSub">Subtarea</div>' : '<div class="itemSub">Tarea</div>'))
            + '</td>'
            + '<td data-field="descripcion"><span class="itemSub">' + esc(elemento.descripcion || '—') + '</span></td>'
            + '<td data-field="prioridad">' + (prioVal ? '<span class="prio ' + prioClass + '">' + esc(prioVal) + '</span>' : '') + '</td>'
            + '<td class="cell-avance" data-field="avance">' + avanceDisplay + '</td>'
            + '<td data-field="esfuerzo"><b>' + esc(elemento.esfuerzo || '') + '</b></td>'
            + '<td data-field="deadline">' + esc(elemento.deadline || '—') + '</td>'
            + (hasChildren
                ? '<td class="cell-estado cell-estado-empty" aria-hidden="true">&nbsp;</td>'
                : '<td class="cell-estado" style="text-align:center;vertical-align:middle;">'
                    + '<select class="estado estado-select" data-current="' + esc(estado) + '" onchange="StorageController.updateElementEstado([' + elementPath.join(',') + '], this.value)">'
                    + '<option value="Pendiente"' + (estado === 'Pendiente' ? ' selected' : '') + '>Pendiente</option>'
                    + '<option value="En progreso"' + (estado === 'En progreso' ? ' selected' : '') + '>En progreso</option>'
                    + '<option value="Completado"' + (estado === 'Completado' ? ' selected' : '') + '>Completado</option>'
                    + '<option value="Bloqueado"' + (estado === 'Bloqueado' ? ' selected' : '') + '>Bloqueado</option>'
                    + '<option value="Backlog"' + (estado === 'Backlog' ? ' selected' : '') + '>Backlog</option>'
                    + '</select>'
                + '</td>'
            )
            + '<td style="text-align:right">'
            + '<div class="tblActions">'
            + '<span class="action-icon" title="Editar" onclick="StorageController.editRow([' + elementPath.join(',') + '])"><i class="bi bi-pencil"></i></span>'
            + '<span class="action-icon danger" title="Eliminar" onclick="StorageController.deleteElement([' + elementPath.join(',') + '])"><i class="bi bi-trash"></i></span>'
            + '</div>'
            + '</td>';

        tbody.appendChild(tr);

        // Recurse children
        if (hasChildren) {
            elemento.elementos.forEach((hijo, idx) => {
                RenderController._buildDetailRows(hijo, [...elementPath, idx], level + 1, tbody, projectName);
            });
        }
    },

    // --------------------------------------------------
    // Toggle collapse/expand for grouper rows in detail table
    // --------------------------------------------------
    toggleGroup: function(groupPath, btnElement) {
        const icon = btnElement.querySelector('i');
        const isCollapsed = icon.classList.contains('bi-chevron-right');

        // Find all child rows whose path starts with this group path
        const detailContainer = btnElement.closest('.projDetail');
        if (!detailContainer) return;

        const allRows = detailContainer.querySelectorAll('tbody tr');
        allRows.forEach(row => {
            const rowPath = row.dataset.elementPath;
            if (!rowPath) return;
            // Must start with groupPath + '-' (direct or nested children)
            if (rowPath.startsWith(groupPath + '-')) {
                if (isCollapsed) {
                    row.style.display = '';
                    // If this child is itself a collapsed grouper, keep ITS children hidden
                    const childToggle = row.querySelector('.grouper-toggle i');
                    if (childToggle && childToggle.classList.contains('bi-chevron-right')) {
                        // This child grouper is collapsed — hide its descendants
                        const childPath = row.dataset.elementPath;
                        allRows.forEach(grandChild => {
                            if (grandChild.dataset.elementPath &&
                                grandChild.dataset.elementPath.startsWith(childPath + '-')) {
                                grandChild.style.display = 'none';
                            }
                        });
                    }
                } else {
                    row.style.display = 'none';
                }
            }
        });

        // Toggle icon
        if (isCollapsed) {
            icon.classList.replace('bi-chevron-right', 'bi-chevron-down');
            btnElement.title = 'Contraer';
        } else {
            icon.classList.replace('bi-chevron-down', 'bi-chevron-right');
            btnElement.title = 'Expandir';
        }

        // Persistir estado
        setTimeout(() => StorageController.saveCollapsedStates(), 50);
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
