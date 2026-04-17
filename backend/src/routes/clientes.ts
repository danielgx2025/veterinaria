import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

// GET /api/clientes
router.get('/', verificarToken, requierePermiso('clientes', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const params: unknown[] = [];
    let where = 'cl.activo = TRUE';

    if (q) {
      where += ` AND (cl.nombre ILIKE $1 OR cl.apellido ILIKE $1 OR cl.email ILIKE $1 OR cl.documento_identidad ILIKE $1)`;
      params.push(`%${q}%`);
    }

    params.push(Number(limit), offset);
    const li = params.length - 1;

    const resultado = await pool.query(
      `SELECT cl.*,
              COUNT(DISTINCT pa.id) AS total_mascotas,
              MAX(pa.fecha_creacion) AS ultima_mascota_registrada
       FROM clientes cl
       LEFT JOIN pacientes pa ON pa.cliente_id = cl.id AND pa.activo = TRUE
       WHERE ${where}
       GROUP BY cl.id
       ORDER BY cl.fecha_creacion DESC
       LIMIT $${li} OFFSET $${li + 1}`,
      params
    );

    res.json(resultado.rows);
  }
);

// GET /api/clientes/:id
router.get('/:id', verificarToken, requierePermiso('clientes', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const cliente = await pool.query(
      'SELECT * FROM clientes WHERE id = $1 AND activo = TRUE',
      [req.params.id]
    );

    if (!cliente.rows[0]) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    const mascotas = await pool.query(
      `SELECT pa.id, pa.nombre, es.nombre AS especie, es.color_acento,
              pa.foto_url, pa.activo, pa.fallecido
       FROM pacientes pa JOIN especies es ON es.id = pa.especie_id
       WHERE pa.cliente_id = $1 ORDER BY pa.nombre`,
      [req.params.id]
    );

    const facturas = await pool.query(
      `SELECT id, numero_factura, fecha_emision, total, estado
       FROM facturas WHERE cliente_id = $1 AND activo = TRUE
       ORDER BY fecha_emision DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({
      ...cliente.rows[0],
      mascotas: mascotas.rows,
      facturas_recientes: facturas.rows,
    });
  }
);

// POST /api/clientes
router.post('/', verificarToken, requierePermiso('clientes', 'crear'),
  async (req: Request, res: Response): Promise<void> => {
    const {
      nombre, apellido, email, telefono, telefono_alternativo,
      direccion, ciudad, documento_identidad, notas
    } = req.body;

    if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !telefono?.trim() || !documento_identidad?.trim()) {
      res.status(400).json({ error: 'Campos obligatorios: nombre, apellido, email, teléfono, documento_identidad' });
      return;
    }

    const resultado = await pool.query(
      `INSERT INTO clientes
         (nombre, apellido, email, telefono, telefono_alternativo,
          direccion, ciudad, documento_identidad, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [nombre, apellido, email, telefono, telefono_alternativo,
       direccion, ciudad, documento_identidad, notas]
    );

    res.status(201).json(resultado.rows[0]);
  }
);

// PUT /api/clientes/:id
router.put('/:id', verificarToken, requierePermiso('clientes', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const {
      nombre, apellido, email, telefono, telefono_alternativo,
      direccion, ciudad, documento_identidad, notas
    } = req.body;

    const resultado = await pool.query(
      `UPDATE clientes SET
         nombre=$1, apellido=$2, email=$3, telefono=$4,
         telefono_alternativo=$5, direccion=$6, ciudad=$7,
         documento_identidad=$8, notas=$9
       WHERE id=$10 AND activo=TRUE RETURNING *`,
      [nombre, apellido, email, telefono, telefono_alternativo,
       direccion, ciudad, documento_identidad, notas, req.params.id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }
    res.json(resultado.rows[0]);
  }
);

// PATCH /api/clientes/:id/desactivar
router.patch('/:id/desactivar', verificarToken, requierePermiso('clientes', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      'UPDATE clientes SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id',
      [req.params.id]
    );
    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }
    res.status(204).send();
  }
);

export default router;
