-- =============================================================================
-- SISTEMA DE GESTIÓN VETERINARIA — Datos Iniciales (Seed)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
    ('Admin',          'Acceso total al sistema: usuarios, configuración, reportes'),
    ('Veterinario',    'Acceso a consultas, historiales, vacunaciones y recetas'),
    ('Recepcionista',  'Gestión de citas, clientes, facturación y caja');

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO permisos (recurso, accion, descripcion) VALUES
    -- Usuarios
    ('usuarios', 'crear',    'Crear nuevos usuarios del sistema'),
    ('usuarios', 'leer',     'Ver listado y detalle de usuarios'),
    ('usuarios', 'editar',   'Modificar datos de usuarios'),
    ('usuarios', 'eliminar', 'Desactivar usuarios'),
    -- Clientes
    ('clientes', 'crear',    'Registrar nuevos clientes'),
    ('clientes', 'leer',     'Ver listado y detalle de clientes'),
    ('clientes', 'editar',   'Modificar datos de clientes'),
    ('clientes', 'eliminar', 'Desactivar clientes'),
    -- Pacientes
    ('pacientes', 'crear',    'Registrar nuevos pacientes'),
    ('pacientes', 'leer',     'Ver listado e historial de pacientes'),
    ('pacientes', 'editar',   'Modificar datos de pacientes'),
    ('pacientes', 'eliminar', 'Desactivar pacientes'),
    -- Consultas
    ('consultas', 'crear',    'Registrar consultas médicas'),
    ('consultas', 'leer',     'Ver consultas y diagnósticos'),
    ('consultas', 'editar',   'Modificar consultas'),
    ('consultas', 'eliminar', 'Anular consultas'),
    -- Citas
    ('citas', 'crear',    'Programar citas'),
    ('citas', 'leer',     'Ver agenda de citas'),
    ('citas', 'editar',   'Modificar o cancelar citas'),
    ('citas', 'eliminar', 'Eliminar citas'),
    -- Vacunaciones
    ('vacunaciones', 'crear',  'Registrar vacunaciones aplicadas'),
    ('vacunaciones', 'leer',   'Ver historial de vacunas'),
    ('vacunaciones', 'editar', 'Corregir registros de vacunación'),
    -- Facturación
    ('facturas', 'crear',    'Emitir facturas'),
    ('facturas', 'leer',     'Ver facturas y pagos'),
    ('facturas', 'editar',   'Modificar facturas en borrador'),
    ('facturas', 'anular',   'Anular facturas emitidas'),
    -- Productos / Inventario
    ('productos', 'crear',    'Agregar productos al inventario'),
    ('productos', 'leer',     'Ver inventario y precios'),
    ('productos', 'editar',   'Modificar productos e inventario'),
    ('productos', 'eliminar', 'Desactivar productos'),
    -- Dashboard
    ('dashboard', 'leer', 'Ver métricas y reportes del dashboard'),
    -- Configuración
    ('configuracion', 'leer',  'Ver configuración del sistema'),
    ('configuracion', 'editar','Modificar configuración del sistema');

-- -----------------------------------------------------------------------------
-- ASIGNACIÓN PERMISOS A ROLES
-- -----------------------------------------------------------------------------

-- Admin: todos los permisos
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'Admin';

-- Veterinario: clientes (leer), pacientes (todos), consultas (todos), vacunaciones (todos), citas (todos), productos (leer), dashboard (leer)
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON (
    (p.recurso = 'clientes'      AND p.accion IN ('leer', 'editar')) OR
    (p.recurso = 'pacientes'     AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'consultas'     AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'citas'         AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'vacunaciones'  AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'productos'     AND p.accion = 'leer') OR
    (p.recurso = 'dashboard'     AND p.accion = 'leer')
)
WHERE r.nombre = 'Veterinario';

-- Recepcionista: clientes (todos), pacientes (crear/leer), citas (todos), facturas (crear/leer/editar), productos (leer)
INSERT INTO roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON (
    (p.recurso = 'clientes'  AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'pacientes' AND p.accion IN ('crear', 'leer')) OR
    (p.recurso = 'citas'     AND p.accion IN ('crear', 'leer', 'editar', 'eliminar')) OR
    (p.recurso = 'facturas'  AND p.accion IN ('crear', 'leer', 'editar')) OR
    (p.recurso = 'productos' AND p.accion = 'leer') OR
    (p.recurso = 'dashboard' AND p.accion = 'leer')
)
WHERE r.nombre = 'Recepcionista';

