import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

// GET /api/facturas
router.get('/', verificarToken, requierePermiso('facturas', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const { cliente_id, estado, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const condiciones = ['f.activo = TRUE'];
    const params: unknown[] = [];
    let idx = 1;

    if (cliente_id) { condiciones.push(`f.cliente_id = $${idx++}`); params.push(cliente_id); }
    if (estado) { condiciones.push(`f.estado = $${idx++}`); params.push(estado); }

    params.push(Number(limit), offset);
    const where = condiciones.join(' AND ');

    const resultado = await pool.query(
      `SELECT f.id, f.numero_factura, f.fecha_emision, f.subtotal, f.descuento,
              f.impuesto, f.total, f.estado,
              cl.nombre || ' ' || cl.apellido AS cliente, cl.email AS cliente_email,
              u.nombre || ' ' || u.apellido AS emitida_por,
              COALESCE(SUM(p.monto), 0) AS total_pagado
       FROM facturas f
       JOIN clientes cl ON cl.id = f.cliente_id
       JOIN usuarios u ON u.id = f.usuario_id
       LEFT JOIN pagos p ON p.factura_id = f.id AND p.activo = TRUE
       WHERE ${where}
       GROUP BY f.id, cl.nombre, cl.apellido, cl.email, u.nombre, u.apellido
       ORDER BY f.fecha_emision DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json(resultado.rows);
  }
);

// GET /api/facturas/:id
router.get('/:id', verificarToken, requierePermiso('facturas', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const factura = await pool.query(
      `SELECT f.*, cl.nombre || ' ' || cl.apellido AS cliente,
              cl.email, cl.telefono, cl.direccion, cl.ciudad,
              u.nombre || ' ' || u.apellido AS emitida_por
       FROM facturas f
       JOIN clientes cl ON cl.id = f.cliente_id
       JOIN usuarios u ON u.id = f.usuario_id
       WHERE f.id = $1 AND f.activo = TRUE`,
      [req.params.id]
    );

    if (!factura.rows[0]) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }

    const detalles = await pool.query(
      `SELECT df.*, s.nombre AS servicio_nombre, p.nombre AS producto_nombre
       FROM detalle_factura df
       LEFT JOIN servicios s ON s.id = df.servicio_id
       LEFT JOIN productos p ON p.id = df.producto_id
       WHERE df.factura_id = $1`,
      [req.params.id]
    );

    const pagos = await pool.query(
      `SELECT pg.monto, pg.fecha_pago, pg.referencia, mp.nombre AS metodo
       FROM pagos pg JOIN metodos_pago mp ON mp.id = pg.metodo_pago_id
       WHERE pg.factura_id = $1 AND pg.activo = TRUE
       ORDER BY pg.fecha_pago`,
      [req.params.id]
    );

    res.json({ ...factura.rows[0], detalles: detalles.rows, pagos: pagos.rows });
  }
);

// POST /api/facturas
router.post('/', verificarToken, requierePermiso('facturas', 'crear'),
  async (req: Request, res: Response): Promise<void> => {
    const { cliente_id, items, descuento = 0, impuesto = 0, notas } = req.body;
    const usuario_id = req.usuario!.userId;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Número de factura auto-generado
      const numResult = await client.query(
        `SELECT 'FAC-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                LPAD((COUNT(*) + 1)::TEXT, 6, '0') AS numero
         FROM facturas WHERE EXTRACT(YEAR FROM fecha_emision) = EXTRACT(YEAR FROM NOW())`
      );
      const numero_factura = numResult.rows[0].numero;

      // Calcular subtotal
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precio_unitario - (item.descuento || 0);
      }
      const total = subtotal - Number(descuento) + Number(impuesto);

      const facturaResult = await client.query(
        `INSERT INTO facturas (cliente_id, usuario_id, numero_factura, subtotal, descuento, impuesto, total, notas)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [cliente_id, usuario_id, numero_factura, subtotal, descuento, impuesto, total, notas]
      );

      const factura = facturaResult.rows[0];

      for (const item of items) {
        const itemSubtotal = item.cantidad * item.precio_unitario - (item.descuento || 0);
        await client.query(
          `INSERT INTO detalle_factura
             (factura_id, consulta_id, producto_id, servicio_id, descripcion,
              cantidad, precio_unitario, descuento, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [factura.id, item.consulta_id, item.producto_id, item.servicio_id,
           item.descripcion, item.cantidad, item.precio_unitario,
           item.descuento || 0, itemSubtotal]
        );

        // Descontar stock si es producto
        if (item.producto_id) {
          await client.query(
            `UPDATE productos SET stock_actual = stock_actual - $1
             WHERE id = $2 AND stock_actual >= $1`,
            [item.cantidad, item.producto_id]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(factura);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

// POST /api/facturas/:id/pagos — registrar pago
router.post('/:id/pagos', verificarToken, requierePermiso('facturas', 'crear'),
  async (req: Request, res: Response): Promise<void> => {
    const { monto, metodo_pago_id, referencia, observaciones } = req.body;

    const pago = await pool.query(
      `INSERT INTO pagos (factura_id, metodo_pago_id, monto, referencia, observaciones)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, metodo_pago_id, monto, referencia, observaciones]
    );

    // Actualizar estado de factura
    await pool.query(
      `UPDATE facturas SET estado =
         CASE
           WHEN (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE factura_id=$1 AND activo=TRUE) >= total
           THEN 'pagada'
           ELSE 'parcial'
         END
       WHERE id=$1`,
      [req.params.id]
    );

    res.status(201).json(pago.rows[0]);
  }
);

// PATCH /api/facturas/:id/anular
router.patch('/:id/anular', verificarToken, requierePermiso('facturas', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `UPDATE facturas SET estado = 'anulada'
       WHERE id = $1 AND activo = TRUE AND estado != 'anulada' RETURNING id`,
      [req.params.id]
    );
    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Factura no encontrada o ya anulada' });
      return;
    }
    res.status(204).send();
  }
);

export default router;
