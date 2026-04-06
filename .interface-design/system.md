# VetSystem — Interface Design System

Guardado el 2026-03-27. Aplicar en todas las sesiones futuras de UI para este proyecto.

---

## Dirección y feel

**Producto:** Sistema de gestión para clínica veterinaria (dashboard + admin panel)
**Usuario:** Veterinarios y recepcionistas en pantalla durante horas de trabajo clínico
**Feel:** Como entrar a una clínica veterinaria moderna — paredes blancas esterilizadas, plantas en sala de espera, luz natural, instrumental de acero, pelajes cálidos. Confiable pero cálido. Preciso pero humano.

---

## Paleta de color

Derivada del mundo físico veterinario, no aplicada genéricamente.

```css
/* Primitivos */
--verde-100: #F0F7F3;
--verde-200: #D6EDE2;
--verde-300: #A8D4BC;
--verde-400: #7CAF8E;   /* verde-salvia — plantas en sala de espera */
--verde-500: #4A9068;
--verde-600: #2A7A52;   /* verde-clinica — color de marca */
--verde-700: #1F5C3D;

--ambar-100: #FEF3E2;
--ambar-300: #F9C06A;
--ambar-500: #D4850A;   /* ambar-pelaje — Labrador dorado */
--ambar-600: #A6650A;

--azul-100:  #E8F1F8;
--azul-500:  #2C5F8A;   /* azul-diagnostico — camisa del vet, archivadores */

--rojo-100:  #FEE8E8;
--rojo-500:  #C53030;   /* urgencia / alerta crítica */

--neutro-50:  #FAFCFB;
--neutro-100: #F2F7F4;
--neutro-200: #E5EEE9;
--neutro-300: #C8D9CE;
--neutro-400: #A0B5A8;
--neutro-500: #6E8C7A;
--neutro-600: #4A6058;
--neutro-800: #1A2520;

/* Tokens semánticos — texto */
--ink-primario:   #1A2520;
--ink-secundario: #4A6058;
--ink-terciario:  #6E8C7A;
--ink-muted:      #A0B5A8;

/* Tokens semánticos — superficies */
--superficie-canvas:  #FAFCFB;   /* fondo de página */
--superficie-base:    #FFFFFF;   /* cards */
--superficie-elevada: #F2F7F4;   /* inputs, hover */
--superficie-alta:    #E5EEE9;   /* dropdowns */

/* Bordes */
--borde-sutil:   rgba(42, 122, 82, 0.10);
--borde-normal:  rgba(42, 122, 82, 0.18);
--borde-enfasis: rgba(42, 122, 82, 0.35);
--borde-control: #C8D9CE;
```

### Acentos por especie (CRÍTICO — no cambiar)
Cada especie animal tiene su propio color de acento en toda la UI:
```
Perro   → #D4850A  (ámbar cálido)
Gato    → #6B48B8  (índigo)
Ave     → #0891B2  (cian)
Conejo  → #DB6A8C  (rosa coral)
Hámster → #7C6F5B  (arena)
Reptil  → #4D7C0F  (verde musgo)
Pez     → #0369A1  (azul profundo)
Exótico → #C2410C  (naranja quemado)
```
Estos colores vienen de la DB (`especies.color_acento`) y se aplican en: PacienteCard, EstadoSaludRing, badges, barras de agenda, puntos en listas.

---

## Tipografía

```css
--fuente-ui:      'Inter', system-ui, sans-serif;      /* todo el UI, datos, labels */
--fuente-display: 'Fraunces', Georgia, serif;          /* títulos de sección, saludos */
--fuente-mono:    'JetBrains Mono', 'Fira Code', monospace; /* números, horas, facturas */
```

**Regla de uso:**
- `Fraunces` solo en `<h1>` y `<h2>` de página (ej: "Dashboard", "Buenos días, clínica")
- `Inter` para todo el UI operativo
- `font-variant-numeric: tabular-nums` en TODOS los números (métricas, precios, horas)

**Escala:**
```
xs:   0.75rem  (12px) — labels, badges, metadatos
sm:   0.875rem (14px) — texto secundario, cuerpo compacto
base: 1rem     (16px) — texto principal
lg:   1.125rem (18px) — subtítulos de card
xl:   1.25rem  (20px) — títulos de sección
2xl:  1.5rem   (24px) — títulos de página (Fraunces)
3xl:  1.875rem (30px) — KPIs grandes (monospace)
4xl:  2.25rem  (36px) — números hero
```

---

## Espaciado

**Base: 4px.** Solo múltiplos de 4.

```
esp-1: 4px   (gap de íconos)
esp-2: 8px   (separación micro, padding inline de badges)
esp-3: 12px  (padding interno compacto)
esp-4: 16px  (padding estándar de cards y secciones)
esp-5: 20px
esp-6: 24px  (espaciado entre secciones)
esp-8: 32px  (separación mayor)
esp-12: 48px (márgenes grandes)
```