-- -----------------------------------------------------------------------------
-- USUARIO ADMINISTRADOR INICIAL
-- (password: Admin2026! → hash bcrypt de ejemplo)
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono)
SELECT id, 'Administrador', 'Sistema', 'admin@veterinaria.com',
       '$2b$12$LRtJEbEHFNpRBx0VvkBOIOQe2s/7xhLl4bUHPJj5b7kFtFCNY7dK2',
       '+1-000-000-0000'
FROM roles WHERE nombre = 'Admin';

-- -----------------------------------------------------------------------------
-- ESPECIES Y COLORES DE ACENTO (para UI)
-- -----------------------------------------------------------------------------
INSERT INTO especies (nombre, icono, color_acento) VALUES
    ('Perro',    'dog',   '#D4850A'),  -- ámbar cálido
    ('Gato',     'cat',   '#6B48B8'),  -- índigo
    ('Ave',      'bird',  '#0891B2'),  -- cian
    ('Conejo',   'rabbit','#DB6A8C'),  -- rosa coral
    ('Hámster',  'mouse', '#7C6F5B'),  -- arena
    ('Reptil',   'snake', '#4D7C0F'),  -- verde musgo
    ('Pez',      'fish',  '#0369A1'),  -- azul profundo
    ('Exótico',  'star',  '#C2410C');  -- naranja quemado

-- -----------------------------------------------------------------------------
-- RAZAS — Perro (selección representativa)
-- -----------------------------------------------------------------------------
INSERT INTO razas (especie_id, nombre)
SELECT e.id, r.nombre
FROM especies e, (VALUES
    ('Labrador Retriever'), ('Golden Retriever'), ('Pastor Alemán'),
    ('Bulldog Francés'), ('Beagle'), ('Poodle'), ('Chihuahua'),
    ('Shih Tzu'), ('Schnauzer'), ('Dálmata'), ('Husky Siberiano'),
    ('Yorkshire Terrier'), ('Boxer'), ('Rottweiler'), ('Mestizo')
) AS r(nombre)
WHERE e.nombre = 'Perro';

-- Razas — Gato
INSERT INTO razas (especie_id, nombre)
SELECT e.id, r.nombre
FROM especies e, (VALUES
    ('Persa'), ('Siamés'), ('Maine Coon'), ('Bengalí'), ('Ragdoll'),
    ('Angora'), ('Esfinge'), ('Británico de Pelo Corto'), ('Mestizo')
) AS r(nombre)
WHERE e.nombre = 'Gato';

-- -----------------------------------------------------------------------------
-- SERVICIOS
-- -----------------------------------------------------------------------------
INSERT INTO servicios (nombre, descripcion, categoria, precio_base, duracion_minutos) VALUES
    -- Consultas
    ('Consulta General',         'Examen clínico general y diagnóstico',                   'Consulta',    35.00, 30),
    ('Consulta Urgencia',        'Atención de emergencia fuera de horario',                 'Consulta',    60.00, 45),
    ('Consulta Seguimiento',     'Control y seguimiento de tratamiento previo',             'Consulta',    25.00, 20),
    -- Vacunaciones
    ('Vacunación Antirrábica',   'Aplicación de vacuna antirrábica',                        'Vacunación',  20.00, 15),
    ('Vacunación Polivalente',   'Vacuna múltiple (DA2PP o similar)',                       'Vacunación',  25.00, 15),
    ('Vacunación Felina',        'Vacuna triple felina (RCP)',                              'Vacunación',  22.00, 15),
    -- Cirugías
    ('Castración Macho',         'Orquiectomía bilateral',                                  'Cirugía',    120.00, 60),
    ('Esterilización Hembra',    'Ovariohisterectomía',                                    'Cirugía',    150.00, 90),
    ('Cirugía Menor',            'Suturas, extirpación de masas pequeñas, etc.',            'Cirugía',     80.00, 45),
    -- Laboratorio
    ('Hemograma Completo',       'Análisis completo de sangre',                             'Laboratorio', 30.00, 10),
    ('Perfil Bioquímico',        'Enzimas hepáticas, renales y electrolitos',               'Laboratorio', 45.00, 10),
    ('Urianálisis',              'Análisis físico, químico y microscópico de orina',        'Laboratorio', 20.00, 10),
    ('Ecografía Abdominal',      'Ultrasonido de cavidad abdominal',                        'Laboratorio', 55.00, 25),
    -- Estética / Peluquería
    ('Baño y Secado',            'Baño completo, secado y perfume',                         'Estética',    25.00, 60),
    ('Corte de Pelo',            'Corte estético según raza',                               'Estética',    35.00, 90),
    ('Corte de Uñas',            'Recorte y limado de uñas',                                'Estética',    10.00, 15),
    -- Preventivo
    ('Desparasitación Interna',  'Administración de antiparasitario interno',               'Preventivo',  15.00, 10),
    ('Desparasitación Externa',  'Aplicación de antipulgas / garrapatas',                   'Preventivo',  12.00, 10),
    ('Microchipado',             'Implante de microchip y registro',                        'Preventivo',  30.00, 15),
    ('Limpieza Dental',          'Profilaxis dental y remoción de sarro',                   'Cirugía',     75.00, 45);

