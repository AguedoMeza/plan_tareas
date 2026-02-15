// app.js
// Punto de entrada de la aplicación - inicialización y funciones globales

const App = {
    
    /**
     * Inicializa la aplicación al cargar la página.
     * Orden: tableros → datos → migración → limpieza → renderizado → colapsos
     */
    initialize: function() {
        BoardController.initializeBoards();
        
        const dataLoaded = StorageController.load();
        if (!dataLoaded) {
            window.proyectosData = [];
        }
        
        // Migrar datos antiguos si es necesario
        DataController.migrateOldData();
        
        // Limpiar datos corruptos antes de renderizar
        DataController.cleanupCorruptedData();
        
        // Renderizar y restaurar estado visual
        RenderController.renderTable();
        StorageController.loadCollapsedStates();

        // Inicializar tooltips de Bootstrap
        App.initializeTooltips();
    },

    initializeTooltips: function() {
        if (typeof bootstrap === 'undefined' || !document) return;

        // Convertir title -> data-bs-title para evitar tooltip nativo del navegador
        document.querySelectorAll('[title], [data-bs-title]').forEach(el => {
            const titleText = el.getAttribute('title');
            if (titleText) {
                el.setAttribute('data-bs-title', titleText);
                el.removeAttribute('title');
            }
            if (!el.getAttribute('data-bs-toggle')) {
                el.setAttribute('data-bs-toggle', 'tooltip');
            }
            if (!el.getAttribute('data-bs-placement')) {
                el.setAttribute('data-bs-placement', 'top');
            }
        });

        // Instanciar tooltips
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            const existing = bootstrap.Tooltip.getInstance(el);
            if (existing) {
                existing.dispose();
            }

            const tooltip = new bootstrap.Tooltip(el, {
                trigger: 'hover',
                container: 'body'
            });

            // Evitar que el tooltip quede visible por foco tras click
            if (!el.dataset.tooltipClickBound) {
                el.addEventListener('click', () => {
                    tooltip.hide();
                    if (typeof el.blur === 'function') {
                        el.blur();
                    }
                });
                el.dataset.tooltipClickBound = '1';
            }
        });
    },

    updateTooltipText: function(element, newText) {
        if (!element || typeof bootstrap === 'undefined') return;

        if (newText) {
            element.setAttribute('data-bs-title', newText);
        }
        element.removeAttribute('title');

        const instance = bootstrap.Tooltip.getInstance(element);
        if (instance) {
            instance.dispose();
        }

        new bootstrap.Tooltip(element, {
            trigger: 'hover',
            container: 'body'
        });
    },

    /**
     * Abre el modal de creación cargando el HTML del formulario si es necesario.
     * @param {string} tabId - Tab a abrir por defecto ('project', 'task', 'subtask')
     */
    openCreateModal: async function(tabId = 'project') {
        try {
            const modalContainer = document.getElementById('modalContainer');
            if (!modalContainer.innerHTML.trim()) {
                const response = await fetch('create-forms.html');
                const html = await response.text();
                modalContainer.innerHTML = html;
                
                if (window.FormController) {
                    window.FormController.init();
                }
            }
            
            if (window.FormController) {
                window.FormController.openModal(tabId);
            }
        } catch (error) {
            console.error('Error al cargar el modal:', error);
            StorageController.notify('Error al cargar el formulario de creación', 'error');
        }
    }
};

// Exponer globalmente
window.App = App;

// Compatibilidad con funciones globales usadas en onclick del HTML
window.openCreateModal = App.openCreateModal;
window.cambiarVista = VistaVivaController.cambiarVista.bind(VistaVivaController);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', App.initialize);

// Restaurar vista preferida del usuario
VistaVivaController.initializeVistaPreferida();
