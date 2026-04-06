-- =============================================================================
-- SISTEMA DE GESTIÓN VETERINARIA — Consultas del Dashboard Administrativo
-- =============================================================================
-- Uso: Estas queries alimentan las métricas en tiempo real del dashboard.
-- Parámetros: Reemplazar :año y :mes con los valores actuales (ej: 2026, 3)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- MÉTRICA 1: Ingresos totales del mes actual vs mes anterior
-- Retorna: total_mes_actual, total_mes_anterior, variacion_porcentual
-- -----------------------------------------------------------------------------
SELECT
    COALESCE(SUM(p.monto) FILTER (
        WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW())
    ), 0) AS total_mes_actual,

    COALESCE(SUM(p.monto) FILTER (
        WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
    ), 0) AS total_mes_anterior,

    ROUND(
        (
            COALESCE(SUM(p.monto) FILTER (
                WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW())
            ), 0)
            -
            COALESCE(SUM(p.monto) FILTER (
                WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
            ), 0)
        )
        / NULLIF(
            COALESCE(SUM(p.monto) FILTER (
                WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
            ), 0),
        0) * 100,
    2) AS variacion_porcentual

FROM pagos p
WHERE p.activo = TRUE;


-- -----------------------------------------------------------------------------
-- MÉTRICA 2: Ingresos diarios — últimos 30 días (para gráfico de línea)
-- Retorna: fecha, total_ingresos, num_pagos
-- -----------------------------------------------------------------------------
SELECT
    DATE(p.fecha_pago)              AS fecha,
    SUM(p.monto)                    AS total_ingresos,
    COUNT(*)                        AS num_pagos
FROM pagos p
WHERE p.activo = TRUE
  AND p.fecha_pago >= NOW() - INTERVAL '30 days'
GROUP BY DATE(p.fecha_pago)
ORDER BY fecha ASC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 3: Pacientes atendidos por día — últimos 30 días
-- Retorna: fecha, total_pacientes, total_consultas
-- -----------------------------------------------------------------------------
SELECT
    DATE(c.fecha_hora)                        AS fecha,
    COUNT(DISTINCT c.paciente_id)             AS total_pacientes,
    COUNT(*)                                  AS total_consultas
FROM consultas c
WHERE c.activo = TRUE
  AND c.estado IN ('completada', 'en_curso')
  AND c.fecha_hora >= NOW() - INTERVAL '30 days'
GROUP BY DATE(c.fecha_hora)
ORDER BY fecha ASC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 4: Ranking de servicios más solicitados (top 10)
-- Retorna: servicio, categoria, total_consultas, total_facturado
-- -----------------------------------------------------------------------------
SELECT
    s.nombre                       AS servicio,
    s.categoria,
    COUNT(c.id)                    AS total_consultas,
    COALESCE(SUM(df.subtotal), 0)  AS total_facturado
FROM servicios s
LEFT JOIN consultas c
    ON c.servicio_id = s.id
    AND c.activo = TRUE
    AND c.fecha_hora >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months'
LEFT JOIN detalle_factura df
    ON df.servicio_id = s.id
    AND df.factura_id IN (
        SELECT id FROM facturas
        WHERE fecha_emision >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months'
          AND activo = TRUE
    )
WHERE s.activo = TRUE
GROUP BY s.id, s.nombre, s.categoria
ORDER BY total_consultas DESC
LIMIT 10;


-- -----------------------------------------------------------------------------
-- MÉTRICA 5: Alertas de stock bajo en farmacia
-- Retorna: producto, categoria, stock_actual, stock_minimo, diferencia
-- -----------------------------------------------------------------------------
SELECT
    p.nombre                               AS producto,
    cp.nombre                              AS categoria,
    p.stock_actual,
    p.stock_minimo,
    p.stock_minimo - p.stock_actual        AS unidades_faltantes,
    CASE
        WHEN p.stock_actual = 0 THEN 'sin_stock'
        WHEN p.stock_actual <= p.stock_minimo * 0.5 THEN 'critico'
        ELSE 'bajo'
    END                                    AS nivel_alerta,
    p.precio_costo * (p.stock_minimo - p.stock_actual) AS costo_reabastecimiento
FROM productos p
LEFT JOIN categorias_producto cp ON cp.id = p.categoria_id
WHERE p.activo = TRUE
  AND p.stock_actual <= p.stock_minimo
ORDER BY p.stock_actual ASC, p.stock_minimo DESC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 6: Citas del día — vista agenda
-- Retorna: hora, paciente, especie, servicio, veterinario, estado
-- -----------------------------------------------------------------------------
SELECT
    ci.fecha_hora_inicio,
    ci.fecha_hora_fin,
    pa.nombre                              AS paciente,
    es.nombre                              AS especie,
    es.color_acento                        AS color_especie,
    sv.nombre                              AS servicio,
    u.nombre || ' ' || u.apellido          AS veterinario,
    cl.nombre || ' ' || cl.apellido        AS dueño,
    cl.telefono,
    ci.estado,
    ci.notas
FROM citas ci
JOIN pacientes pa   ON pa.id = ci.paciente_id
JOIN especies es    ON es.id = pa.especie_id
JOIN usuarios u     ON u.id = ci.veterinario_id
JOIN clientes cl    ON cl.id = pa.cliente_id
LEFT JOIN servicios sv ON sv.id = ci.servicio_id
WHERE ci.activo = TRUE
  AND DATE(ci.fecha_hora_inicio) = CURRENT_DATE
