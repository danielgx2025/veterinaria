import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

// GET /api/dashboard/kpis — KPIs del día
router.get('/kpis', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
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
         WHERE estado = 'pendiente' AND activo = TRUE) AS facturas_pendientes
    `);
    res.json(resultado.rows[0]);
  }
);

// GET /api/dashboard/ingresos-mensuales
router.get('/ingresos-mensuales', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
      SELECT
        COALESCE(SUM(p.monto) FILTER (
          WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW())
        ), 0) AS total_mes_actual,
        COALESCE(SUM(p.monto) FILTER (
          WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
        ), 0) AS total_mes_anterior
      FROM pagos p WHERE p.activo = TRUE
    `);
    res.json(resultado.rows[0]);
  }
);

// GET /api/dashboard/ingresos-diarios
router.get('/ingresos-diarios', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
      SELECT DATE(p.fecha_pago) AS fecha, SUM(p.monto) AS total, COUNT(*) AS num_pagos
      FROM pagos p
      WHERE p.activo = TRUE AND p.fecha_pago >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(p.fecha_pago) ORDER BY fecha ASC
    `);
    res.json(resultado.rows);
  }
);

// GET /api/dashboard/servicios-ranking
router.get('/servicios-ranking', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
      SELECT s.nombre, s.categoria, COUNT(c.id) AS total_consultas
      FROM servicios s
      LEFT JOIN consultas c ON c.servicio_id = s.id AND c.activo = TRUE
        AND c.fecha_hora >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months'
      WHERE s.activo = TRUE
      GROUP BY s.id, s.nombre, s.categoria
      ORDER BY total_consultas DESC LIMIT 10
    `);
    res.json(resultado.rows);
  }
);

// GET /api/dashboard/stock-bajo
router.get('/stock-bajo', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
      SELECT p.nombre, cp.nombre AS categoria, p.stock_actual, p.stock_minimo,
        CASE WHEN p.stock_actual = 0 THEN 'sin_stock'
             WHEN p.stock_actual <= p.stock_minimo * 0.5 THEN 'critico'
             ELSE 'bajo' END AS nivel_alerta
      FROM productos p
      LEFT JOIN categorias_producto cp ON cp.id = p.categoria_id
      WHERE p.activo = TRUE AND p.stock_actual <= p.stock_minimo
      ORDER BY p.stock_actual ASC
    `);
    res.json(resultado.rows);
  }
);

// GET /api/dashboard/vacunas-pendientes
router.get('/vacunas-pendientes', verificarToken, requierePermiso('dashboard', 'leer'),
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(`
      SELECT pa.nombre AS paciente, es.nombre AS especie, es.color_acento,
        cl.nombre || ' ' || cl.apellido AS dueño, cl.telefono,
        v.nombre AS vacuna, va.proxima_dosis,
        (va.proxima_dosis - CURRENT_DATE) AS dias_restantes,
        CASE WHEN va.proxima_dosis < CURRENT_DATE THEN 'vencida'
             WHEN va.proxima_dosis <= CURRENT_DATE + 7 THEN 'urgente'
             ELSE 'proxima' END AS estado
      FROM vacunaciones va
      JOIN pacientes pa ON pa.id = va.paciente_id
      JOIN especies es ON es.id = pa.especie_id
      JOIN clientes cl ON cl.id = pa.cliente_id
      JOIN vacunas v ON v.id = va.vacuna_id
      WHERE va.activo = TRUE AND pa.activo = TRUE AND pa.fallecido = FALSE
        AND va.proxima_dosis <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY va.proxima_dosis ASC
    `);
    res.json(resultado.rows);
  }
);

export default router;