-- -----------------------------------------------------------------------------
-- MÉTODOS DE PAGO
-- -----------------------------------------------------------------------------
INSERT INTO metodos_pago (nombre) VALUES
    ('Efectivo'),
    ('Tarjeta Débito'),
    ('Tarjeta Crédito'),
    ('Transferencia Bancaria'),
    ('Pago Móvil'),
    ('Cheque');

-- -----------------------------------------------------------------------------
-- CATEGORÍAS DE PRODUCTO
-- -----------------------------------------------------------------------------
INSERT INTO categorias_producto (nombre) VALUES
    ('Medicamentos'),
    ('Vacunas'),
    ('Antiparasitarios'),
    ('Suplementos'),
    ('Alimentos Especiales'),
    ('Accesorios'),
    ('Insumos Clínicos');

-- -----------------------------------------------------------------------------
-- PRODUCTOS (inventario farmacia — muestra)
-- -----------------------------------------------------------------------------
INSERT INTO productos (categoria_id, nombre, unidad_medida, precio_venta, precio_costo, stock_actual, stock_minimo, requiere_receta) VALUES
    ((SELECT id FROM categorias_producto WHERE nombre = 'Antiparasitarios'),
     'Ivermectina 1% 50ml',   'frasco', 18.50, 10.00, 12, 5, TRUE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Antiparasitarios'),
     'Frontline Plus Perro M', 'pipeta',  22.00, 12.50,  8, 10, FALSE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Medicamentos'),
     'Amoxicilina 250mg x 20 caps', 'caja', 12.00,  6.50, 25, 10, TRUE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Medicamentos'),
     'Meloxicam 1.5mg/ml 10ml', 'frasco', 15.00,  8.00, 15,  5, TRUE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Suplementos'),
     'Omega 3 Canino 60 caps',  'frasco', 20.00, 11.00,  6, 10, FALSE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Alimentos Especiales'),
     'Royal Canin Renal Feline 400g', 'bolsa', 18.00, 10.00, 4, 8, FALSE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Insumos Clínicos'),
     'Jeringa 3ml (caja x 100)', 'caja',   8.50,  4.00, 20, 5, FALSE),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Insumos Clínicos'),
     'Guantes de nitrilo M (caja x 100)', 'caja', 9.00, 5.00, 3, 5, FALSE);

-- Productos bajo stock (para probar alertas del dashboard)
INSERT INTO productos (categoria_id, nombre, unidad_medida, precio_venta, precio_costo, stock_actual, stock_minimo) VALUES
    ((SELECT id FROM categorias_producto WHERE nombre = 'Vacunas'),
     'Vacuna Antirrábica Nobivac', 'dosis', 14.00, 7.50, 2, 10),
    ((SELECT id FROM categorias_producto WHERE nombre = 'Medicamentos'),
     'Suero Fisiológico 500ml',    'bolsa', 3.50,  1.80, 1, 8);
