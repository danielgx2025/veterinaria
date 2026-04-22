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

En dev, Vite proxea `/api/*` → `http://localhost:3001` (ver `vite.config.ts`). No se necesita CORS ni URL absoluta en el frontend.

> **Nota:** `vite.config.ts` tiene `proxy` apuntando a `http://localhost:3000` — debería ser `3001`. Si el proxy no funciona, corregir `server.proxy` en ese archivo.

### Docker (desarrollo local)
```bash
docker-compose -f docker-compose.dev.yml up    # levanta PostgreSQL 17 + backend + frontend
docker-compose -f docker-compose.dev.yml down  # detener y limpiar
```
Útil cuando no se quiere instalar PostgreSQL localmente. El stack monta volúmenes para hot-reload en backend y frontend.

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

`requierePermiso` hace una query a `roles_permisos` en cada request. `req.usuario` contiene `{ userId, rolId, rolNombre, email }` inyectado por el middleware JWT. El token va en el header `Authorization: Bearer <token>` (JWT firmado con `JWT_SECRET`, expira en 8h).

Rutas disponibles:
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST|PUT /api/pacientes`, `GET /api/pacientes/:id`
- `GET|POST|PUT /api/clientes`, `GET /api/clientes/:id`
- `GET|POST /api/consultas`, `PATCH /api/consultas/:id/completar`
- `GET|POST /api/facturas`, `GET /api/facturas/:id`, `POST /api/facturas/:id/pagos`
- `GET|POST|PUT /api/citas`, `GET /api/citas?fecha=YYYY-MM-DD`, `PATCH /api/citas/:id/cancelar`
- `GET /api/catalogos/especies|razas?especie_id=X|veterinarios|servicios|pacientes`
- `GET /api/dashboard/kpis|ingresos-mensuales|ingresos-diarios|servicios-ranking|stock-bajo|vacunas-pendientes`

La creación de facturas usa transacción explícita (`BEGIN/COMMIT/ROLLBACK`) para descontar stock atómicamente. El `numero_factura` se genera automáticamente con formato `FAC-YYYY-XXXXXX` (año + secuencia de 6 dígitos con ceros).

`POST /api/consultas` crea automáticamente una entrada en `historial_clinico` con `tipo_evento = 'consulta'`. No es necesario crear ese registro manualmente.

`PATCH /api/citas/:id/cancelar` hace soft-delete (`activo = false`). El GET de citas devuelve `{ data: [...] }` (no array directo).

`/api/catalogos` provee datos para dropdowns en formularios. Archivo de rutas: `catalogos.ts`; el recurso `facturas` usa `facturacion.ts`.

### Frontend (`/frontend/src`)

Layout fijo: `<Sidebar>` (240px) + columna derecha con `<Header>` (56px) + `<main>`.

**Sin librería de componentes.** Todo el estilo es CSS-in-JS con variables CSS definidas en `styles/tokens.css`. Nunca usar hex directos en JSX — siempre `var(--token)`.

**Autenticación:** `<Login>` llama a `POST /api/auth/login`, guarda `token` y objeto `usuario` en `localStorage`. `<ProtectedRoute>` verifica `localStorage.getItem('token')`; si no existe redirige a `/login`. El Sidebar lee `localStorage.getItem('usuario')` para mostrar nombre/rol reales y ofrece logout que limpia ambas claves y navega a `/login`. Todos los fetches autenticados leen el token con `localStorage.getItem('token')` y lo pasan como `Authorization: Bearer <token>`.

**Patrón de modales (drawer):** panel lateral de 480px que desliza desde la derecha. Animaciones CSS inyectadas con `<style>` dentro del componente (`fadeOverlay`, `slidePanel`, `spin`). Props estándar: `abierto`, `onCerrar`, `onCreado`/`onGuardada`. Los modales de creación/edición (e.g. `NuevoPacienteModal`, `NuevaCitaModal`) cargan sus propios catálogos al abrirse y usan datos de fallback si el backend no responde.

**Patrón de recarga:** las páginas usan un contador `reloadKey` en `useState` que se incrementa después de una mutación, forzando el `useEffect` de carga.

Páginas con datos de ejemplo embebidos que intentan fetch al backend; si falla (backend no disponible), muestran los datos de ejemplo sin error.

**Credencial de prueba:** `admin@veterinaria.com` / `Admin2026!`

---

## Sistema de diseño

El sistema de diseño completo está en `.interface-design/system.md`. **Leer antes de tocar cualquier componente UI.**

Puntos críticos:
- **Colores por especie** — cada animal tiene su color de acento en DB (`especies.color_acento`). Ese color se propaga a rings, badges y bordes en toda la UI. No hardcodear — leer de la respuesta de la API.
- **`EstadoSaludRing`** — elemento signature del sistema. Anillo SVG alrededor de la foto del paciente cuyo color y dash-array refleja especie y estado de salud: `saludable|en_tratamiento|critico|fallecido`.
- **`MetricaStrip`** — reemplaza el patrón icono+número de dashboards genéricos. Usa sparkline SVG 60×24px inline con borde izquierdo 3px del color de estado.
- **Depth strategy:** solo surface color shifts, sin `box-shadow` mayor a `var(--sombra-md)`.
- **Tipografía** — `var(--fuente-display)` = Fraunces (solo títulos H1/H2), `var(--fuente-ui)` = Inter (todo lo operativo), `var(--fuente-mono)` = JetBrains Mono (números, precios, timestamps). Nunca usar serif para texto de formularios o tablas.
- **Números** — siempre `font-family: var(--fuente-mono)` + `font-variant-numeric: tabular-nums`.
- **Hover en componentes** — cambiar borde/color, no background. Cada elemento necesita 4 estados: default, hover, active, disabled.
- **Never blank** — mostrar skeleton o empty state explícito, nunca contenedor vacío.

---

## Tests

No hay suite de tests configurada (no Jest, Vitest, ni Mocha). Las verificaciones se hacen manualmente con el servidor corriendo.

---

## Convenciones

- Nombres de tablas y campos en **español** (así está el schema, no cambiar).
- Recursos de la API en **español** también (`pacientes`, `clientes`, `consultas`, `facturas`).
- El recurso `facturas` en Express está montado en `/api/facturas` pero el archivo de rutas se llama `facturacion.ts`.
- Las páginas muestran datos de ejemplo cuando el backend no responde — no es un bug, es intencional para desarrollo frontend independiente.
- El frontend no tiene estado global (Redux/Zustand). Cada página maneja su propio estado con `useState`/`useEffect`.
- `NuevaCitaModal` acepta prop `citaEditar?: CitaEditar | null` — si se pasa, entra en modo edición (PUT); si es null/undefined, modo creación (POST).
- `datetime-local` inputs se convierten a ISO con `new Date(val).toISOString()` antes de enviar al backend.
