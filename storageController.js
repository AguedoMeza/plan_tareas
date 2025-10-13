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