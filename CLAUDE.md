# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos de desarrollo

### Backend (`/backend`)
```bash
npm install          # instalar dependencias
npm run dev          # servidor en modo watch (tsx) → http://localhost:3001
npm run build        # compilar TypeScript a /dist
npm start            # ejecutar build de producción (node dist/index.js)
npm run db:schema    # aplicar schema.sql a la DB (requiere DATABASE_URL en .env)
npm run db:seed      # cargar datos iniciales
```

### Frontend (`/frontend`)
```bash
npm install          # instalar dependencias
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # compilar con tsc + vite build
npm run preview      # previsualizar el build de producción
```

### Base de datos (PostgreSQL 17 en Windows)
```bash
# Ruta de binarios: C:\Program Files\PostgreSQL\17\bin\
PGPASSWORD=<pass> psql -U postgres -d veterinaria -f database/schema.sql
PGPASSWORD=<pass> psql -U postgres -d veterinaria -f database/seed.sql
PGPASSWORD=<pass> psql -U postgres -d veterinaria -f database/dashboard_queries.sql
```

La DB `veterinaria` en localhost ya tiene las 21 tablas del sistema creadas y el seed cargado. El archivo `backend/.env` tiene las credenciales reales. Variables requeridas: `DATABASE_URL`, `JWT_SECRET` (mín. 32 chars), `PORT=3001`, `NODE_ENV`, `FRONTEND_URL` (para CORS).

---

## Arquitectura

Monorepo con tres capas independientes:

```
/database   → SQL puro (esquema, seed, queries del dashboard)
/backend    → Express API REST (Node.js + TypeScript)
/frontend   → SPA React (TypeScript + Vite, sin framework de CSS externo)
/docs       → Estrategia SEO y plan de marketing
```

### Base de datos (`/database`)

21 tablas PostgreSQL, todas con campos `activo BOOLEAN` y `fecha_creacion TIMESTAMPTZ`. **Soft-delete:** nunca usar `DELETE`; poner `activo = false`. Grupos funcionales:

- **RBAC:** `roles` → `roles_permisos` ← `permisos` + `usuarios`
- **Clientes/Pacientes:** `clientes` → `pacientes` (con `especies` y `razas`)
- **Clínico:** `citas` → `consultas` → `historial_clinico`, `vacunaciones`, `desparasitaciones`
  - `citas.estado`: `programada|confirmada|en_curso|completada|cancelada|no_se_presento`
  - `pacientes.fallecido BOOLEAN` controla el estado del `EstadoSaludRing` (estado implícito `fallecido`)
- **Facturación:** `facturas` → `detalle_factura` ← `servicios` / `productos`, `pagos` → `metodos_pago`

### Backend (`/backend/src`)

Sin ORM — todo SQL directo con `pg.Pool`. Patrón de cada ruta:

```
verificarToken  →  requierePermiso('recurso', 'accion')  →  handler
```

`requierePermiso` hace una query a `roles_permisos` en cada request. `req.usuario` contiene `{ userId, rolId, rolNombre, email }` inyectado por el middleware JWT.

Rutas disponibles:
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST|PUT /api/pacientes`, `GET /api/pacientes/:id`
- `GET|POST|PUT /api/clientes`, `GET /api/clientes/:id`
- `GET|POST /api/consultas`, `PATCH /api/consultas/:id/completar`
- `GET|POST /api/facturas`, `GET /api/facturas/:id`, `POST /api/facturas/:id/pagos`
- `GET /api/dashboard/kpis|ingresos-mensuales|ingresos-diarios|servicios-ranking|stock-bajo|vacunas-pendientes`

La creación de facturas usa transacción explícita (`BEGIN/COMMIT/ROLLBACK`) para descontar stock atómicamente.

### Frontend (`/frontend/src`)

Layout fijo: `<Sidebar>` (240px) + columna derecha con `<Header>` (56px) + `<main>`.

**Sin librería de componentes.** Todo el estilo es CSS-in-JS con variables CSS definidas en `styles/tokens.css`. Nunca usar hex directos en JSX — siempre `var(--token)`.

Páginas con datos de ejemplo embebidos que intentan fetch al backend; si falla (backend no disponible), muestran los datos de ejemplo sin error.

---

## Sistema de diseño

El sistema de diseño completo está en `.interface-design/system.md`. **Leer antes de tocar cualquier componente UI.**

Puntos críticos:
- **Colores por especie** — cada animal tiene su color de acento en DB (`especies.color_acento`). Ese color se propaga a rings, badges y bordes en toda la UI. No hardcodear — leer de la respuesta de la API.
- **`EstadoSaludRing`** — elemento signature del sistema. Anillo SVG alrededor de la foto del paciente cuyo color y dash-array refleja especie y estado de salud: `saludable|en_tratamiento|critico|fallecido`.
- **`MetricaStrip`** — reemplaza el patrón icono+número de dashboards genéricos. Usa sparkline SVG 60×24px inline con borde izquierdo 3px del color de estado.
- **Depth strategy:** solo surface color shifts, sin `box-shadow` mayor a `var(--sombra-md)`.
- **Números** — siempre `font-family: var(--fuente-mono)` + `font-variant-numeric: tabular-nums`.
- **Hover en componentes** — cambiar borde/color, no background. Cada elemento necesita 4 estados: default, hover, active, disabled.
- **Never blank** — mostrar skeleton o empty state explícito, nunca contenedor vacío.

---

## Convenciones

- Nombres de tablas y campos en **español** (así está el schema, no cambiar).
- Recursos de la API en **español** también (`pacientes`, `clientes`, `consultas`, `facturas`).
- El recurso `facturas` en Express está montado en `/api/facturas` pero el archivo de rutas se llama `facturacion.ts`.
- Las páginas muestran datos de ejemplo cuando el backend no responde — no es un bug, es intencional para desarrollo frontend independiente.
- El frontend no tiene estado global (Redux/Zustand). Cada página maneja su propio estado con `useState`/`useEffect`.
