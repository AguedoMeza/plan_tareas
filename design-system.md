# Plan Tareas – Design System

## Objetivo
UI enfocada a: **gestión diaria + reporte + defensa de pendientes**.
Prioridad: claridad, consistencia y baja fricción.

## Principios
- Una sola cosa destaca por pantalla (accent verde).
- Densidad cómoda: más "work tool" que "landing page".
- Estados y prioridades visibles, sin gritar.
- Notas son contexto: **contador en fila**, detalle en drawer.

---

## Tokens

### Colores
```
BG:       #0B0F14          (--background)
Surface:  #111822          (--card)
Elevated: #121A24          (--popover)
Sidebar L: #09111a
Sidebar R: #0d1520
Border:   rgba(255,255,255,.06–.08)   (--border)
Text:     #E7EEF8          (--foreground)
Muted:    rgba(231,238,248,.65)       (--muted-foreground)
Accent:   #1BD27A          (--primary)
```

**Estados elemento (EstadoBadge)**
| Estado | Color bg | Color text | Border |
|---|---|---|---|
| Completado | emerald-500/10 | emerald-400 | emerald-500/25 |
| En progreso | amber-500/10 | amber-400 | amber-500/25 |
| Bloqueado | rose-500/10 | rose-400 | rose-500/25 |
| Pendiente | — | muted-foreground | border/60 |
| Backlog | — | muted-foreground/60 | border/40 |

**Estados proyecto**
| Estado | Color |
|---|---|
| Activo | emerald-500/10 + emerald-400 |
| Backlog | muted |
| Archivado | muted/50 |

**Prioridad**
| Nivel | Color |
|---|---|
| Alta (1) | rose-500/10 + rose-400 |
| Media (2) | amber-500/10 + amber-400 |
| Baja (3) | muted |

**Colores de tableros** (auto-asignados, ciclan):
`#1BD27A` `#3B82F6` `#F59E0B` `#EF4444` `#8B5CF6` `#EC4899` `#06B6D4` `#F97316` `#A3E635` `#64748B`

### Tipografía
- Font family: `system-ui, -apple-system, sans-serif`
- Mono (fechas, stats): `ui-monospace`
- Base: `14px / line-height 1.5`

| Rol | Tamaño | Peso |
|---|---|---|
| Título proyecto | 16px | 700 |
| Subtítulo / descripción | 13px | 400 |
| Nav label (sidebar) | 14px | 500 |
| Body / tabla rows | 14px | 400 |
| Meta / muted | 12–13px | 400 |
| Badge / chip | 11–12px | 600 |
| Header tabla | 11px | 600 + uppercase + tracking 0.07em |
| Section label sidebar | 11px | 600 + uppercase + tracking 0.1em |
| Fecha mono | 12px | 400 |

### Espaciado real (Tailwind)
| Token | Valor | Uso |
|---|---|---|
| `gap-1` | 4px | Badges juntos |
| `gap-2` | 8px | Icono + texto compacto |
| `gap-3.5` | 14px | Nav item icono-label |
| `gap-4` | 16px | Stats sidebar |
| `px-4 py-3` | 16/12px | Nav items sidebar (~48px row) |
| `px-5 py-4` | 20/16px | Project card row (~72px) |
| `px-5 py-5` | 20/20px | Secciones sidebar derecho |
| `px-8 py-10` | 32/40px | Contenido principal |
| `mb-3` | 12px | Gap entre project cards |
| `mb-12` | 48px | Gap entre secciones del board |

### Dimensiones de layout
| Elemento | Tamaño |
|---|---|
| Toolbar height | 52px |
| Left sidebar | 224px (`w-56`) |
| Right sidebar | 256px (`w-64`) |
| Right sidebar colapsado | 36px (`w-9`) |
| Project card row | min-h 72px |
| Nav item row | ~48px |
| Content max-width | 5xl (1024px) |

