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