ORDER BY ci.fecha_hora_inicio ASC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 7: Nuevos clientes y pacientes — últimos 12 meses (por mes)
-- Retorna: mes, nuevos_clientes, nuevos_pacientes (para gráfico de barras)
-- -----------------------------------------------------------------------------
SELECT
    TO_CHAR(DATE_TRUNC('month', serie.mes), 'YYYY-MM') AS mes,
    TO_CHAR(DATE_TRUNC('month', serie.mes), 'Mon YYYY') AS mes_label,
    COUNT(DISTINCT cl.id)                AS nuevos_clientes,
    COUNT(DISTINCT pa.id)                AS nuevos_pacientes
FROM
    generate_series(
        DATE_TRUNC('month', NOW()) - INTERVAL '11 months',
        DATE_TRUNC('month', NOW()),
        '1 month'::interval
    ) AS serie(mes)
LEFT JOIN clientes cl
    ON DATE_TRUNC('month', cl.fecha_creacion) = serie.mes
    AND cl.activo = TRUE
LEFT JOIN pacientes pa
    ON DATE_TRUNC('month', pa.fecha_creacion) = serie.mes
    AND pa.activo = TRUE
GROUP BY serie.mes
ORDER BY serie.mes ASC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 8: Ingresos y consultas por veterinario — mes actual
-- Retorna: veterinario, total_consultas, total_facturado, promedio_por_consulta
-- -----------------------------------------------------------------------------
SELECT
    u.nombre || ' ' || u.apellido          AS veterinario,
    u.email,
    COUNT(DISTINCT c.id)                   AS total_consultas,
    COALESCE(SUM(f.total), 0)              AS total_facturado,
    ROUND(COALESCE(AVG(f.total), 0), 2)    AS promedio_factura
FROM usuarios u
JOIN roles r ON r.id = u.rol_id AND r.nombre = 'Veterinario'
LEFT JOIN consultas c
    ON c.veterinario_id = u.id
    AND c.activo = TRUE
    AND DATE_TRUNC('month', c.fecha_hora) = DATE_TRUNC('month', NOW())
LEFT JOIN facturas f
    ON f.cliente_id IN (
        SELECT pa.cliente_id FROM pacientes pa
        JOIN consultas cc ON cc.paciente_id = pa.id
        WHERE cc.veterinario_id = u.id
    )
    AND DATE_TRUNC('month', f.fecha_emision) = DATE_TRUNC('month', NOW())
    AND f.activo = TRUE
WHERE u.activo = TRUE
GROUP BY u.id, u.nombre, u.apellido, u.email
ORDER BY total_consultas DESC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 9: Pacientes con vacunas vencidas o próximas a vencer (30 días)
-- Retorna: paciente, especie, dueño, vacuna, fecha_proxima, dias_restantes
-- -----------------------------------------------------------------------------
SELECT
    pa.nombre                              AS paciente,
    es.nombre                              AS especie,
    cl.nombre || ' ' || cl.apellido        AS dueño,
    cl.telefono,
    v.nombre                               AS vacuna,
    va.proxima_dosis,
    (va.proxima_dosis - CURRENT_DATE)      AS dias_restantes,
    CASE
        WHEN va.proxima_dosis < CURRENT_DATE          THEN 'vencida'
        WHEN va.proxima_dosis <= CURRENT_DATE + 7     THEN 'urgente'
        WHEN va.proxima_dosis <= CURRENT_DATE + 30    THEN 'proxima'
        ELSE 'al_dia'
    END                                    AS estado_vacuna
FROM vacunaciones va
JOIN pacientes pa   ON pa.id = va.paciente_id
JOIN especies es    ON es.id = pa.especie_id
JOIN clientes cl    ON cl.id = pa.cliente_id
JOIN vacunas v      ON v.id = va.vacuna_id
WHERE va.activo = TRUE
  AND pa.activo = TRUE
  AND pa.fallecido = FALSE
  AND va.proxima_dosis <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY va.proxima_dosis ASC;


-- -----------------------------------------------------------------------------
-- MÉTRICA 10: Resumen general (KPIs del día)
-- Retorna: una fila con los contadores principales para el header del dashboard
-- -----------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM citas
     WHERE DATE(fecha_hora_inicio) = CURRENT_DATE AND activo = TRUE) AS citas_hoy,

    (SELECT COUNT(*) FROM consultas
     WHERE DATE(fecha_hora) = CURRENT_DATE AND activo = TRUE
       AND estado IN ('completada', 'en_curso')) AS consultas_hoy,

    (SELECT COALESCE(SUM(monto), 0) FROM pagos
     WHERE DATE(fecha_pago) = CURRENT_DATE AND activo = TRUE) AS ingresos_hoy,

    (SELECT COUNT(*) FROM pacientes
     WHERE activo = TRUE AND fallecido = FALSE) AS total_pacientes_activos,

    (SELECT COUNT(*) FROM productos
     WHERE activo = TRUE AND stock_actual <= stock_minimo) AS alertas_stock,

    (SELECT COUNT(*) FROM facturas
     WHERE estado = 'pendiente' AND activo = TRUE) AS facturas_pendientes;