### Radius / Shadow
- Tarjetas: `rounded-lg` (8px)
- Badges / pills: `rounded-full`
- Botones icon: `rounded-md`
- Card shadow: `0 12px 30px rgba(0,0,0,.35)`

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar (52px)  — breadcrumb | ⌘K | Exportar Importar Nuevo │
├──────────┬──────────────────────────────────────┬────────────┤
│ Left     │  Tab bar (Tablero N | Archivados N)  │ Right      │
│ Sidebar  │──────────────────────────────────────│ Sidebar    │
│ 224px    │  ● ACTIVOS  8                        │ 256px      │
│          │    [Project Card]                    │            │
│ VISTAS   │    [Project Card]                    │ RESUMEN    │
│  Tableros│                                      │  Activos 8 │
│  Completa│  ● BACKLOG  3                        │  Vivas  16 │
│  Viva  16│    [Project Card]                    │  Compl 38  │
│          │                                      │ ▓▓▓░ 67%  │
│ MIS      │                                      │            │
│ TABLEROS │                                      │ PROYECTOS  │
│  ● MPA   │                                      │  Nintex... │
│  ● Tbl 2 │                                      │            │
│          │                                      │ VENCIM...  │
│+ Nuevo   │                                      │  3d tarea  │
└──────────┴──────────────────────────────────────┴────────────┘
```

---

## Componentes

### Left Sidebar (`LeftSidebar.tsx`)
- `w-56` (224px), `bg-[#09111a]`, border-right `rgba(255,255,255,.06)`
- Brand header: `h-[52px]` — ícono verde + "Plan Tareas" 14px bold
- **NavItem**: `py-3 px-4 gap-3.5`, altura ~48px, ícono 20px
  - Activo: fondo `rgba(27,210,122,.1)` + barra verde izquierda `h-6 w-[3px]`
  - Hover: `rgba(255,255,255,.05)`
- **Sección "Vistas"**: Tableros / Completa / Viva (badge verde con count)
- **Sección "Mis tableros"**: collapsible, punto de color por tablero
- Hover en tablero revela botones Renombrar / Eliminar

### Right Sidebar (`RightSidebar.tsx`)
- `w-64` (256px), `bg-[#0d1520]`, border-left
- Colapsable a `w-9`, animación 300ms
- **Sección Resumen**: Activos, Vivas, Bloqueadas, Completas + barra de progreso global
- **Sección Proyectos**: lista con barra de 3px por proyecto
- **Sección Vencimientos**: items ≤14 días, color rojo/ámbar/muted según urgencia
- Usa `ScrollArea` para scroll interno

### Toolbar (`Toolbar.tsx`)
- `h-[52px] px-5`, `bg-card border-b`
- Breadcrumb: punto color tablero + nombre + `›` + vista actual
- Botón `⌘K` para Command Palette
- Botones con `Tooltip`: Exportar (↓), Importar (↑), Asistente IA (🤖)
- Botón primario `+ Nuevo` (verde)

### Command Palette (`CommandPalette.tsx`)
- Dialog + `Ctrl+K` / `Cmd+K` global
- Filtra tableros y vistas por texto
- Navegación con ↑↓ Enter Esc

### Project Card (`ProjectCard.tsx`)
- `rounded-lg border bg-card mb-3 shadow-card`
- Main row: `px-5 py-4 min-h-[72px] gap-4`
  - Drag handle (GripVertical) → toggle expand → badge estado → título 16px bold → descripción 13px muted → meta → progress → ⋮ menu
- Badge estado proyecto: `rounded-full px-3 py-1 text-[12px]` + colores por estado
- Expandible → tabla de elementos hijos

### Tabla de elementos (`ProjectDetailRow.tsx`)
- Headers: `11px uppercase tracking-0.07em muted` (clase `.th-ds`)
- Columnas: Nombre | Descripción | Prior | Avance | Esfuerzo | Deadline | Estado | Acc.
- Filas: `py-2.5 px-3`, zebra leve (`muted/35` pares)
- Hover: reveal botón eliminar
- **Estado**: `DropdownMenu` con `EstadoBadge` como trigger + ✓ en ítem activo
- **Prioridad**: badge clickable que cicla Alta→Media→Baja
- Inline edit: doble clic en nombre/descripción/deadline/avance/esfuerzo

### Chips / Badges (`EstadoBadge.tsx`)
```
EstadoBadge    — pill rounded-full, colores semánticos por estado
PrioridadBadge — pill rounded-full, rojo/ámbar/neutro
ProyectoEstadoBadge — igual pero para estados de proyecto
```

### Barra de progreso
- **Board** (tabla): `.progress-bar-wrap` 8px, gradiente `#1BD27A → #14A861`
- **Sidebar derecho**: 3px por proyecto, gradiente suave
- **Global**: 6px (`h-1.5`), mismos colores

### Board Sections (`BoardSection.tsx`)
- Secciones: **Activos** (dot verde), **Backlog** (dot gris), **Archivados** (dot gris claro)
- Header: punto 12px + texto uppercase 12px + count badge + chevron
- `mb-12` entre secciones, `mb-5` entre header y primera tarjeta
- Drag & drop con `react-sortablejs` (handle `.drag-handle`)

### Board Selector (`BoardSelectorView.tsx`)
- Grid de cards, una por tablero
- Cada card muestra: borde de color, nombre, stats (activos/vivas/bloqueadas), progress bar
- Tarjeta activa destacada

### Tabs (BoardView)
- Estilo underline (Linear/Gmail)
- `px-5 py-3.5 text-[14px] font-semibold`
- Activo: `border-b-2 border-primary text-foreground`
- Inactive: `text-muted-foreground hover:text-foreground`

### Tooltips
- `TooltipProvider delayDuration={400}` en `App.tsx`
- Todos los botones icon-only tienen `Tooltip` de Radix
- Usar siempre `asChild` en `TooltipTrigger`

---

## Reglas UX (importantes)
- Orden automático dentro de proyecto:
  1. Alta prioridad + En progreso
  2. Bloqueadas
  3. Pendientes
  4. Completadas al final
- Notas NO compiten con la tarea: solo contador en fila.
- "Sin fecha": mostrar `—` consistente.
- Tablero nuevo auto-asigna color del palette (sin repetir si hay disponibles).
- Formularios inline: doble clic activa edición, Enter/blur guarda, Esc cancela.

---

## Stack técnico
- Vite 5 + React 18 + TypeScript
- Tailwind CSS v3
- shadcn/ui instalados: `button badge dialog select tabs input textarea alert-dialog dropdown-menu sheet tooltip separator scroll-area`
- Zustand (estado global + persistencia localStorage)
- react-sortablejs para drag & drop
- lucide-react para iconos
- sonner para toasts
