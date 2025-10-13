// formController.js
// Controlador para gestión de formularios de creación

const FormController = {
    // Referencias a elementos del DOM
    modal: null,
    forms: {},
    selects: {},
    
    // Inicializar el controlador
    init: function() {
        FormController.modal = document.getElementById('createModal');
        FormController.setupFormReferences();
        FormController.setupEventListeners();
        FormController.populateProjectSelects();
    },
    
    // Configurar referencias a elementos del DOM
    setupFormReferences: function() {
        FormController.forms = {
            project: document.getElementById('projectForm'),
            task: document.getElementById('taskForm'),
            subtask: document.getElementById('subtaskForm')
        };
        
        FormController.selects = {
            taskProject: document.getElementById('taskProjectSelect'),
            subtaskProject: document.getElementById('subtaskProjectSelect'),
            subtaskTask: document.getElementById('subtaskTaskSelect')
        };
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Botón de envío
        document.getElementById('createSubmitBtn').addEventListener('click', FormController.handleSubmit);
        
        // Cambio en selector de proyecto para subtareas
        FormController.selects.subtaskProject.addEventListener('change', FormController.updateTaskSelect);
        
        // Limpiar formularios cuando se abre el modal
        FormController.modal.addEventListener('show.bs.modal', FormController.onModalShow);
        
        // Validación en tiempo real
        FormController.setupFormValidation();
    },
    
    // Configurar validación de formularios
    setupFormValidation: function() {
        const requiredFields = [
            'projectName', 'taskProjectSelect', 'taskName',
            'subtaskProjectSelect', 'subtaskTaskSelect', 'subtaskName'
        ];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', FormController.validateCurrentForm);
                field.addEventListener('change', FormController.validateCurrentForm);
            }
        });
    },
    
    // Cuando se muestra el modal
    onModalShow: function() {
        FormController.clearAllForms();
        FormController.populateProjectSelects();
        FormController.focusFirstField();
    },
    
    // Enfocar primer campo del tab activo
    focusFirstField: function() {
        const activeTab = document.querySelector('#createTabs .nav-link.active');
        if (activeTab) {
            const tabId = activeTab.getAttribute('data-bs-target');
            const firstInput = document.querySelector(`${tabId} input, ${tabId} select`);
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },
    
    // Poblar selectores de proyectos
    populateProjectSelects: function() {
        const taskSelect = FormController.selects.taskProject;
        const subtaskSelect = FormController.selects.subtaskProject;
        
        // Limpiar opciones existentes
        taskSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
        subtaskSelect.innerHTML = '<option value="">Seleccionar proyecto...</option>';
        
        // Añadir proyectos
        if (window.proyectosData) {
            window.proyectosData.forEach((proyecto, index) => {
                const option1 = new Option(proyecto.nombre, index);
                const option2 = new Option(proyecto.nombre, index);
                
                taskSelect.appendChild(option1);
                subtaskSelect.appendChild(option2);
            });
        }
    },
    
    // Actualizar selector de tareas
    updateTaskSelect: function() {
        const projectIndex = FormController.selects.subtaskProject.value;
        const taskSelect = FormController.selects.subtaskTask;
        
        taskSelect.innerHTML = '<option value="">Seleccionar tarea...</option>';
        taskSelect.disabled = projectIndex === '';
        
        if (projectIndex !== '' && window.proyectosData && window.proyectosData[projectIndex]) {
            window.proyectosData[projectIndex].tareas.forEach((tarea, index) => {
                const option = new Option(tarea.nombre, index);
                taskSelect.appendChild(option);
            });
            taskSelect.disabled = false;
        }
        
        FormController.validateCurrentForm();
    },
    
    // Validar formulario actual
    validateCurrentForm: function() {
        const activeTab = document.querySelector('#createTabs .nav-link.active');
        if (!activeTab) return;
        
        const tabId = activeTab.getAttribute('data-bs-target').substring(1); // remover #
        const submitBtn = document.getElementById('createSubmitBtn');
        let isValid = true;
        
        // Validar según el tab activo
        switch (tabId) {
            case 'project-pane':
                isValid = FormController.validateProjectForm();
                break;
            case 'task-pane':
                isValid = FormController.validateTaskForm();
                break;
            case 'subtask-pane':
                isValid = FormController.validateSubtaskForm();
                break;
        }
        
        // Actualizar botón de envío
        submitBtn.disabled = !isValid;
        submitBtn.className = isValid ? 
            'btn btn-success' : 
            'btn btn-secondary disabled';
    },
    
    // Validar formulario de proyecto
    validateProjectForm: function() {
        const nombre = document.getElementById('projectName').value.trim();
        return nombre.length > 0;
    },
    
    // Validar formulario de tarea
    validateTaskForm: function() {
        const projectIndex = document.getElementById('taskProjectSelect').value;
        const nombre = document.getElementById('taskName').value.trim();
        return projectIndex !== '' && nombre.length > 0;
    },
    
    // Validar formulario de subtarea
    validateSubtaskForm: function() {
        const projectIndex = document.getElementById('subtaskProjectSelect').value;
        const taskIndex = document.getElementById('subtaskTaskSelect').value;
        const nombre = document.getElementById('subtaskName').value.trim();
        return projectIndex !== '' && taskIndex !== '' && nombre.length > 0;
    },
    
    // Manejar envío de formulario
    handleSubmit: function() {
        const activeTab = document.querySelector('#createTabs .nav-link.active');
        if (!activeTab) return;
        
        const tabId = activeTab.getAttribute('data-bs-target').substring(1); // remover #
        
        switch (tabId) {
            case 'project-pane':
                FormController.createProject();
                break;
            case 'task-pane':
                FormController.createTask();
                break;
            case 'subtask-pane':
                FormController.createSubtask();
                break;
        }
    },
    
    // Crear proyecto
    createProject: function() {
        const nombre = document.getElementById('projectName').value.trim();
        const descripcion = document.getElementById('projectDescription').value.trim();
        
        if (window.StorageController && window.StorageController.createProject(nombre, descripcion)) {
            FormController.closeModal();
            // Notificar al componente padre que actualice la tabla
            if (window.renderTable) window.renderTable();
        }
    },
    
    // Crear tarea
    createTask: function() {
        const projectIndex = parseInt(document.getElementById('taskProjectSelect').value);
        const nombre = document.getElementById('taskName').value.trim();
        const descripcion = document.getElementById('taskDescription').value.trim();
        const prioridad = document.getElementById('taskPriority').value;
        const esfuerzo = document.getElementById('taskEffort').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        
        if (window.StorageController && 
            window.StorageController.createTask(projectIndex, nombre, descripcion, prioridad, esfuerzo, deadline)) {
            FormController.closeModal();
            // Notificar al componente padre que actualice la tabla
            if (window.renderTable) window.renderTable();
        }
    },
    
    // Crear subtarea
    createSubtask: function() {
        const projectIndex = parseInt(document.getElementById('subtaskProjectSelect').value);
        const taskIndex = parseInt(document.getElementById('subtaskTaskSelect').value);
        const nombre = document.getElementById('subtaskName').value.trim();
        const descripcion = document.getElementById('subtaskDescription').value.trim();
        const prioridad = document.getElementById('subtaskPriority').value;
        const esfuerzo = document.getElementById('subtaskEffort').value.trim();
        const deadline = document.getElementById('subtaskDeadline').value;
        
        if (window.StorageController && 
            window.StorageController.createSubtask(projectIndex, taskIndex, nombre, descripcion, prioridad, esfuerzo, deadline)) {
            FormController.closeModal();
            // Notificar al componente padre que actualice la tabla
            if (window.renderTable) window.renderTable();
        }
    },
    
    // Cerrar modal
    closeModal: function() {
        const modal = bootstrap.Modal.getInstance(FormController.modal);
        if (modal) {
            modal.hide();
        }
    },
    
    // Limpiar todos los formularios
    clearAllForms: function() {
        // Limpiar formulario de proyecto
        document.getElementById('projectName').value = '';
        document.getElementById('projectDescription').value = '';
        
        // Limpiar formulario de tarea
        document.getElementById('taskProjectSelect').value = '';
        document.getElementById('taskName').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskEffort').value = '';
        document.getElementById('taskDeadline').value = '';
        
        // Limpiar formulario de subtarea
        document.getElementById('subtaskProjectSelect').value = '';
        document.getElementById('subtaskTaskSelect').value = '';
        document.getElementById('subtaskTaskSelect').disabled = true;
        document.getElementById('subtaskName').value = '';
        document.getElementById('subtaskDescription').value = '';
        document.getElementById('subtaskPriority').value = '';
        document.getElementById('subtaskEffort').value = '';
        document.getElementById('subtaskDeadline').value = '';
        
        // Reinicializar botón
        const submitBtn = document.getElementById('createSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.className = 'btn btn-secondary disabled';
        
        // Remover clases de validación
        const forms = document.querySelectorAll('#createModal form');
        forms.forEach(form => {
            form.classList.remove('was-validated');
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        });
    },
    
    // Abrir modal en un tab específico
    openModal: function(tabId = 'project') {
        // Mostrar modal
        const modal = new bootstrap.Modal(FormController.modal);
        modal.show();
        
        // Cambiar a tab específico
        const tabButton = document.getElementById(`${tabId}-tab`);
        if (tabButton) {
            const tab = new bootstrap.Tab(tabButton);
            tab.show();
        }
    }
};

// Exponer el controlador globalmente
window.FormController = FormController;