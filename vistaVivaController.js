// vistaVivaController.js
// Controlador para gestión de Vista Viva - muestra solo nodos hoja activos

const VistaVivaController = {
    vistaActual: 'completa', // 'completa' o 'viva'
    
    // ============================================
    // 1. FUNCIÓN PRINCIPAL - Obtener Elementos Vivos
    // ============================================
    obtenerElementosVivos: function() {
        const elementosVivos = [];
        
        // Filtrar solo proyectos activos (no Backlog ni Archivado)
        const proyectosActivos = window.proyectosData.filter(proyecto => {
            // Si no tiene estadoProyecto, considerarlo Activo por defecto
            const estado = proyecto.estadoProyecto || 'Activo';
            return estado === 'Activo';
        });
        
        // Recorrer cada proyecto activo
        proyectosActivos.forEach(proyecto => {
            const pathBase = [proyecto.nombre];
            VistaVivaController.extraerElementosVivosRecursivo(proyecto.elementos, pathBase, elementosVivos);
        });
        
        // Ordenar por prioridad y deadline
        return VistaVivaController.ordenarElementosVivos(elementosVivos);
    },

    // ============================================
    // 2. FUNCIÓN RECURSIVA - Extraer elementos (SOLO NODOS HOJA)
    // ============================================
    extraerElementosVivosRecursivo: function(elementos, pathActual, resultado) {
        if (!Array.isArray(elementos) || elementos.length === 0) return;
        
        elementos.forEach(elemento => {
            // REGLA 1: Skip si el elemento está marcado como Backlog
            if (elemento.estado === 'Backlog') {
                return; // No procesar este elemento ni sus hijos
            }
            
            const nuevoPath = [...pathActual, elemento.nombre];
            
            // REGLA 2: Verificar si tiene hijos
            const tieneHijos = Array.isArray(elemento.elementos) && elemento.elementos.length > 0;
            
            // REGLA 3: Agregar solo si está Pendiente o En progreso Y NO TIENE HIJOS (es nodo hoja)
            const esActivo = elemento.estado === 'Pendiente' || elemento.estado === 'En progreso';
            
            if (esActivo && !tieneHijos) {
                resultado.push({
                    // Datos del elemento
                    elemento: elemento,
                    nombre: elemento.nombre,
                    descripcion: elemento.descripcion || '',
                    
                    // Path para mostrar (sin el nombre del elemento actual)
                    pathCompleto: pathActual.join(' / '),
                    
                    // Path completo para navegación/edición
                    rutaOriginal: nuevoPath,
                    
                    // Campos para ordenamiento
                    prioridad: parseInt(elemento.prioridad) || 999,
                    deadline: elemento.deadline || '9999-99-99',
                    esfuerzo: elemento.esfuerzo || '',
                    
                    // Estado actual
                    estado: elemento.estado,
                    avance: elemento.avance || ''
                });
            }
            
            // REGLA 4: Continuar recursivamente con elementos hijos
            // (incluso si este elemento no es activo, sus hijos podrían serlo)
            if (tieneHijos) {
                VistaVivaController.extraerElementosVivosRecursivo(elemento.elementos, nuevoPath, resultado);
            }
        });
    },

    // ============================================
    // 3. FUNCIÓN DE ORDENAMIENTO
    // ============================================
    ordenarElementosVivos: function(elementos) {
        return elementos.sort((a, b) => {
            // 1. Primero por estado (En progreso antes que Pendiente)
            const estadoOrden = { 'En progreso': 1, 'Pendiente': 2 };
            const ordenA = estadoOrden[a.estado] || 3;
            const ordenB = estadoOrden[b.estado] || 3;
            if (ordenA !== ordenB) return ordenA - ordenB;
            
            // 2. Luego por prioridad (1, 2, 3, sin prioridad al final)
            if (a.prioridad !== b.prioridad) {
                return a.prioridad - b.prioridad;
            }
            
            // 3. Luego por deadline (más cercano primero)
            if (a.deadline !== b.deadline) {
                // Deadlines vacíos al final
                if (a.deadline === '9999-99-99') return 1;
                if (b.deadline === '9999-99-99') return -1;
                return a.deadline.localeCompare(b.deadline);
            }
            
            // 4. Finalmente por nombre
            return a.nombre.localeCompare(b.nombre);
        });
    },

    // ============================================
    // 4. FUNCIÓN PARA RENDERIZAR VISTA VIVA
    // ============================================
    renderVistaViva: function() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        const elementosVivos = VistaVivaController.obtenerElementosVivos();
        
        // Mostrar mensaje si no hay elementos
        if (elementosVivos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #718096;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                            ¡No hay elementos activos!
                        </div>
                        <div style="font-size: 14px;">
                            Todos los elementos están completados o en backlog.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Renderizar cada elemento
        elementosVivos.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'vista-viva-row';
            row.dataset.index = index;
            
            // Construir el HTML de la fila
            row.innerHTML = `
                <td class="path-column">
                    <span class="breadcrumb">${VistaVivaController.escapeHtml(item.pathCompleto)}</span>
                </td>
                <td class="nombre-column">
                    <strong>${VistaVivaController.escapeHtml(item.nombre)}</strong>
                </td>
                <td class="descripcion-column">
                    ${VistaVivaController.escapeHtml(item.descripcion)}
                </td>
                <td class="prioridad-column text-center">
                    ${item.prioridad !== 999 ? item.prioridad : ''}
                </td>
                <td class="avance-column text-center">
                    ${VistaVivaController.escapeHtml(item.avance)}
                </td>
                <td class="esfuerzo-column text-center">
                    ${VistaVivaController.escapeHtml(item.esfuerzo)}
                </td>
                <td class="deadline-column">
                    ${item.deadline !== '9999-99-99' ? VistaVivaController.escapeHtml(item.deadline) : ''}
                </td>
                <td class="estado-column">
                    <select class="estado estado-select" data-current="${item.estado}" 
                            onchange="VistaVivaController.cambiarEstadoDesdeVistaViva(${index}, this.value)">
                        <option value="Pendiente" ${item.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En progreso" ${item.estado === 'En progreso' ? 'selected' : ''}>En progreso</option>
                        <option value="Completado">Completado</option>
                        <option value="Bloqueado">Bloqueado</option>
                        <option value="Backlog">🔶 Backlog</option>
                    </select>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-link" onclick="VistaVivaController.irAElemento('${item.rutaOriginal.join('-')}')" title="Ir a elemento">
                        📍
                    </button>
                    <button class="btn btn-sm btn-link" onclick="VistaVivaController.editarElementoVivo(${index})" title="Editar">
                        ✏️
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Actualizar contador
        VistaVivaController.actualizarContadorVistaViva(elementosVivos);
    },

    // ============================================
    // 5. FUNCIÓN PARA CAMBIAR ESTADO DESDE VISTA VIVA
    // ============================================
    cambiarEstadoDesdeVistaViva: function(index, nuevoEstado) {
        const elementosVivos = VistaVivaController.obtenerElementosVivos();
        const item = elementosVivos[index];
        
        if (!item) {
            StorageController.notify('Elemento no encontrado', 'error');
            return;
        }
        
        // Actualizar el estado del elemento original
        const elementoPath = VistaVivaController.obtenerPathNumerico(item.rutaOriginal);
        StorageController.updateElementEstado(elementoPath, nuevoEstado);
        
        // Re-renderizar vista viva
        VistaVivaController.renderVistaViva();
    },

    // ============================================
    // 6. FUNCIÓN AUXILIAR - Convertir path a numérico
    // ============================================
    obtenerPathNumerico: function(rutaOriginal) {
        // rutaOriginal es array de strings: ["Proyecto A", "Tarea 1", "Subtarea X"]
        // Necesitamos convertir a índices numéricos: [0, 2, 1]
        
        const path = [];
        
        // Buscar índice del proyecto
        const nombreProyecto = rutaOriginal[0];
        const indexProyecto = window.proyectosData.findIndex(p => p.nombre === nombreProyecto);
        if (indexProyecto === -1) return null;
        
        path.push(indexProyecto);
        
        // Si solo es proyecto, retornar
        if (rutaOriginal.length === 1) return path;
        
        // Navegar recursivamente para obtener índices
        let elementoActual = window.proyectosData[indexProyecto];
        
        for (let i = 1; i < rutaOriginal.length; i++) {
            const nombreBuscado = rutaOriginal[i];
            
            if (!Array.isArray(elementoActual.elementos)) {
                return null;
            }
            
            const index = elementoActual.elementos.findIndex(e => e.nombre === nombreBuscado);
            if (index === -1) return null;
            
            path.push(index);
            elementoActual = elementoActual.elementos[index];
        }
        
        return path;
    },

    // ============================================
    // 7. FUNCIÓN PARA ACTUALIZAR CONTADOR
    // ============================================
    actualizarContadorVistaViva: function(elementos) {
        const contadorElement = document.getElementById('vistaVivaContador');
        if (!contadorElement) return;
        
        const pendientes = elementos.filter(e => e.estado === 'Pendiente').length;
        const enProgreso = elementos.filter(e => e.estado === 'En progreso').length;
        const total = elementos.length;
        
        contadorElement.innerHTML = `
            <span class="badge bg-info">${total} total</span>
            <span class="badge bg-secondary">${pendientes} pendientes</span>
            <span class="badge bg-warning text-dark">${enProgreso} en progreso</span>
        `;
    },

    // ============================================
    // 8. FUNCIÓN PARA CAMBIAR ENTRE VISTAS
    // ============================================
    cambiarVista: function(vista) {
        VistaVivaController.vistaActual = vista;
        
        // Actualizar botones/tabs
        document.querySelectorAll('.vista-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-vista="${vista}"]`)?.classList.add('active');
        
        // Renderizar vista correspondiente
        if (vista === 'viva') {
            VistaVivaController.renderVistaViva();
        } else {
            if (window.renderTable) {
                window.renderTable();
            }
            StorageController.loadCollapsedStates(); // Restaurar estados de colapso
        }
        
        // Guardar preferencia
        localStorage.setItem('vistaPreferida', vista);
        
        // Actualizar contador del badge
        VistaVivaController.actualizarContadorVivoBadge();
    },

    // ============================================
    // 9. FUNCIÓN PARA IR A ELEMENTO EN VISTA COMPLETA
    // ============================================
    irAElemento: function(elementPathString) {
        // Cambiar a vista completa
        VistaVivaController.cambiarVista('completa');
        
        // Expandir el proyecto correspondiente
        const projectIndex = parseInt(elementPathString.split('-')[0]);
        
        // Asegurarse de que el proyecto esté expandido
        const projectRow = document.querySelector(`tr.proyecto-row[data-project-index="${projectIndex}"]`);
        if (projectRow && projectRow.classList.contains('proyecto-collapsed')) {
            if (window.toggleProject) {
                window.toggleProject(projectIndex);
            }
        }
        
        // Hacer scroll y highlight al elemento
        setTimeout(() => {
            const elementRow = document.querySelector(`tr[data-element-path="${elementPathString}"]`);
            if (elementRow) {
                elementRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                elementRow.classList.add('highlight-element');
                setTimeout(() => {
                    elementRow.classList.remove('highlight-element');
                }, 2000);
            }
        }, 300);
    },

    // ============================================
    // 10. FUNCIÓN PARA ACTUALIZAR CONTADOR DEL BADGE
    // ============================================
    actualizarContadorVivoBadge: function() {
        const elementosVivos = VistaVivaController.obtenerElementosVivos();
        const badgeElement = document.getElementById('contadorVivos');
        
        if (badgeElement) {
            badgeElement.textContent = elementosVivos.length;
        }
    },

    // ============================================
    // 11. FUNCIÓN PARA EDITAR ELEMENTO DESDE VISTA VIVA
    // ============================================
    editarElementoVivo: function(index) {
        const elementosVivos = VistaVivaController.obtenerElementosVivos();
        const item = elementosVivos[index];
        
        if (!item) {
            StorageController.notify('Elemento no encontrado', 'error');
            return;
        }
        
        // Cambiar a vista completa
        VistaVivaController.cambiarVista('completa');
        
        // Encontrar el path numérico del elemento
        const elementoPath = VistaVivaController.obtenerPathNumerico(item.rutaOriginal);
        
        if (elementoPath) {
            // Expandir proyecto si está colapsado
            const projectIndex = elementoPath[0];
            const projectRow = document.querySelector(`tr.proyecto-row[data-project-index="${projectIndex}"]`);
            if (projectRow && projectRow.classList.contains('proyecto-collapsed')) {
                if (window.toggleProject) {
                    window.toggleProject(projectIndex);
                }
            }
            
            // Esperar un poco y luego editar
            setTimeout(() => {
                StorageController.editRow(elementoPath);
            }, 300);
        }
    },

    // ============================================
    // 12. FUNCIÓN AUXILIAR - Escapar HTML
    // ============================================
    escapeHtml: function(text) {
        // Manejar valores null, undefined o vacíos
        if (text === null || text === undefined) {
            return '';
        }
        
        // Convertir a string si no lo es
        const str = String(text);
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    // ============================================
    // 13. INICIALIZAR VISTA PREFERIDA
    // ============================================
    initializeVistaPreferida: function() {
        const vistaPreferida = localStorage.getItem('vistaPreferida') || 'completa';
        if (vistaPreferida === 'viva') {
            VistaVivaController.cambiarVista('viva');
        }
        
        // Actualizar contador
        VistaVivaController.actualizarContadorVivoBadge();
    }
};

// Exponer el controlador globalmente
window.VistaVivaController = VistaVivaController;

// Mantener compatibilidad con funciones globales antiguas (opcional)
window.cambiarVista = VistaVivaController.cambiarVista.bind(VistaVivaController);