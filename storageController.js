// storageController.js
// Controlador para gestión de storage de proyectos

const StorageController = {
    // Variables para gestión de múltiples tableros
    currentBoardId: null,
    defaultBoardName: 'Tablero Principal',
    
    // Exportar el tablero actual como archivo JSON
    exportStorage: function() {
        try {
            const currentBoard = StorageController.getCurrentBoard();
            if (!currentBoard) {
                StorageController.notify('No hay tablero activo para exportar', 'error');
                return;
            }
            
            const data = {
                boardName: currentBoard.name,
                proyectosData: window.proyectosData,
                collapsedStates: JSON.parse(localStorage.getItem(`collapsedStates_${StorageController.currentBoardId}`) || '{}'),
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentBoard.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            StorageController.notify(`Tablero "${currentBoard.name}" exportado correctamente`, 'success');
        } catch (error) {
            console.error('Error al exportar:', error);
            StorageController.notify('Error al exportar el tablero', 'error');
        }
    },

    // Importar tablero desde archivo JSON
    importStorage: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.proyectosData || !Array.isArray(data.proyectosData)) {
                    StorageController.notify('Archivo inválido: no contiene proyectos', 'error');
                    return;
                }
                
                // Obtener nombre del tablero del archivo o usar nombre por defecto
                const boardName = data.boardName || `Tablero_Importado_${new Date().toLocaleString()}`;
                
                // Verificar si ya existe un tablero con ese nombre
                let finalBoardName = boardName;
                let counter = 1;
                while (StorageController.boardExists(finalBoardName)) {
                    finalBoardName = `${boardName} (${counter})`;
                    counter++;
                }
                
                // Crear nuevo tablero con los datos importados
                const newBoardId = StorageController.createBoard(finalBoardName);
                if (newBoardId) {
                    // Guardar los datos del tablero importado
                    localStorage.setItem(`boardData_${newBoardId}`, JSON.stringify(data.proyectosData));
                    
                    // Guardar estados de colapso si existen
                    if (data.collapsedStates) {
                        localStorage.setItem(`collapsedStates_${newBoardId}`, JSON.stringify(data.collapsedStates));
                    }
                    
                    // Cambiar al tablero recién importado
                    StorageController.switchBoard(newBoardId);
                    
                    StorageController.notify(`Tablero "${finalBoardName}" importado y activado correctamente`, 'success');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                StorageController.notify('Error al importar el tablero', 'error');
            }
        };
        reader.readAsText(file);
        // Limpiar el input para permitir importar el mismo archivo de nuevo si se desea
        event.target.value = '';
    },
    save: function() {
        try {
            if (!StorageController.currentBoardId) {
                StorageController.notify('No hay tablero activo para guardar', 'error');
                return;
            }
            localStorage.setItem(`boardData_${StorageController.currentBoardId}`, JSON.stringify(window.proyectosData));
            // No mostrar notificación de guardado para no ser intrusivo
        } catch (error) {
            console.error('Error al guardar proyectos:', error);
            StorageController.notify('Error al guardar proyectos', 'error');
        }
    },
    
    load: function() {
        try {
            if (!StorageController.currentBoardId) {
                return false;
            }
            const savedProjects = localStorage.getItem(`boardData_${StorageController.currentBoardId}`);
            if (savedProjects) {
                window.proyectosData = JSON.parse(savedProjects);
                return true;
            }
        } catch (error) {
            console.error('Error al cargar proyectos:', error);
            StorageController.notify('Error al cargar proyectos guardados', 'error');
        }
        return false;
    },
    
    // Funciones para crear nuevos elementos
    createProject: function(nombre, descripcion = '') {
        if (!nombre || nombre.trim() === '') {
            StorageController.notify('El nombre del proyecto es requerido', 'error');
            return false;
        }
        
        const nuevoProyecto = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tipo: 'proyecto',
            avance: '',
            prioridad: '',
            esfuerzo: '',
            deadline: '',
            estado: 'Pendiente',
            elementos: [] // Ahora usa 'elementos' en lugar de 'tareas'
        };
        
        window.proyectosData.push(nuevoProyecto);
        StorageController.save();
        StorageController.notify(`Proyecto "${nombre}" creado exitosamente`, 'success');
        return true;
    },
    
    // Función unificada para crear elementos (puede ser tarea, subtarea, etc.)
    createElement: function(parentPath, nombre, descripcion = '', prioridad = '', esfuerzo = '', deadline = '', estado = 'Pendiente', tipo = 'elemento') {
        if (!nombre || nombre.trim() === '') {
            StorageController.notify('El nombre del elemento es requerido', 'error');
            return false;
        }
        
        // Encontrar el elemento padre usando la ruta
        const parent = StorageController.findElementByPath(parentPath);
        if (!parent) {
            StorageController.notify('Elemento padre no encontrado', 'error');
            return false;
        }
        
        const nuevoElemento = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            tipo: tipo,
            prioridad: prioridad,
            avance: '',
            esfuerzo: esfuerzo.trim(),
            deadline: deadline.trim(),
            estado: estado,
            elementos: [] // Cada elemento puede tener hijos
        };
        
        // Inicializar array de elementos si no existe
        if (!Array.isArray(parent.elementos)) {
            parent.elementos = [];
        }
        
        parent.elementos.push(nuevoElemento);
        StorageController.save();
        StorageController.notify(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} "${nombre}" creado exitosamente`, 'success');
        return true;
    },

    // Funciones auxiliares para manejo recursivo
    findElementByPath: function(path) {
        if (!Array.isArray(path) || path.length === 0) {
            return null;
        }
        
        // Si el primer índice apunta a un proyecto
        if (path.length === 1) {
            return window.proyectosData[path[0]] || null;
        }
        
        // Navegar recursivamente por la ruta
        let current = window.proyectosData[path[0]];
        if (!current) return null;
        
        for (let i = 1; i < path.length; i++) {
            if (!Array.isArray(current.elementos) || !current.elementos[path[i]]) {
                return null;
            }
            current = current.elementos[path[i]];
        }
        
        return current;
    },

    // Función para obtener todos los elementos de manera recursiva con sus rutas
    getAllElementsWithPaths: function(includeProjects = true) {
        const elements = [];
        
        window.proyectosData.forEach((proyecto, projectIndex) => {
            if (includeProjects) {
                elements.push({
                    element: proyecto,
                    path: [projectIndex],
                    level: 0,
                    displayName: proyecto.nombre
                });
            }
            
            if (Array.isArray(proyecto.elementos)) {
                StorageController.getElementsRecursive(proyecto.elementos, [projectIndex], 1, elements);
            }
        });
        
        return elements;
    },

    getElementsRecursive: function(elementsList, basePath, level, result) {
        elementsList.forEach((elemento, index) => {
            const currentPath = [...basePath, index];
            const indentation = '  '.repeat(level);
            
            result.push({
                element: elemento,
                path: currentPath,
                level: level,
                displayName: `${indentation}${elemento.nombre}`
            });
            
            if (Array.isArray(elemento.elementos) && elemento.elementos.length > 0) {
                StorageController.getElementsRecursive(elemento.elementos, currentPath, level + 1, result);
            }
        });
    },

    // Mantener compatibilidad con funciones anteriores
    createTask: function(projectIndex, nombre, descripcion = '', prioridad = '', esfuerzo = '', deadline = '', estado = 'Pendiente') {
        return StorageController.createElement([projectIndex], nombre, descripcion, prioridad, esfuerzo, deadline, estado, 'tarea');
    },

    createSubtask: function(projectIndex, taskIndex, nombre, descripcion = '', prioridad = '', esfuerzo = '', deadline = '', estado = 'Pendiente') {
        return StorageController.createElement([projectIndex, taskIndex], nombre, descripcion, prioridad, esfuerzo, deadline, estado, 'subtarea');
    },
    
    // Funciones para editar y eliminar elementos
    editRow: function(elementPath) {
        // Cancelar edición actual si existe
        if (StorageController.currentlyEditing) {
            StorageController.cancelEdit();
        }

        // Encontrar el elemento usando la ruta
        const element = StorageController.findElementByPath(elementPath);
        if (!element) {
            StorageController.notify('Elemento no encontrado', 'error');
            return;
        }

        // Encontrar la fila correspondiente en el DOM
        const pathString = elementPath.join('-');
        const row = document.querySelector(`tr[data-element-path="${pathString}"]`);
        
        if (!row) {
            StorageController.notify('Fila no encontrada en la interfaz', 'error');
            return;
        }

        // Marcar como editando
        StorageController.currentlyEditing = { 
            elementPath: elementPath, 
            row: row, 
            originalData: {...element} 
        };
        row.classList.add('editing-mode');
        
        // Convertir celdas editables
        const editableCells = row.querySelectorAll('[data-field]');
        editableCells.forEach(cell => {
            const field = cell.getAttribute('data-field');
            let currentValue = '';
            
            // Obtener valor actual según el campo
            if (field === 'nombre') {
                currentValue = element.nombre || '';
            } else if (field === 'descripcion') {
                currentValue = element.descripcion || '';
            } else if (field === 'prioridad') {
                currentValue = element.prioridad || '';
            } else if (field === 'avance') {
                currentValue = element.avance || '';
            } else if (field === 'esfuerzo') {
                currentValue = element.esfuerzo || '';
            } else if (field === 'deadline') {
                currentValue = element.deadline || '';
            } else if (field === 'estado') {
                currentValue = element.estado || 'Pendiente';
            }
            
            // Crear inputs específicos según el campo y tipo de elemento
            if (field === 'nombre') {
                const level = elementPath.length - 1;
                const isProject = level === 0;
                
                if (isProject) {
                    // Para proyectos, mantener los controles y agregar input para el nombre
                    const projectIndex = elementPath[0];
                    cell.innerHTML = `
                        <div class="project-controls">
                            <button class="reorder-btn" onclick="moveProject(${projectIndex}, 'up')" title="Mover hacia arriba" ${projectIndex === 0 ? 'disabled' : ''}>
                                ⬆️
                            </button>
                            <button class="reorder-btn" onclick="moveProject(${projectIndex}, 'down')" title="Mover hacia abajo" ${projectIndex >= (window.proyectosData ? window.proyectosData.length - 1 : 0) ? 'disabled' : ''}>
                                ⬇️
                            </button>
                            <button class="collapse-btn" onclick="toggleProject(${projectIndex})" title="Contraer/Expandir proyecto">
                                <span class="collapse-icon">🔽</span>
                            </button>
                        </div>
                        <input type="text" class="form-control form-control-sm edit-input d-inline" style="width: calc(100% - 120px); margin-left: 8px;" value="${StorageController.escapeHtml(currentValue)}" data-field="nombre">
                    `;
                } else {
                    // Para elementos anidados, usar indentación visual
                    const indent = '  '.repeat(level);
                    const icon = level === 1 ? '📝' : '📄';
                    cell.innerHTML = `${icon} <input type="text" class="form-control form-control-sm edit-input d-inline" style="width: calc(100% - 30px); margin-left: ${level * 20}px;" value="${StorageController.escapeHtml(currentValue)}" data-field="nombre">`;
                }
                return;
            }
            
            if (field === 'prioridad') {
                cell.innerHTML = `
                    <select class="form-select form-select-sm edit-input" data-field="prioridad">
                        <option value="">Sin prioridad</option>
                        <option value="1" ${currentValue == '1' ? 'selected' : ''}>1 - Alta</option>
                        <option value="2" ${currentValue == '2' ? 'selected' : ''}>2 - Media</option>
                        <option value="3" ${currentValue == '3' ? 'selected' : ''}>3 - Baja</option>
                    </select>
                `;
                return;
            }
            
            if (field === 'deadline') {
                cell.innerHTML = `<input type="date" class="form-control form-control-sm edit-input" value="${StorageController.escapeHtml(currentValue)}" data-field="deadline">`;
                return;
            }
            
            if (field === 'estado') {
                // Para estado, mantener el select directo (no crear uno nuevo en modo edición)
                return;
            }
            
            // Input de texto por defecto para otros campos
            if (field === 'descripcion') {
                cell.innerHTML = `<textarea class="form-control form-control-sm edit-input" rows="1" data-field="${field}">${StorageController.escapeHtml(currentValue)}</textarea>`;
            } else {
                cell.innerHTML = `<input type="text" class="form-control form-control-sm edit-input" value="${StorageController.escapeHtml(currentValue)}" data-field="${field}">`;
            }
        });
        
        // Cambiar el dropdown de acciones por botones de guardar/cancelar
        const actionsCell = row.querySelector('.actions-cell');
        actionsCell.innerHTML = `
            <div class="btn-group btn-group-sm">
                <button class="btn btn-success btn-sm" onclick="StorageController.saveEdit()" title="Guardar">
                    💾
                </button>
                <button class="btn btn-secondary btn-sm" onclick="StorageController.cancelEdit()" title="Cancelar">
                    ❌
                </button>
            </div>
        `;
        
        // Enfocar primer input
        const firstInput = row.querySelector('.edit-input');
        if (firstInput) {
            firstInput.focus();
            if (firstInput.type === 'text' || firstInput.tagName === 'TEXTAREA') {
                firstInput.select();
            }
        }
        
        // Agregar event listeners para Enter y Escape
        const inputs = row.querySelectorAll('.edit-input');
        inputs.forEach(input => {
            input.addEventListener('keydown', StorageController.handleEditKeydown);
        });
    },

    saveEdit: function() {
        if (!StorageController.currentlyEditing) return;
        
        const { elementPath, row } = StorageController.currentlyEditing;
        const element = StorageController.findElementByPath(elementPath);
        
        if (!element) {
            StorageController.notify('Elemento no encontrado', 'error');
            return;
        }
        
        const inputs = row.querySelectorAll('.edit-input');
        const newData = {};
        
        // Recopilar nuevos valores
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            let value = input.value.trim();
            
            // Saltar el campo estado ya que se maneja por separado
            if (field === 'estado') {
                return;
            }
            if (field === 'prioridad' && value === '') {
                value = ''; // Permitir prioridad vacía
            }
            
            newData[field] = value;
        });
        
        // Validar solo campos realmente requeridos
        if (!newData.nombre || newData.nombre.trim() === '') {
            StorageController.notify('El nombre es requerido', 'error');
            // Enfocar el campo nombre
            const nombreInput = row.querySelector('input[data-field="nombre"], textarea[data-field="nombre"]');
            if (nombreInput) {
                nombreInput.focus();
                nombreInput.style.borderColor = '#dc3545';
            }
            return;
        }
        
        // Limpiar estilos de error previos
        const allInputs = row.querySelectorAll('.edit-input');
        allInputs.forEach(input => {
            input.style.borderColor = '';
        });

            // Actualizar datos del elemento
        try {
            // Actualizar los datos del elemento
            Object.assign(element, newData);

            // Si el estado es Completado, poner avance en 100%
            if (element.estado === 'Completado') {
                element.avance = '100%';
            }

            StorageController.save();
            const tipoElemento = element.tipo || (elementPath.length === 1 ? 'Proyecto' : 'Elemento');
            StorageController.notify(`${tipoElemento} "${newData.nombre}" actualizado correctamente`, 'success');

            if (window.renderTable) {
                window.renderTable();
            }
            StorageController.currentlyEditing = null;
        } catch (error) {
            console.error('Error al guardar:', error);
            StorageController.notify('Error al guardar los cambios', 'error');
        }
    },

    cancelEdit: function() {
        if (!StorageController.currentlyEditing) return;
        
        // Re-renderizar para restaurar estado original
        if (window.renderTable) {
            window.renderTable();
        }
        StorageController.currentlyEditing = null;
    },

    // Función recursiva para eliminar elementos
    deleteElement: function(elementPath) {
        const element = StorageController.findElementByPath(elementPath);
        if (!element) {
            StorageController.notify('Elemento no encontrado', 'error');
            return;
        }
        
        const itemName = element.nombre;
        const hasChildren = Array.isArray(element.elementos) && element.elementos.length > 0;
        const tipoElemento = element.tipo || (elementPath.length === 1 ? 'proyecto' : 'elemento');
        
        const confirmMessage = hasChildren 
            ? `¿Estás seguro de que deseas eliminar ${tipoElemento} "${itemName}" y todos sus elementos hijos?`
            : `¿Estás seguro de que deseas eliminar ${tipoElemento} "${itemName}"?`;
        
        if (confirm(confirmMessage)) {
            try {
                if (elementPath.length === 1) {
                    // Eliminar proyecto
                    window.proyectosData.splice(elementPath[0], 1);
                } else {
                    // Eliminar elemento anidado
                    const parentPath = elementPath.slice(0, -1);
                    const parent = StorageController.findElementByPath(parentPath);
                    const elementIndex = elementPath[elementPath.length - 1];
                    
                    if (parent && Array.isArray(parent.elementos)) {
                        parent.elementos.splice(elementIndex, 1);
                    }
                }
                
                // Guardar cambios
                StorageController.save();
                StorageController.notify(`${tipoElemento.charAt(0).toUpperCase() + tipoElemento.slice(1)} "${itemName}" eliminado correctamente`, 'success');
                
                // Re-renderizar tabla
                if (window.renderTable) {
                    window.renderTable();
                }
                
            } catch (error) {
                console.error('Error al eliminar:', error);
                StorageController.notify('Error al eliminar el elemento', 'error');
            }
        }
    },

    // Mantener compatibilidad con función anterior
    deleteRow: function(type, projectIndex, taskIndex = null, subtaskIndex = null) {
        let elementPath = [projectIndex];
        
        if (taskIndex !== null) {
            elementPath.push(taskIndex);
        }
        if (subtaskIndex !== null) {
            elementPath.push(subtaskIndex);
        }
        
        StorageController.deleteElement(elementPath);
    },

    handleEditKeydown: function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            StorageController.saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            StorageController.cancelEdit();
        }
    },

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

    // Función recursiva para actualizar estado de elementos
    updateElementEstado: function(elementPath, newEstado) {
        try {
            const element = StorageController.findElementByPath(elementPath);
            if (!element) {
                StorageController.notify('Elemento no encontrado', 'error');
                return;
            }
            
            // Guardar estado anterior para feedback
            const estadoAnterior = element.estado;
            const itemName = element.nombre;
            const tipoElemento = element.tipo || (elementPath.length === 1 ? 'Proyecto' : 'Elemento');
            
            // Actualizar el estado
            element.estado = newEstado;
            
            // Si se marca como completado, asignar 100% avance
            if (newEstado === 'Completado') {
                element.avance = '100%';
            }
            
            // Guardar cambios
            StorageController.save();
            
            // Mostrar notificación
            StorageController.notify(
                `${tipoElemento} "${itemName}" cambió de "${estadoAnterior}" a "${newEstado}"`, 
                'success'
            );
            
            // Re-renderizar para actualizar avances generales y estilos
            if (window.renderTable) {
                window.renderTable();
            }
            
            // Actualizar el atributo data-current del select y agregar animación
            setTimeout(() => {
                const pathString = elementPath.join('-');
                const selectElement = document.querySelector(`tr[data-element-path="${pathString}"] select.estado-select`);
                if (selectElement) {
                    selectElement.setAttribute('data-current', newEstado);
                    selectElement.classList.add('estado-changed');
                    setTimeout(() => {
                        selectElement.classList.remove('estado-changed');
                    }, 500);
                }
            }, 100);
            
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            StorageController.notify('Error al actualizar el estado', 'error');
            
            // Revertir el cambio en la UI
            if (window.renderTable) {
                window.renderTable();
            }
        }
    },

    // Mantener compatibilidad con función anterior
    updateEstado: function(type, projectIndex, taskIndex = null, subtaskIndex = null, newEstado) {
        let elementPath = [projectIndex];
        
        if (taskIndex !== null) {
            elementPath.push(taskIndex);
        }
        if (subtaskIndex !== null) {
            elementPath.push(subtaskIndex);
        }
        
        StorageController.updateElementEstado(elementPath, newEstado);
    },

    // Funciones para manejar estados de colapso persistente (por tablero)
    saveCollapsedStates: function() {
        if (!StorageController.currentBoardId) return;
        
        const collapsedStates = {};
        window.proyectosData.forEach((_, index) => {
            const projectRow = document.querySelector(`tr.proyecto-row[data-project-index="${index}"]`);
            if (projectRow && projectRow.classList.contains('proyecto-collapsed')) {
                collapsedStates[index] = true;
            }
        });
        
        try {
            localStorage.setItem(`collapsedStates_${StorageController.currentBoardId}`, JSON.stringify(collapsedStates));
        } catch (error) {
            console.error('Error al guardar estados de colapso:', error);
        }
    },
    
    loadCollapsedStates: function() {
        if (!StorageController.currentBoardId) return;
        
        try {
            const savedStates = localStorage.getItem(`collapsedStates_${StorageController.currentBoardId}`);
            if (savedStates) {
                const collapsedStates = JSON.parse(savedStates);
                Object.keys(collapsedStates).forEach(index => {
                    if (collapsedStates[index] && window.toggleProject) {
                        // Usar setTimeout para asegurar que la tabla esté renderizada
                        setTimeout(() => {
                            window.toggleProject(parseInt(index));
                        }, 10);
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar estados de colapso:', error);
        }
    },
    
    toggleProjectPersistent: function(index) {
        // Ejecutar el toggle
        if (window.toggleProject) {
            window.toggleProject(index);
        }
        
        // Guardar el estado después de un pequeño delay
        setTimeout(() => {
            StorageController.saveCollapsedStates();
        }, 100);
    },

    // Variable para manejar edición
    currentlyEditing: null,

    // === FUNCIONES PARA GESTIÓN DE MÚLTIPLES TABLEROS ===
    
    // Inicializar sistema de tableros
    initializeBoards: function() {
        const boards = StorageController.getAllBoards();
        if (Object.keys(boards).length === 0) {
            // Crear tablero por defecto si no existen tableros
            const defaultBoardId = StorageController.createBoard(StorageController.defaultBoardName);
            StorageController.setCurrentBoard(defaultBoardId);
        } else {
            // Cargar el último tablero usado o el primero disponible
            const lastBoardId = localStorage.getItem('lastUsedBoard');
            if (lastBoardId && boards[lastBoardId]) {
                StorageController.setCurrentBoard(lastBoardId);
            } else {
                const firstBoardId = Object.keys(boards)[0];
                StorageController.setCurrentBoard(firstBoardId);
            }
        }
    },
    
    // Crear nuevo tablero
    createBoard: function(name) {
        if (!name || name.trim() === '') {
            StorageController.notify('El nombre del tablero es requerido', 'error');
            return null;
        }
        
        const cleanName = name.trim();
        if (StorageController.boardExists(cleanName)) {
            StorageController.notify('Ya existe un tablero con ese nombre', 'error');
            return null;
        }
        
        try {
            const boardId = 'board_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const boards = StorageController.getAllBoards();
            
            boards[boardId] = {
                name: cleanName,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('boards', JSON.stringify(boards));
            localStorage.setItem(`boardData_${boardId}`, JSON.stringify([])); // Array vacío inicial
            
            StorageController.notify(`Tablero "${cleanName}" creado correctamente`, 'success');
            return boardId;
        } catch (error) {
            console.error('Error al crear tablero:', error);
            StorageController.notify('Error al crear el tablero', 'error');
            return null;
        }
    },
    
    // Verificar si existe un tablero con ese nombre
    boardExists: function(name) {
        const boards = StorageController.getAllBoards();
        return Object.values(boards).some(board => board.name === name);
    },
    
    // Obtener todos los tableros
    getAllBoards: function() {
        try {
            return JSON.parse(localStorage.getItem('boards') || '{}');
        } catch (error) {
            console.error('Error al obtener tableros:', error);
            return {};
        }
    },
    
    // Obtener tablero actual
    getCurrentBoard: function() {
        if (!StorageController.currentBoardId) return null;
        const boards = StorageController.getAllBoards();
        return boards[StorageController.currentBoardId] || null;
    },
    
    // Establecer tablero actual
    setCurrentBoard: function(boardId) {
        const boards = StorageController.getAllBoards();
        if (!boards[boardId]) {
            StorageController.notify('Tablero no encontrado', 'error');
            return false;
        }
        
        StorageController.currentBoardId = boardId;
        localStorage.setItem('lastUsedBoard', boardId);
        
        // Actualizar timestamp de último acceso
        boards[boardId].lastModified = new Date().toISOString();
        localStorage.setItem('boards', JSON.stringify(boards));
        
        return true;
    },
    
    // Cambiar a otro tablero
    switchBoard: function(boardId) {
        if (StorageController.setCurrentBoard(boardId)) {
            // Cargar datos del nuevo tablero
            const loaded = StorageController.load();
            if (!loaded) {
                window.proyectosData = [];
            }
            
            // Re-renderizar la tabla
            if (window.renderTable) {
                window.renderTable();
            }
            
            // Cargar estados de colapso del nuevo tablero
            StorageController.loadCollapsedStates();
            
            const currentBoard = StorageController.getCurrentBoard();
            StorageController.notify(`Tablero "${currentBoard.name}" activado`, 'success');
            
            // Actualizar interfaz
            StorageController.updateBoardSelector();
        }
    },
    
    // Renombrar tablero
    renameBoard: function(boardId, newName) {
        if (!newName || newName.trim() === '') {
            StorageController.notify('El nombre del tablero es requerido', 'error');
            return false;
        }
        
        const cleanName = newName.trim();
        const boards = StorageController.getAllBoards();
        
        if (!boards[boardId]) {
            StorageController.notify('Tablero no encontrado', 'error');
            return false;
        }
        
        // Verificar si ya existe otro tablero con ese nombre
        const existingBoard = Object.entries(boards).find(([id, board]) => 
            id !== boardId && board.name === cleanName
        );
        
        if (existingBoard) {
            StorageController.notify('Ya existe un tablero con ese nombre', 'error');
            return false;
        }
        
        try {
            const oldName = boards[boardId].name;
            boards[boardId].name = cleanName;
            boards[boardId].lastModified = new Date().toISOString();
            
            localStorage.setItem('boards', JSON.stringify(boards));
            StorageController.notify(`Tablero renombrado de "${oldName}" a "${cleanName}"`, 'success');
            
            // Actualizar interfaz si es el tablero actual
            if (StorageController.currentBoardId === boardId) {
                StorageController.updateBoardSelector();
            }
            
            return true;
        } catch (error) {
            console.error('Error al renombrar tablero:', error);
            StorageController.notify('Error al renombrar el tablero', 'error');
            return false;
        }
    },
    
    // Eliminar tablero
    deleteBoard: function(boardId) {
        const boards = StorageController.getAllBoards();
        if (!boards[boardId]) {
            StorageController.notify('Tablero no encontrado', 'error');
            return false;
        }
        
        // No permitir eliminar el último tablero
        if (Object.keys(boards).length === 1) {
            StorageController.notify('No puedes eliminar el último tablero', 'error');
            return false;
        }
        
        const boardName = boards[boardId].name;
        
        if (!confirm(`¿Estás seguro de que deseas eliminar el tablero "${boardName}"?\n\nEsta acción no se puede deshacer.`)) {
            return false;
        }
        
        try {
            // Eliminar tablero de la lista
            delete boards[boardId];
            localStorage.setItem('boards', JSON.stringify(boards));
            
            // Eliminar datos del tablero
            localStorage.removeItem(`boardData_${boardId}`);
            localStorage.removeItem(`collapsedStates_${boardId}`);
            
            // Si era el tablero actual, cambiar a otro
            if (StorageController.currentBoardId === boardId) {
                const remainingBoardIds = Object.keys(boards);
                if (remainingBoardIds.length > 0) {
                    StorageController.switchBoard(remainingBoardIds[0]);
                }
            }
            
            StorageController.notify(`Tablero "${boardName}" eliminado correctamente`, 'success');
            return true;
        } catch (error) {
            console.error('Error al eliminar tablero:', error);
            StorageController.notify('Error al eliminar el tablero', 'error');
            return false;
        }
    },
    
    // Actualizar selector de tableros en la interfaz (será implementado en el HTML)
    updateBoardSelector: function() {
        const selector = document.getElementById('boardSelector');
        if (!selector) return;
        
        const boards = StorageController.getAllBoards();
        const currentBoard = StorageController.getCurrentBoard();
        
        selector.innerHTML = '';
        
        Object.entries(boards).forEach(([boardId, board]) => {
            const option = document.createElement('option');
            option.value = boardId;
            option.textContent = board.name;
            option.selected = boardId === StorageController.currentBoardId;
            selector.appendChild(option);
        });
        
        // Actualizar título de la página si existe
        const pageTitle = document.getElementById('currentBoardTitle');
        if (pageTitle && currentBoard) {
            pageTitle.textContent = currentBoard.name;
        }
    },

    notify: function(message, type = 'success') {
        const colors = {
            success: { bg: '#48bb78', icon: '✅' },
            error: { bg: '#f56565', icon: '❌' },
            info: { bg: '#4299e1', icon: 'ℹ️' },
            warning: { bg: '#ed8936', icon: '⚠️' }
        };
        
        const config = colors[type] || colors.success;
        const notification = document.createElement('div');
        notification.innerHTML = `${config.icon} ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.bg};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
};

// Exponer el controlador en window para uso global
window.StorageController = StorageController;