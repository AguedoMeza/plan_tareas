// storageController.js
// Controlador para gestión de storage de proyectos

const StorageController = {
    save: function() {
        try {
            localStorage.setItem('proyectosData', JSON.stringify(window.proyectosData));
            StorageController.notify('Proyectos guardados correctamente', 'success');
        } catch (error) {
            console.error('Error al guardar proyectos:', error);
            StorageController.notify('Error al guardar proyectos', 'error');
        }
    },
    
    load: function() {
        try {
            const savedProjects = localStorage.getItem('proyectosData');
            if (savedProjects) {
                window.proyectosData = JSON.parse(savedProjects);
                StorageController.notify('Proyectos cargados desde el almacenamiento local', 'info');
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
            recuento: 0,
            tareas: []
        };
        
        window.proyectosData.push(nuevoProyecto);
        StorageController.save();
        StorageController.notify(`Proyecto "${nombre}" creado exitosamente`, 'success');
        return true;
    },
    
    createTask: function(projectIndex, nombre, descripcion = '', prioridad = '', esfuerzo = '', deadline = '', estado = 'Pendiente') {
        if (!nombre || nombre.trim() === '' || projectIndex < 0 || projectIndex >= window.proyectosData.length) {
            StorageController.notify('Datos de tarea inválidos', 'error');
            return false;
        }
        
        const nuevaTarea = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            prioridad: prioridad,
            avance: '',
            esfuerzo: esfuerzo.trim(),
            deadline: deadline.trim(),
            estado: estado
        };
        
        window.proyectosData[projectIndex].tareas.push(nuevaTarea);
        window.proyectosData[projectIndex].recuento = window.proyectosData[projectIndex].tareas.length;
        StorageController.save();
        StorageController.notify(`Tarea "${nombre}" añadida al proyecto`, 'success');
        return true;
    },
    
    createSubtask: function(projectIndex, taskIndex, nombre, descripcion = '', prioridad = '', esfuerzo = '', deadline = '', estado = 'Pendiente') {
        if (!nombre || nombre.trim() === '' || projectIndex < 0 || taskIndex < 0 || 
            projectIndex >= window.proyectosData.length || 
            taskIndex >= window.proyectosData[projectIndex].tareas.length) {
            StorageController.notify('Datos de subtarea inválidos', 'error');
            return false;
        }
        
        const nuevaSubtarea = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            prioridad: prioridad,
            avance: '',
            esfuerzo: esfuerzo.trim(),
            deadline: deadline.trim(),
            estado: estado
        };
        
        // Si la tarea no tiene subtareas, inicializar el array
        if (!Array.isArray(window.proyectosData[projectIndex].tareas[taskIndex].subtareas)) {
            window.proyectosData[projectIndex].tareas[taskIndex].subtareas = [];
        }
        
        window.proyectosData[projectIndex].tareas[taskIndex].subtareas.push(nuevaSubtarea);
        StorageController.save();
        StorageController.notify(`Subtarea "${nombre}" añadida`, 'success');
        return true;
    },
    
    // Funciones para editar y eliminar elementos
    editRow: function(type, projectIndex, taskIndex = null, subtaskIndex = null) {
        // Cancelar edición actual si existe
        if (StorageController.currentlyEditing) {
            StorageController.cancelEdit();
        }

        let row;
        let data;
        
        // Encontrar la fila y los datos según el tipo
        if (type === 'project') {
            row = document.querySelector(`tr.proyecto-row[data-project-index="${projectIndex}"]`);
            data = window.proyectosData[projectIndex];
        } else if (type === 'task') {
            row = document.querySelector(`tr.tarea-row[data-project-index="${projectIndex}"][data-task-index="${taskIndex}"]`);
            data = window.proyectosData[projectIndex].tareas[taskIndex];
        } else if (type === 'subtask') {
            row = document.querySelector(`tr.subtarea-row[data-project-index="${projectIndex}"][data-task-index="${taskIndex}"][data-subtask-index="${subtaskIndex}"]`);
            data = window.proyectosData[projectIndex].tareas[taskIndex].subtareas[subtaskIndex];
        }
        
        if (!row || !data) return;

        // Marcar como editando
        StorageController.currentlyEditing = { type, projectIndex, taskIndex, subtaskIndex, row, originalData: {...data} };
        row.classList.add('editing-mode');
        
        // Convertir celdas editables
        const editableCells = row.querySelectorAll('[data-field]');
        editableCells.forEach(cell => {
            const field = cell.getAttribute('data-field');
            let currentValue = '';
            
            // Obtener valor actual
            if (field === 'nombre') {
                if (type === 'project') {
                    currentValue = data.nombre;
                } else if (type === 'task') {
                    currentValue = data.nombre;
                    cell.innerHTML = `<strong><input type="text" class="form-control form-control-sm edit-input" value="${StorageController.escapeHtml(currentValue)}" data-field="nombre"></strong>`;
                    return;
                } else {
                    currentValue = data.nombre;
                    cell.innerHTML = `📄 <input type="text" class="form-control form-control-sm edit-input d-inline" style="width: calc(100% - 30px);" value="${StorageController.escapeHtml(currentValue)}" data-field="nombre">`;
                    return;
                }
            } else if (field === 'descripcion') {
                currentValue = data.descripcion || '';
            } else if (field === 'prioridad') {
                currentValue = data.prioridad || '';
                cell.innerHTML = `
                    <select class="form-select form-select-sm edit-input" data-field="prioridad">
                        <option value="">Sin prioridad</option>
                        <option value="1" ${currentValue == '1' ? 'selected' : ''}>1 - Alta</option>
                        <option value="2" ${currentValue == '2' ? 'selected' : ''}>2 - Media</option>
                        <option value="3" ${currentValue == '3' ? 'selected' : ''}>3 - Baja</option>
                    </select>
                `;
                return;
            } else if (field === 'avance') {
                // Para avance, mostrar el valor real (no el calculado)
                currentValue = data.avance || '';
            } else if (field === 'esfuerzo') {
                currentValue = data.esfuerzo || '';
            } else if (field === 'deadline') {
                currentValue = data.deadline || '';
                cell.innerHTML = `<input type="date" class="form-control form-control-sm edit-input" value="${StorageController.escapeHtml(currentValue)}" data-field="deadline">`;
                return;
            } else if (field === 'estado') {
                currentValue = data.estado || 'Pendiente';
                cell.innerHTML = `
                    <select class="form-select form-select-sm edit-input" data-field="estado">
                        <option value="Pendiente" ${currentValue === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En progreso" ${currentValue === 'En progreso' ? 'selected' : ''}>En progreso</option>
                        <option value="Completado" ${currentValue === 'Completado' ? 'selected' : ''}>Completado</option>
                    </select>
                `;
                return;
            }
            
            // Input de texto por defecto
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
        
        const { type, projectIndex, taskIndex, subtaskIndex, row } = StorageController.currentlyEditing;
        const inputs = row.querySelectorAll('.edit-input');
        const newData = {};
        
        // Recopilar nuevos valores
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            let value = input.value.trim();
            
            // Para campos numéricos como prioridad, mantener como string o convertir apropiadamente
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

        // Actualizar datos
        try {
            if (type === 'project') {
                Object.assign(window.proyectosData[projectIndex], newData);
            } else if (type === 'task') {
                Object.assign(window.proyectosData[projectIndex].tareas[taskIndex], newData);
            } else if (type === 'subtask') {
                Object.assign(window.proyectosData[projectIndex].tareas[taskIndex].subtareas[subtaskIndex], newData);
            }
            
            // Guardar cambios
            StorageController.save();
            StorageController.notify(`${type === 'project' ? 'Proyecto' : type === 'task' ? 'Tarea' : 'Subtarea'} "${newData.nombre}" actualizado correctamente`, 'success');
            
            // Re-renderizar tabla
            if (window.renderTable) {
                window.renderTable();
            }
            
            // Limpiar estado de edición
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

    deleteRow: function(type, projectIndex, taskIndex = null, subtaskIndex = null) {
        let itemName = '';
        let confirmMessage = '';
        
        // Determinar qué se va a eliminar
        if (type === 'project') {
            itemName = window.proyectosData[projectIndex].nombre;
            confirmMessage = `¿Estás seguro de que deseas eliminar el proyecto "${itemName}" y todas sus tareas?`;
        } else if (type === 'task') {
            itemName = window.proyectosData[projectIndex].tareas[taskIndex].nombre;
            confirmMessage = `¿Estás seguro de que deseas eliminar la tarea "${itemName}"${window.proyectosData[projectIndex].tareas[taskIndex].subtareas ? ' y todas sus subtareas' : ''}?`;
        } else if (type === 'subtask') {
            itemName = window.proyectosData[projectIndex].tareas[taskIndex].subtareas[subtaskIndex].nombre;
            confirmMessage = `¿Estás seguro de que deseas eliminar la subtarea "${itemName}"?`;
        }
        
        // Mostrar confirmación
        if (confirm(confirmMessage)) {
            try {
                if (type === 'project') {
                    window.proyectosData.splice(projectIndex, 1);
                } else if (type === 'task') {
                    window.proyectosData[projectIndex].tareas.splice(taskIndex, 1);
                    window.proyectosData[projectIndex].recuento = window.proyectosData[projectIndex].tareas.length;
                } else if (type === 'subtask') {
                    window.proyectosData[projectIndex].tareas[taskIndex].subtareas.splice(subtaskIndex, 1);
                    // Si no quedan subtareas, eliminar el array
                    if (window.proyectosData[projectIndex].tareas[taskIndex].subtareas.length === 0) {
                        delete window.proyectosData[projectIndex].tareas[taskIndex].subtareas;
                    }
                }
                
                // Guardar cambios
                StorageController.save();
                StorageController.notify(`${type === 'project' ? 'Proyecto' : type === 'task' ? 'Tarea' : 'Subtarea'} "${itemName}" eliminado correctamente`, 'success');
                
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

    // Variable para manejar edición
    currentlyEditing: null,

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