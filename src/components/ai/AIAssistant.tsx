// src/components/ai/AIAssistant.tsx
// Floating AI assistant panel - migrated from aiController.js

import { useState, useRef, useCallback, useEffect } from 'react';
import { Bot, X, Settings, Send, Key, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { flattenTree } from '@/lib/dataUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AIResponse, AIAction, EstadoElemento } from '@/types';

const API_KEY_STORAGE = 'openai_api_key';
const MODEL = 'gpt-4o-mini';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

function buildSystemPrompt(): string {
  return [
    'Eres un asistente para gestionar un tablero de proyectos y tareas.',
    'Responde SOLO con JSON válido sin texto adicional.',
    'Formato JSON: {"reply":"texto","actions":[{...}]}.',
    'Acciones permitidas:',
    'create_project: {type:"create_project", name, description}',
    'create_element: {type:"create_element", parent:{path:["Proyecto","ElementoPadre"]}, name, description, tipo, prioridad, esfuerzo, deadline, estado}',
    'edit_element: {type:"edit_element", target:{path:["Proyecto","Elemento"]}, fields:{nombre, descripcion, prioridad, esfuerzo, deadline, estado, avance}}',
    'delete_element: {type:"delete_element", target:{path:["Proyecto","Elemento"]}}',
    'change_estado: {type:"change_estado", target:{path:["Proyecto","Elemento"]}, estado}',
    'Si falta información, usa valores por defecto (description="", estado="Pendiente").',
    'Usa nombres exactos de elementos del contexto.',
  ].join('\n');
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [apiKeyInput, setApiKeyInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const proyectos = useAppStore(s => s.proyectos);
  const boards = useAppStore(s => s.boards);
  const activeBoardId = useAppStore(s => s.activeBoardId);
  const addProject = useAppStore(s => s.addProject);
  const addElement = useAppStore(s => s.addElement);
  const updateElement = useAppStore(s => s.updateElement);
  const deleteElement = useAppStore(s => s.deleteElement);
  const setElementEstado = useAppStore(s => s.setElementEstado);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMsg('assistant', 'Hola. Puedo crear, editar o eliminar proyectos y tareas. Ejemplo: "Crea un proyecto llamado Marketing" o "Agrega una tarea Diseñar banner en Marketing".');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function addMsg(role: Message['role'], text: string): string {
    const id = Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { id, role, text }]);
    return id;
  }

  function updateMsg(id: string, text: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m));
  }

  // Build context snapshot
  function buildContext() {
    const board = boards[activeBoardId];
    const elements = flattenTree(proyectos, true).map(({ element, path, level }) => ({
      path: pathToNames(path),
      tipo: level === 0 ? 'proyecto' : 'elemento',
      estado: (element as { estado?: string; estadoProyecto?: string }).estado ||
              (element as { estadoProyecto?: string }).estadoProyecto || '',
      descripcion: (element as { descripcion?: string }).descripcion || '',
    }));
    return { boardName: board?.name || 'Sin tablero', totalElements: elements.length, elements: elements.slice(0, 300) };
  }

  function pathToNames(path: number[]): string[] {
    const names: string[] = [];
    type Walkable = { nombre?: string; elementos?: Walkable[] };
    let current: Walkable = proyectos[path[0]] as Walkable;
    if (!current) return names;
    names.push(current.nombre || '');
    for (let i = 1; i < path.length; i++) {
      const hijos = current.elementos;
      if (!hijos || !hijos[path[i]]) break;
      current = hijos[path[i]];
      names.push(current.nombre || '');
    }
    return names;
  }

  function resolvePath(target: AIAction['target'] | AIAction['parent']): number[] | null {
    if (!target) return null;
    if (typeof target === 'string') return findPathByName(target);
    if ('path' in target && Array.isArray((target as { path: unknown[] }).path)) {
      const p = (target as { path: string[] }).path;
      return resolvePathFromNames(p);
    }
    if ('name' in target) return findPathByName((target as { name: string }).name);
    if ('project' in target) {
      const idx = findProjectByName((target as { project: string }).project);
      return idx !== null ? [idx] : null;
    }
    return null;
  }

  function resolvePathFromNames(names: string[]): number[] | null {
    if (names.length === 0) return null;
    const pIdx = findProjectByName(names[0]);
    if (pIdx === null) return null;
    const result = [pIdx];
    type Walkable = { nombre?: string; elementos?: Walkable[] };
    let current: Walkable = proyectos[pIdx] as Walkable;
    for (let i = 1; i < names.length; i++) {
      const hijos = current.elementos;
      if (!hijos) return null;
      const cIdx = hijos.findIndex(h => (h.nombre || '').toLowerCase() === names[i].toLowerCase());
      if (cIdx === -1) return null;
      result.push(cIdx);
      current = hijos[cIdx];
    }
    return result;
  }

  function findProjectByName(name: string): number | null {
    const n = name.trim().toLowerCase();
    const idx = proyectos.findIndex(p => p.nombre.trim().toLowerCase() === n);
    return idx !== -1 ? idx : null;
  }

  function findPathByName(name: string): number[] | null {
    const n = name.trim().toLowerCase();
    let found: number[] | null = null;
    type Walkable = { nombre?: string; elementos?: Walkable[] };
    function walk(elements: Walkable[], base: number[]) {
      elements.forEach((el, idx) => {
        if (found) return;
        const cur = [...base, idx];
        if ((el.nombre || '').trim().toLowerCase() === n) { found = cur; return; }
        if (Array.isArray(el.elementos)) walk(el.elementos, cur);
      });
    }
    proyectos.forEach((p, pIdx) => {
      if (found) return;
      if (p.nombre.trim().toLowerCase() === n) { found = [pIdx]; return; }
      if (Array.isArray(p.elementos)) walk(p.elementos as Walkable[], [pIdx]);
    });
    return found;
  }

  async function callOpenAI(text: string): Promise<string> {
    const context = buildContext();
    const payload = {
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: `Usuario: ${text}\n\nContexto (JSON):\n${JSON.stringify(context)}` },
      ],
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  function parseResponse(content: string): AIResponse | null {
    try { return JSON.parse(content); } catch {}
    const match = content.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    return null;
  }

  async function executeActions(actions: AIAction[]): Promise<string[]> {
    const results: string[] = [];
    for (const action of actions) {
      if (!action?.type) continue;
      try {
        switch (action.type) {
          case 'create_project': {
            const ok = addProject(action.name || '', action.description || '');
            results.push(ok ? `✅ Proyecto "${action.name}" creado.` : `⚠️ No pude crear el proyecto.`);
            break;
          }
          case 'create_element': {
            const parentPath = resolvePath(action.parent);
            if (!parentPath) { results.push('⚠️ No encontré el elemento padre.'); break; }
            const ok = addElement(parentPath, action.name || '', {
              descripcion: action.description || '',
              prioridad: action.prioridad || '',
              esfuerzo: action.esfuerzo || '',
              deadline: action.deadline || '',
              estado: (action.estado || 'Pendiente') as EstadoElemento,
              tipo: action.tipo || 'elemento',
            });
            results.push(ok ? `✅ Elemento "${action.name}" creado.` : `⚠️ No pude crear el elemento.`);
            break;
          }
          case 'edit_element': {
            const path = resolvePath(action.target);
            if (!path) { results.push('⚠️ No encontré el elemento.'); break; }
            if (action.fields?.estado) {
              setElementEstado(path, action.fields.estado as EstadoElemento);
              const fields = { ...action.fields };
              delete fields.estado;
              if (Object.keys(fields).length) updateElement(path, fields);
            } else if (action.fields) {
              updateElement(path, action.fields);
            }
            results.push('✅ Elemento actualizado.');
            break;
          }
          case 'delete_element': {
            const path = resolvePath(action.target);
            if (!path) { results.push('⚠️ No encontré el elemento.'); break; }
            deleteElement(path);
            results.push('✅ Elemento eliminado.');
            break;
          }
          case 'change_estado': {
            const path = resolvePath(action.target);
            if (!path) { results.push('⚠️ No encontré el elemento.'); break; }
            setElementEstado(path, (action.estado || 'Pendiente') as EstadoElemento);
            results.push('✅ Estado actualizado.');
            break;
          }
          default:
            results.push(`⚠️ Acción no soportada: ${action.type}`);
        }
      } catch {
        results.push('⚠️ Error al ejecutar acción.');
      }
    }
    return results;
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    addMsg('user', text);

    if (!apiKey) {
      addMsg('assistant', 'Necesitas configurar la API Key. Pulsa el ícono de llave.');
      setSettingsOpen(true);
      return;
    }

    setIsSending(true);
    const typingId = addMsg('assistant', 'Procesando...');

    try {
      const raw = await callOpenAI(text);
      const parsed = parseResponse(raw);
      if (!parsed) {
        updateMsg(typingId, 'No pude interpretar la respuesta. Intenta de nuevo.');
        return;
      }
      const actionResults = await executeActions(parsed.actions || []);
      const reply = parsed.reply || 'Listo.';
      updateMsg(typingId, actionResults.length ? reply + '\n\n' + actionResults.join('\n') : reply);
    } catch {
      updateMsg(typingId, 'No pude completar la acción. Revisa la API Key o inténtalo de nuevo.');
    } finally {
      setIsSending(false);
    }
  }, [input, apiKey, isSending]);

  const saveApiKey = () => {
    const k = apiKeyInput.trim();
    if (!k) return;
    localStorage.setItem(API_KEY_STORAGE, k);
    setApiKey(k);
    setApiKeyInput('');
    setSettingsOpen(false);
    addMsg('system', 'API Key guardada.');
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setApiKeyInput('');
    addMsg('system', 'API Key eliminada.');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className={cn(
          'fixed bottom-5 right-5 z-30 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all',
          open ? 'bg-muted' : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        onClick={() => setOpen(v => !v)}
        title="Asistente IA"
      >
        <Bot className="h-5 w-5" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-30 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/20">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium flex-1">Asistente IA</span>
            <button
              onClick={() => setSettingsOpen(v => !v)}
              className="text-muted-foreground hover:text-foreground p-1"
              title="Configurar API Key"
            >
              <Key className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* API Key settings */}
          {settingsOpen && (
            <div className="px-3 py-2 border-b border-border bg-muted/10 space-y-2">
              <p className="text-xs text-muted-foreground">OpenAI API Key (guardada en localStorage)</p>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={apiKey ? '••••••••••••••••' : 'sk-...'}
                className="flex h-8 w-full rounded border border-input bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              />
              <div className="flex gap-1">
                <button onClick={saveApiKey} className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1">Guardar</button>
                <button onClick={clearApiKey} className="text-xs text-muted-foreground hover:text-destructive px-2 py-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 200 }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'text-xs rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : msg.role === 'system'
                    ? 'bg-muted text-muted-foreground text-center mx-auto text-[10px]'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe un comando..."
              className="flex-1 h-8 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="text-primary hover:text-primary/80 disabled:opacity-40 p-1 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