---

## Depth strategy: Surface color shifts

**Regla:** NO usar sombras dramáticas. Jerarquía solo por cambio de tonalidad dentro del mismo rango verde-marfil.

```
canvas   → #FAFCFB  (fondo de página)
base     → #FFFFFF  (cards, panels)
elevada  → #F2F7F4  (inputs, hover states, dropdowns internos)
alta     → #E5EEE9  (popovers, toasts)
```

Sombras solo como whisper, no como efecto decorativo:
```css
--sombra-sm: 0 1px 2px rgba(13, 20, 16, 0.04);
--sombra-md: 0 1px 3px rgba(13, 20, 16, 0.06), 0 1px 2px rgba(13, 20, 16, 0.04);
```

**Nunca:** `box-shadow: 0 4px 20px rgba(0,0,0,0.15)` — demasiado dramático.

---

## Border radius

```
radio-sm:   4px   (inputs, badges, chips)
radio-md:   8px   (botones, cards pequeñas)
radio-lg:   12px  (cards principales)
radio-xl:   16px  (paneles, secciones grandes)
radio-full: 9999px (pills, avatares, puntos de especie)
```

---

## Componentes clave

### EstadoSaludRing — SIGNATURE ELEMENT
El elemento único de VetSystem. SVG anillo alrededor de la foto/inicial del paciente:
- Color del anillo = color de especie del animal
- Grosor y dash array varían según estado de salud (`saludable`, `en_tratamiento`, `critico`, `fallecido`)
- Ubicación: PacienteCard, header de ficha clínica, agenda

```tsx
<EstadoSaludRing size={52} colorEspecie={color} estado="saludable">
  <img src={fotoUrl} alt={nombre} />
</EstadoSaludRing>
```

### MetricaStrip — métricas del dashboard
Reemplaza el patrón icono+número+label con una "tira de diagnóstico":
- Borde izquierdo de 3px del color de estado
- Número grande en fuente monospace
- Sparkline inline de 60×24px (polyline SVG)
- Indicador de variación (↑/↓ con %)
- Nunca usar icono genérico a la izquierda

### PacienteCard
- 52px ring de especie a la izquierda
- Badge de especie con color del acento (`background: color + '14'` para 8% opacidad)
- Hover: `border-color` cambia a color de especie + `40` (25% opacidad)
- NO tabla plana de pacientes — siempre grid de cards

### Sidebar
- Mismo fondo que el canvas/base (NO sidebar oscuro)
- Separación solo con `border-right: 1px solid var(--borde-normal)`
- Nav activo: `background: var(--verde-100)`, `color: var(--verde-700)`
- Logo: nombre en Fraunces + "CLÍNICA" en xs uppercase tracking amplio

### Agenda (Citas)
- Vista timeline: columna de hora monospace + celdas con `border-left: 3px solid colorEspecie`
- Background de cada cita: `color_especie + '08'` (5% opacidad)
- Puntos de color especie de 8px antes del nombre del paciente en listas

### Tabla (Facturación)
- Cabecera: `background: var(--neutro-50)`, labels xs uppercase
- Hover de fila: `background: var(--neutro-50)`
- Números: siempre monospace con `font-variant-numeric: tabular-nums`
- Estado: pill de color semántico, nunca solo texto

---

## Reglas para nuevos componentes

1. **Colores semánticos** — Usar variables, nunca hex directos en JSX/CSS
2. **Números** — Siempre `font-family: var(--fuente-mono)` + `font-variant-numeric: tabular-nums`
3. **Bordes de elementos interactivos** — hover cambia `border-color`, no `background`
4. **Estados interactivos** — Todo elemento clickeable necesita: default, hover, active, focus, disabled
5. **Color de especie** — Si hay un paciente en pantalla, su color de especie debe estar presente en algún elemento visible (ring, badge, borde izquierdo)
6. **Vacío / loading** — Nunca dejar pantalla en blanco: skeleton con `--neutro-200` o mensaje de estado vacío en `--ink-terciario`

---

## Lo que NO hacer

- Sidebar azul oscuro o con hue diferente al canvas
- `box-shadow` mayor a `var(--sombra-md)`
- Metric cards con `icon + big number + small label` (el patrón default de todos los dashboards)
- Bordes sólidos de `1px solid #ccc` — usar siempre `rgba(42,122,82, ...)` en bordes
- Mezclar estrategias de depth (sombras Y color shifts juntos)
- Fuente serif (`Fraunces`) en UI operativo — solo para títulos de página
- Pure white `#FFFFFF` en el fondo de página — usar `--superficie-canvas: #FAFCFB`
