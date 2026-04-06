-- =============================================================================
-- SISTEMA DE GESTIÓN VETERINARIA — Schema PostgreSQL
-- Versión: 1.0.0 | Fecha: 2026-03-27
-- =============================================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECCIÓN 1: USUARIOS Y SEGURIDAD (RBAC)
-- =============================================================================

CREATE TABLE roles (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(50) NOT NULL UNIQUE,
    descripcion      VARCHAR(255),
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Roles del sistema: Admin, Veterinario, Recepcionista';

CREATE TABLE permisos (
    id               SERIAL PRIMARY KEY,
    recurso          VARCHAR(100) NOT NULL,  -- ej: 'pacientes', 'facturas', 'usuarios'
    accion           VARCHAR(50)  NOT NULL,  -- ej: 'crear', 'leer', 'editar', 'eliminar'
    descripcion      VARCHAR(255),
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (recurso, accion)
);

COMMENT ON TABLE permisos IS 'Permisos granulares por recurso y acción (RBAC)';

CREATE TABLE roles_permisos (
    rol_id           INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id       INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE usuarios (
    id               SERIAL PRIMARY KEY,
    rol_id           INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    telefono         VARCHAR(20),
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_acceso    TIMESTAMPTZ
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con rol asignado';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt de la contraseña, nunca texto plano';

-- =============================================================================
-- SECCIÓN 2: CLIENTES
-- =============================================================================

CREATE TABLE clientes (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(100) NOT NULL,
    apellido              VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) UNIQUE,
    telefono              VARCHAR(20),
    telefono_alternativo  VARCHAR(20),
    direccion             VARCHAR(255),
    ciudad                VARCHAR(100),
    documento_identidad   VARCHAR(50) UNIQUE,
    notas                 TEXT,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Dueños o tutores de los pacientes animales';

-- =============================================================================
-- SECCIÓN 3: CATÁLOGOS — Especies y Razas
-- =============================================================================

CREATE TABLE especies (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL UNIQUE,
    icono          VARCHAR(50),   -- emoji o nombre de ícono: 'dog', 'cat', 'bird'
    color_acento   VARCHAR(7),    -- hex color para UI por especie
    activo         BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE especies IS 'Catálogo de especies: Perro, Gato, Ave, Conejo, etc.';

CREATE TABLE razas (
    id           SERIAL PRIMARY KEY,
    especie_id   INT NOT NULL REFERENCES especies(id) ON DELETE RESTRICT,
    nombre       VARCHAR(100) NOT NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (especie_id, nombre)
);

-- =============================================================================
-- SECCIÓN 4: PACIENTES (ANIMALES)
-- =============================================================================

CREATE TABLE pacientes (
    id             SERIAL PRIMARY KEY,
    cliente_id     INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    especie_id     INT NOT NULL REFERENCES especies(id) ON DELETE RESTRICT,
    raza_id        INT REFERENCES razas(id) ON DELETE SET NULL,
    nombre         VARCHAR(100) NOT NULL,
    sexo           CHAR(1) NOT NULL CHECK (sexo IN ('M', 'H')),  -- Macho / Hembra
    fecha_nacimiento DATE,
    peso_kg        DECIMAL(6,3) CHECK (peso_kg > 0),
    color_pelaje   VARCHAR(100),
    microchip      VARCHAR(50) UNIQUE,
    foto_url       VARCHAR(500),
    esterilizado   BOOLEAN NOT NULL DEFAULT FALSE,
    fallecido      BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_fallecimiento DATE,
    notas          TEXT,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pacientes IS 'Animales bajo cuidado veterinario';
COMMENT ON COLUMN pacientes.sexo IS 'M = Macho, H = Hembra';

-- =============================================================================
-- SECCIÓN 5: SERVICIOS Y CATÁLOGO CLÍNICO
-- =============================================================================

CREATE TABLE servicios (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    categoria           VARCHAR(100) NOT NULL,  -- 'Consulta', 'Cirugía', 'Vacunación', 'Laboratorio', 'Estética'
    precio_base         DECIMAL(10,2) NOT NULL CHECK (precio_base >= 0),
    duracion_minutos    INT NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
    requiere_veterinario BOOLEAN NOT NULL DEFAULT TRUE,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE servicios IS 'Catálogo de servicios ofrecidos por la clínica';

-- =============================================================================
-- SECCIÓN 6: AGENDA — CITAS
-- =============================================================================

CREATE TABLE citas (
    id                   SERIAL PRIMARY KEY,
    paciente_id          INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    veterinario_id       INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    servicio_id          INT REFERENCES servicios(id) ON DELETE SET NULL,
    fecha_hora_inicio    TIMESTAMPTZ NOT NULL,
    fecha_hora_fin       TIMESTAMPTZ NOT NULL,
    estado               VARCHAR(30) NOT NULL DEFAULT 'programada'
                             CHECK (estado IN ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_se_presento')),
    notas                TEXT,
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cita_duracion_valida CHECK (fecha_hora_fin > fecha_hora_inicio)
);

COMMENT ON TABLE citas IS 'Agenda de citas programadas';

-- =============================================================================
-- SECCIÓN 7: CONSULTAS MÉDICAS
-- =============================================================================

CREATE TABLE consultas (
    id                  SERIAL PRIMARY KEY,
    paciente_id         INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    veterinario_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    cita_id             INT REFERENCES citas(id) ON DELETE SET NULL,
    servicio_id         INT REFERENCES servicios(id) ON DELETE SET NULL,
    fecha_hora          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo_consulta     TEXT NOT NULL,
    anamnesis           TEXT,           -- Historia clínica relatada por el dueño
    examen_fisico       TEXT,           -- Hallazgos del examen físico
    diagnostico         TEXT,
    diagnostico_cie     VARCHAR(20),    -- Código CIE-10 o similar (opcional)
    tratamiento         TEXT,
    indicaciones        TEXT,           -- Instrucciones para el dueño
    observaciones       TEXT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'en_curso'
                            CHECK (estado IN ('en_curso', 'completada', 'requiere_seguimiento')),
    peso_al_consulta    DECIMAL(6,3) CHECK (peso_al_consulta > 0),
    temperatura_c       DECIMAL(4,1),   -- Temperatura en Celsius
    frecuencia_cardiaca INT,            -- Latidos por minuto
    frecuencia_respiratoria INT,        -- Respiraciones por minuto
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE consultas IS 'Registro de consultas médicas veterinarias';

-- =============================================================================
-- SECCIÓN 8: HISTORIAL CLÍNICO
-- =============================================================================

CREATE TABLE historial_clinico (
    id               SERIAL PRIMARY KEY,
    paciente_id      INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    consulta_id      INT REFERENCES consultas(id) ON DELETE SET NULL,
    tipo_evento      VARCHAR(50) NOT NULL
                         CHECK (tipo_evento IN ('consulta', 'vacunacion', 'desparasitacion',
                                                'cirugia', 'laboratorio', 'hospitalizacion',
                                                'nota', 'archivo')),
    descripcion      TEXT NOT NULL,
    archivos_adjuntos TEXT,             -- JSON array de URLs de archivos
    fecha_evento     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE historial_clinico IS 'Línea de tiempo clínica completa del paciente';

-- =============================================================================
-- SECCIÓN 9: VACUNAS Y VACUNACIONES
-- =============================================================================

CREATE TABLE vacunas (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(150) NOT NULL,
    laboratorio      VARCHAR(100),
    descripcion      TEXT,
    intervalo_dias   INT NOT NULL DEFAULT 365 CHECK (intervalo_dias > 0),
    especie_id       INT REFERENCES especies(id) ON DELETE SET NULL,  -- NULL = aplica a todas
    activo           BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE vacunas IS 'Catálogo de vacunas disponibles';

CREATE TABLE vacunaciones (
    id               SERIAL PRIMARY KEY,
    paciente_id      INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    vacuna_id        INT NOT NULL REFERENCES vacunas(id) ON DELETE RESTRICT,
    veterinario_id   INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    consulta_id      INT REFERENCES consultas(id) ON DELETE SET NULL,
    fecha_aplicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    proxima_dosis    DATE,
    lote             VARCHAR(50),
    observaciones    TEXT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vacunaciones IS 'Registro de vacunas aplicadas a cada paciente';

-- =============================================================================
-- SECCIÓN 10: DESPARASITACIONES
-- =============================================================================

CREATE TABLE desparasitaciones (
    id               SERIAL PRIMARY KEY,
    paciente_id      INT NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
    veterinario_id   INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    consulta_id      INT REFERENCES consultas(id) ON DELETE SET NULL,
    producto         VARCHAR(150) NOT NULL,
    tipo             VARCHAR(30) NOT NULL CHECK (tipo IN ('interna', 'externa', 'ambas')),
    via_administracion VARCHAR(50),    -- oral, topica, inyectable
    fecha_aplicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    proxima_dosis    DATE,
    dosis_ml         DECIMAL(6,2),
    observaciones    TEXT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECCIÓN 11: FARMACIA E INVENTARIO
-- =============================================================================

CREATE TABLE categorias_producto (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL UNIQUE,
    activo   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id                    SERIAL PRIMARY KEY,
    categoria_id          INT REFERENCES categorias_producto(id) ON DELETE SET NULL,
    nombre                VARCHAR(200) NOT NULL,
    descripcion           TEXT,
    unidad_medida         VARCHAR(30) NOT NULL DEFAULT 'unidad',  -- unidad, ml, mg, caja
    precio_venta          DECIMAL(10,2) NOT NULL CHECK (precio_venta >= 0),
    precio_costo          DECIMAL(10,2) CHECK (precio_costo >= 0),
    stock_actual          INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo          INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    codigo_barras         VARCHAR(50) UNIQUE,
    requiere_receta       BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_vencimiento     DATE,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE productos IS 'Inventario de medicamentos, insumos y productos de venta';
COMMENT ON COLUMN productos.stock_minimo IS 'Nivel mínimo para generar alerta de reabastecimiento';

-- =============================================================================
-- SECCIÓN 12: FACTURACIÓN Y PAGOS
-- =============================================================================

CREATE TABLE metodos_pago (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(50) NOT NULL UNIQUE,  -- Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia
    activo   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE facturas (
    id                SERIAL PRIMARY KEY,
    cliente_id        INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    usuario_id        INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,  -- quien emite
    numero_factura    VARCHAR(30) NOT NULL UNIQUE,
    fecha_emision     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMPTZ,
    subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    descuento         DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    impuesto          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (impuesto >= 0),
    total             DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    estado            VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('borrador', 'pendiente', 'pagada', 'parcial', 'anulada', 'vencida')),
    notas             TEXT,
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE facturas IS 'Cabecera de facturas emitidas a clientes';

CREATE TABLE detalle_factura (
    id               SERIAL PRIMARY KEY,
    factura_id       INT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    consulta_id      INT REFERENCES consultas(id) ON DELETE SET NULL,
    producto_id      INT REFERENCES productos(id) ON DELETE SET NULL,
    servicio_id      INT REFERENCES servicios(id) ON DELETE SET NULL,
    descripcion      VARCHAR(255) NOT NULL,
    cantidad         DECIMAL(10,3) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario  DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento        DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    subtotal         DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT detalle_tiene_referencia CHECK (
        consulta_id IS NOT NULL OR producto_id IS NOT NULL OR servicio_id IS NOT NULL
    )
);

COMMENT ON TABLE detalle_factura IS 'Ítems de cada factura (servicios, productos, consultas)';

CREATE TABLE pagos (
    id               SERIAL PRIMARY KEY,
    factura_id       INT NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
    metodo_pago_id   INT NOT NULL REFERENCES metodos_pago(id) ON DELETE RESTRICT,
    monto            DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    fecha_pago       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referencia       VARCHAR(100),  -- número de transacción, voucher
    observaciones    TEXT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pagos IS 'Registro de pagos recibidos (una factura puede tener pagos parciales)';

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================================

-- Usuarios
CREATE INDEX idx_usuarios_email    ON usuarios(email);
CREATE INDEX idx_usuarios_rol      ON usuarios(rol_id);

-- Clientes
CREATE INDEX idx_clientes_email    ON clientes(email);
CREATE INDEX idx_clientes_documento ON clientes(documento_identidad);

-- Pacientes
CREATE INDEX idx_pacientes_cliente  ON pacientes(cliente_id);
CREATE INDEX idx_pacientes_especie  ON pacientes(especie_id);
CREATE INDEX idx_pacientes_microchip ON pacientes(microchip);

-- Consultas
CREATE INDEX idx_consultas_paciente    ON consultas(paciente_id);
CREATE INDEX idx_consultas_veterinario ON consultas(veterinario_id);
CREATE INDEX idx_consultas_fecha       ON consultas(fecha_hora);
CREATE INDEX idx_consultas_estado      ON consultas(estado);

-- Citas
CREATE INDEX idx_citas_paciente    ON citas(paciente_id);
CREATE INDEX idx_citas_veterinario ON citas(veterinario_id);
CREATE INDEX idx_citas_fecha       ON citas(fecha_hora_inicio);
CREATE INDEX idx_citas_estado      ON citas(estado);

-- Historial
CREATE INDEX idx_historial_paciente ON historial_clinico(paciente_id);
CREATE INDEX idx_historial_fecha    ON historial_clinico(fecha_evento);

-- Vacunaciones
CREATE INDEX idx_vacunaciones_paciente      ON vacunaciones(paciente_id);
CREATE INDEX idx_vacunaciones_proxima_dosis ON vacunaciones(proxima_dosis);

-- Desparasitaciones
CREATE INDEX idx_desparasitaciones_paciente ON desparasitaciones(paciente_id);
CREATE INDEX idx_desparasitaciones_proxima  ON desparasitaciones(proxima_dosis);

-- Productos / Stock
CREATE INDEX idx_productos_stock_bajo ON productos(stock_actual) WHERE stock_actual <= stock_minimo;
CREATE INDEX idx_productos_categoria  ON productos(categoria_id);

-- Facturas
CREATE INDEX idx_facturas_cliente  ON facturas(cliente_id);
CREATE INDEX idx_facturas_estado   ON facturas(estado);
CREATE INDEX idx_facturas_fecha    ON facturas(fecha_emision);

-- Pagos
CREATE INDEX idx_pagos_factura ON pagos(factura_id);
CREATE INDEX idx_pagos_fecha   ON pagos(fecha_pago);
