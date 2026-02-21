// aiController.js
// Integración básica con OpenAI para comandos en lenguaje natural

const AIController = {
    isOpen: false,
    isSending: false,
    apiKeyStorageKey: 'openai_api_key',
    model: 'gpt-4o-mini',

    initialize: function() {
        this.cacheElements();
        this.bindEvents();
        this.renderWelcome();
    },

    cacheElements: function() {
        this.el = {
            toggle: document.getElementById('aiToggle'),
            panel: document.getElementById('aiPanel'),
            close: document.getElementById('aiCloseBtn'),
            settings: document.getElementById('aiSettingsBtn'),
            keyPanel: document.getElementById('aiKeyPanel'),
            keyInput: document.getElementById('aiApiKeyInput'),
            keySave: document.getElementById('aiSaveKeyBtn'),
            keyClear: document.getElementById('aiClearKeyBtn'),
            messages: document.getElementById('aiMessages'),
            input: document.getElementById('aiInput'),
            send: document.getElementById('aiSendBtn')
        };
    },

    bindEvents: function() {
        if (this.el.toggle) {
            this.el.toggle.addEventListener('click', () => this.togglePanel());
        }
        if (this.el.close) {
            this.el.close.addEventListener('click', () => this.hidePanel());
        }
        if (this.el.settings) {
            this.el.settings.addEventListener('click', () => this.toggleKeyPanel());
        }
        if (this.el.keySave) {
            this.el.keySave.addEventListener('click', () => this.saveApiKey());
        }
        if (this.el.keyClear) {
            this.el.keyClear.addEventListener('click', () => this.clearApiKey());
        }
        if (this.el.send) {
            this.el.send.addEventListener('click', () => this.handleSend());
        }
        if (this.el.input) {
            this.el.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
    },

    renderWelcome: function() {
        if (!this.el.messages) return;
        if (this.el.messages.dataset.hasWelcome) return;
        this.el.messages.dataset.hasWelcome = '1';
        this.addMessage('assistant', 'Hola. Puedo crear, editar o eliminar proyectos, tareas, subtareas y agrupadores. Ejemplos: "Crea un proyecto llamado Marketing", "Agrega una tarea Diseñar banner en el proyecto Marketing", "Elimina la tarea Revisar copia".');
    },

    togglePanel: function() {
        if (this.isOpen) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    },

    showPanel: function() {
        if (!this.el.panel) return;
        this.el.panel.style.display = 'flex';
        this.isOpen = true;
        if (this.el.input) this.el.input.focus();
    },

    hidePanel: function() {
        if (!this.el.panel) return;
        this.el.panel.style.display = 'none';
        this.isOpen = false;
    },

    toggleKeyPanel: function() {
        if (!this.el.keyPanel) return;
        const isVisible = this.el.keyPanel.style.display === 'block';
        this.el.keyPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible && this.el.keyInput) {
            this.el.keyInput.value = this.getApiKey() || '';
            this.el.keyInput.focus();
        }
    },

    getApiKey: function() {
        return localStorage.getItem(this.apiKeyStorageKey) || '';
    },

    saveApiKey: function() {
        const key = (this.el.keyInput?.value || '').trim();
        if (!key) {
            this.addMessage('system', 'La API Key es requerida.');
            return;
        }
        localStorage.setItem(this.apiKeyStorageKey, key);
        this.addMessage('system', 'API Key guardada localmente.');
        if (this.el.keyPanel) this.el.keyPanel.style.display = 'none';
    },

    clearApiKey: function() {
        localStorage.removeItem(this.apiKeyStorageKey);
        if (this.el.keyInput) this.el.keyInput.value = '';
        this.addMessage('system', 'API Key eliminada.');
    },

    handleSend: async function() {
        if (this.isSending) return;
        const text = (this.el.input?.value || '').trim();
        if (!text) return;

        this.addMessage('user', text);
        this.el.input.value = '';

        const apiKey = this.getApiKey();
        if (!apiKey) {
            this.addMessage('assistant', 'Necesitas configurar la API Key para continuar. Pulsa el ícono de la llave.');
            this.toggleKeyPanel();
            return;
        }

        this.isSending = true;
        const typingId = this.addMessage('assistant', 'Procesando...');

        try {
            const response = await this.callOpenAI(apiKey, text);
            let parsed = this.parseAIResponse(response);

            if (!parsed) {
                const repaired = await this.repairJsonWithModel(apiKey, response);
                parsed = repaired ? this.parseAIResponse(repaired) : null;
            }

            if (!parsed) {
                this.updateMessage(typingId, 'No pude interpretar la respuesta del modelo. Intenta de nuevo.');
                return;
            }
            if (parsed.actions && parsed.actions.length) {
                parsed.actions = await this.refineActionsIfNeeded(apiKey, text, parsed.actions);
            }
            const actionResults = await this.executeActions(parsed.actions || []);

            const reply = parsed.reply || 'Listo.';
            const finalText = actionResults.length
                ? reply + '\n\n' + actionResults.join('\n')
                : reply;
            this.updateMessage(typingId, finalText);
        } catch (error) {
            console.error('AI error:', error);
            this.updateMessage(typingId, 'No pude completar la acción. Revisa la API Key o inténtalo de nuevo.');
        } finally {
            this.isSending = false;
        }
    },

    async callOpenAI(apiKey, userText) {
        const context = this.buildContextSnapshot();
        const systemPrompt = this.buildSystemPrompt();

        const payload = {
            model: this.model,
            temperature: 0.2,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Usuario: ${userText}\n\nContexto del tablero (JSON):\n${JSON.stringify(context)}` }
            ]
        };

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'OpenAI error');
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || '';
    },

    buildSystemPrompt: function() {
        return [
            'Eres un asistente para gestionar un tablero de proyectos y tareas.',
            'Responde SOLO con JSON válido sin texto adicional.',
            'Formato JSON:',
            '{"reply":"texto","actions":[{...}]}.',
            'Acciones permitidas:',
            'create_project: {type:"create_project", name, description}',
            'create_element: {type:"create_element", parent:{path:["Proyecto","ElementoPadre"]|project}, name, description, tipo, prioridad, esfuerzo, deadline, estado}',
            'edit_element: {type:"edit_element", target:{path:["Proyecto","Elemento"]|project|name}, fields:{nombre, descripcion, prioridad, esfuerzo, deadline, estado, avance}}',
            'delete_element: {type:"delete_element", target:{path:["Proyecto","Elemento"]|project|name}}',
            'change_estado: {type:"change_estado", target:{path:["Proyecto","Elemento"]|project|name}, estado}',
            'Si falta información, usa valores por defecto (description="", estado="Pendiente") y sigue con actions.',
            'Si el usuario pide "mejora", "más valor", "más entregable" o "reescribe" la descripción, debes proponer una descripción concreta y útil (no repetir la petición literal).',
            'Usa nombres exactos de elementos del contexto.'
        ].join('\n');
    },

    async refineActionsIfNeeded(apiKey, userText, actions) {
        const needsRewrite = (text) => {
            const t = (text || '').toLowerCase();
            return /más\s+valor|entregable|mejora|reescribe|reformular|más\s+concreto/.test(t);
        };

        const looksVague = (text) => {
            const t = (text || '').toLowerCase();
            return /algo\s+m[aá]s|m[aá]s\s+de\s+valor|entregable/.test(t);
        };

        if (!needsRewrite(userText)) {
            return actions;
        }

        const updated = [];
        for (const action of actions) {
            if (action.type !== 'edit_element' || !action.fields) {
                updated.push(action);
                continue;
            }

            const currentDesc = action.fields.descripcion || '';
            if (currentDesc && !looksVague(currentDesc)) {
                updated.push(action);
                continue;
            }

            const targetPath = this.resolvePath(action.target);
            const element = targetPath ? StorageController.findElementByPath(targetPath) : null;
            const elementName = element?.nombre || action.target?.name || '';

            const suggestion = await this.generateDeliverableDescription(apiKey, userText, elementName, element?.descripcion || '');
            if (suggestion) {
                action.fields.descripcion = suggestion;
            }
            updated.push(action);
        }

        return updated;
    },

    async generateDeliverableDescription(apiKey, userText, elementName, currentDescription) {
        const payload = {
            model: this.model,
            temperature: 0.3,
            messages: [
                {
                    role: 'system',
                    content: 'Redacta una descripción breve, concreta y entregable. Devuelve SOLO el texto final.'
                },
                {
                    role: 'user',
                    content: `Solicitud: ${userText}\nElemento: ${elementName}\nDescripción actual: ${currentDescription}`
                }
            ]
        };

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) return '';
        const data = await res.json();
        return (data?.choices?.[0]?.message?.content || '').trim();
    },

    buildContextSnapshot: function() {
        const board = StorageController.getCurrentBoard();
        const elements = StorageController.getAllElementsWithPaths(true).map(entry => {
            const names = this.pathToNames(entry.path);
            return {
                path: names,
                tipo: entry.element.tipo || (entry.path.length === 1 ? 'proyecto' : 'elemento'),
                estado: entry.element.estado || entry.element.estadoProyecto || '',
                descripcion: entry.element.descripcion || ''
            };
        });

        return {
            boardName: board?.name || 'Sin tablero',
            totalElements: elements.length,
            elements: elements.slice(0, 300)
        };
    },

    parseAIResponse: function(content) {
        if (!content) return null;

        try {
            return JSON.parse(content);
        } catch (err) {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (error) {
                    return null;
                }
            }
            return null;
        }
    },

    async repairJsonWithModel(apiKey, rawContent) {
        const payload = {
            model: this.model,
            temperature: 0,
            messages: [
                { role: 'system', content: 'Devuelve SOLO JSON válido sin texto extra.' },
                { role: 'user', content: `Repara a JSON válido este contenido:\n${rawContent}` }
            ]
        };

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    },

    async executeActions(actions) {
        const results = [];
        let needsRender = false;

        for (const action of actions) {
            if (!action || !action.type) continue;

            try {
                switch (action.type) {
                    case 'create_project': {
                        const ok = StorageController.createProject(action.name || '', action.description || '');
                        if (ok) {
                            results.push(`✅ Proyecto "${action.name}" creado.`);
                            needsRender = true;
                        } else {
                            results.push(`⚠️ No pude crear el proyecto "${action.name}".`);
                        }
                        break;
                    }
                    case 'create_element': {
                        const parentPath = this.resolvePath(action.parent);
                        if (!parentPath) {
                            results.push('⚠️ No encontré el elemento padre.');
                            break;
                        }
                        const ok = StorageController.createElement(
                            parentPath,
                            action.name || '',
                            action.description || '',
                            action.prioridad || '',
                            action.esfuerzo || '',
                            action.deadline || '',
                            action.estado || 'Pendiente',
                            action.tipo || 'elemento'
                        );
                        if (ok) {
                            results.push(`✅ Elemento "${action.name}" creado.`);
                            needsRender = true;
                        } else {
                            results.push(`⚠️ No pude crear el elemento "${action.name}".`);
                        }
                        break;
                    }
                    case 'edit_element': {
                        const targetPath = this.resolvePath(action.target);
                        if (!targetPath) {
                            results.push('⚠️ No encontré el elemento a editar.');
                            break;
                        }
                        const element = StorageController.findElementByPath(targetPath);
                        if (!element) {
                            results.push('⚠️ No encontré el elemento a editar.');
                            break;
                        }
                        const fields = action.fields || {};
                        if (fields.estado) {
                            StorageController.updateElementEstado(targetPath, fields.estado);
                            delete fields.estado;
                            needsRender = true;
                        }
                        Object.assign(element, fields);
                        StorageController.save();
                        results.push(`✅ Elemento "${element.nombre}" actualizado.`);
                        needsRender = true;
                        break;
                    }
                    case 'delete_element': {
                        const targetPath = this.resolvePath(action.target);
                        if (!targetPath) {
                            results.push('⚠️ No encontré el elemento a eliminar.');
                            break;
                        }
                        StorageController.deleteElement(targetPath);
                        needsRender = true;
                        results.push('✅ Solicitud de eliminación enviada.');
                        break;
                    }
                    case 'change_estado': {
                        const targetPath = this.resolvePath(action.target);
                        if (!targetPath) {
                            results.push('⚠️ No encontré el elemento para cambiar estado.');
                            break;
                        }
                        StorageController.updateElementEstado(targetPath, action.estado || 'Pendiente');
                        needsRender = true;
                        results.push('✅ Estado actualizado.');
                        break;
                    }
                    default:
                        results.push(`⚠️ Acción no soportada: ${action.type}`);
                        break;
                }
            } catch (error) {
                console.error('Action error:', error);
                results.push('⚠️ Ocurrió un error al ejecutar una acción.');
            }
        }

        if (needsRender && window.RenderController) {
            RenderController.renderTable();
            setTimeout(() => StorageController.loadCollapsedStates(), 50);
        }

        return results;
    },

    resolvePath: function(target) {
        if (!target) return null;

        if (Array.isArray(target)) {
            return this.resolvePathFromArray(target);
        }

        if (Array.isArray(target.path)) {
            return this.resolvePathFromArray(target.path);
        }

        if (target.project) {
            const idx = this.findProjectIndexByName(target.project);
            return idx !== null ? [idx] : null;
        }

        if (target.name) {
            return this.findPathByName(target.name);
        }

        if (typeof target === 'string') {
            return this.findPathByName(target);
        }

        return null;
    },

    resolvePathFromArray: function(pathArray) {
        if (pathArray.length === 0) return null;
        if (typeof pathArray[0] === 'number') {
            return pathArray;
        }

        const names = pathArray.map(n => String(n).trim()).filter(Boolean);
        if (names.length === 0) return null;

        const projectIndex = this.findProjectIndexByName(names[0]);
        if (projectIndex === null) return null;

        let current = window.proyectosData[projectIndex];
        const result = [projectIndex];

        for (let i = 1; i < names.length; i++) {
            if (!current || !Array.isArray(current.elementos)) return null;
            const childIndex = this.findChildIndexByName(current.elementos, names[i]);
            if (childIndex === null) return null;
            result.push(childIndex);
            current = current.elementos[childIndex];
        }

        return result;
    },

    findProjectIndexByName: function(name) {
        const normalized = String(name || '').trim().toLowerCase();
        if (!normalized) return null;

        const matches = window.proyectosData
            .map((p, idx) => ({ idx, name: (p.nombre || '').trim().toLowerCase() }))
            .filter(p => p.name === normalized);

        if (matches.length === 1) return matches[0].idx;
        return null;
    },

    findChildIndexByName: function(children, name) {
        const normalized = String(name || '').trim().toLowerCase();
        if (!normalized) return null;
        const matches = children
            .map((c, idx) => ({ idx, name: (c.nombre || '').trim().toLowerCase() }))
            .filter(c => c.name === normalized);
        if (matches.length === 1) return matches[0].idx;
        return null;
    },

    findPathByName: function(name) {
        const normalized = String(name || '').trim().toLowerCase();
        if (!normalized) return null;

        let foundPath = null;
        const walk = (elements, pathBase) => {
            elements.forEach((el, idx) => {
                if (foundPath) return;
                const currentPath = [...pathBase, idx];
                if ((el.nombre || '').trim().toLowerCase() === normalized) {
                    foundPath = currentPath;
                    return;
                }
                if (Array.isArray(el.elementos)) {
                    walk(el.elementos, currentPath);
                }
            });
        };

        window.proyectosData.forEach((project, pIdx) => {
            if (foundPath) return;
            if ((project.nombre || '').trim().toLowerCase() === normalized) {
                foundPath = [pIdx];
                return;
            }
            if (Array.isArray(project.elementos)) {
                walk(project.elementos, [pIdx]);
            }
        });

        return foundPath;
    },

    pathToNames: function(path) {
        if (!Array.isArray(path) || path.length === 0) return [];
        const names = [];
        let current = window.proyectosData[path[0]];
        if (!current) return names;
        names.push(current.nombre || '');
        for (let i = 1; i < path.length; i++) {
            if (!current.elementos || !current.elementos[path[i]]) break;
            current = current.elementos[path[i]];
            names.push(current.nombre || '');
        }
        return names;
    },

    addMessage: function(role, text) {
        if (!this.el.messages) return null;
        const msg = document.createElement('div');
        msg.className = `ai-msg ai-msg--${role}`;
        msg.textContent = text;
        msg.dataset.msgId = Math.random().toString(36).slice(2);
        this.el.messages.appendChild(msg);
        this.el.messages.scrollTop = this.el.messages.scrollHeight;
        return msg.dataset.msgId;
    },

    updateMessage: function(msgId, text) {
        if (!this.el.messages) return;
        const msg = this.el.messages.querySelector(`[data-msg-id="${msgId}"]`);
        if (msg) {
            msg.textContent = text;
            this.el.messages.scrollTop = this.el.messages.scrollHeight;
        }
    }
};

window.AIController = AIController;
