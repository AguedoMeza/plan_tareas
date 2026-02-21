# Plan Tareas – Mini Design System

## Objetivo
UI enfocada a: **gestión diaria + reporte + defensa de pendientes**.  
Prioridad: claridad, consistencia y baja fricción.

## Principios
- Una sola cosa destaca por pantalla (accent).
- Densidad cómoda: más “work tool” que “landing page”.
- Estados y prioridades visibles, sin gritar.
- Notas son contexto: **contador en fila**, detalle en drawer.

---

## Tokens

### Colores
- BG: `#0B0F14`
- Surface: `#111822`
- Elevated: `#121A24`
- Border: `rgba(255,255,255,.08)`
- Text: `#E7EEF8`
- Muted: `rgba(231,238,248,.65)`
- Accent: `#1BD27A`

**Estados**
- Done: Accent
- In Progress: `#F5A524`
- Blocked: `#FF5A6A`
- Pending/Neutral: `rgba(231,238,248,.45)`

### Tipografía
- Font family: system-ui
- Title: 14–16px / 800
- Body: 12–13px / 600–700
- Meta: 11–12px / 500 + muted
- Mono (fechas): ui-monospace

### Espaciado
- xs: 6
- sm: 10
- md: 14
- lg: 18
- xl: 24

### Radius / Shadow
- radius-md: 10
- radius-lg: 14
- shadow: `0 12px 30px rgba(0,0,0,.35)`

---

## Componentes

### Project Card
- Título (bold)
- Subtítulo (muted)
- Métricas: tareas + días
- Progress bar delgada

### Tabla
Columnas base:
Nombre | Descripción | Prior | Avance | Esfuerzo | Deadline | Estado | Acciones

Reglas:
- Header uppercase 11px muted
- Zebra leve
- Hover suave
- Descripción truncada con ellipsis

### Chips
Prioridad:
- Alta: rojo suave
- Media: ámbar suave
- Baja: neutro

Estado (pill):
- Done / In progress / Blocked / Pending

### Progreso
- Barra 8px, rounded, accent gradient
- Mostrar % solo en items activos (opcional ocultar 100% en completados)

### Drawer (Notas)
- Se abre por contador `📝 (n)`
- Agregar nota (sin fecha obligatoria)
- Eliminar nota
- Breadcrumb de ruta arriba

---

## Reglas UX (importantes)
- Orden automático dentro de proyecto:
  1) Alta prioridad + En progreso
  2) Bloqueadas
  3) Pendientes
  4) Completadas al final
- Notas NO compiten: solo contador en fila.
- “Sin fecha”: mostrar `Sin fecha` o `—` consistente en todo.

---

## Snippets
(agrega aquí tus clases base o fragmentos CSS/HTML)