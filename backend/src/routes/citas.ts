import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';

const router = Router();

const CITA_SELECT = `
  SELECT c.id, c.paciente_id, c.veterinario_id, c.servicio_id,
         c.fecha_hora_inicio, c.fecha_hora_fin, c.estado, c.notas,
         p.nombre AS paciente,
         es.nombre AS especie, es.color_acento AS color_especie,
         cl.nombre || ' ' || cl.apellido AS "dueño", cl.telefono,
         u.nombre || ' ' || u.apellido AS veterinario,
         s.nombre AS servicio
  FROM citas c
  JOIN pacientes p ON p.id = c.paciente_id
  JOIN especies es ON es.id = p.especie_id
  JOIN clientes cl ON cl.id = p.cliente_id
  JOIN usuarios u ON u.id = c.veterinario_id
  LEFT JOIN servicios s ON s.id = c.servicio_id
  WHERE c.activo = TRUE
`;

// GET /api/citas?fecha=YYYY-MM-DD
router.get('/', verificarToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha } = req.query;
    let query = CITA_SELECT;
    const params: unknown[] = [];

    if (fecha) {
      query += ` AND c.fecha_hora_inicio::date = $1`;
      params.push(fecha);
    }

    query += ` ORDER BY c.fecha_hora_inicio ASC`;

    const resultado = await pool.query(query, params);
    res.json({ data: resultado.rows });
  } catch (error) {
    console.error('Error GET /citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// POST /api/citas
router.post('/', verificarToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { paciente_id, veterinario_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado = 'programada', notas } = req.body;

    if (!paciente_id || !veterinario_id || !fecha_hora_inicio || !fecha_hora_fin) {
      res.status(400).json({ error: 'Faltan campos requeridos: paciente_id, veterinario_id, fecha_hora_inicio, fecha_hora_fin' });
      return;
    }

    const resultado = await pool.query(
      `INSERT INTO citas (paciente_id, veterinario_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado, notas, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [paciente_id, veterinario_id, servicio_id || null, fecha_hora_inicio, fecha_hora_fin, estado, notas || null]
    );

    const nuevaId = resultado.rows[0].id;
    const citaCompleta = await pool.query(CITA_SELECT + ` AND c.id = $1`, [nuevaId]);
    res.status(201).json(citaCompleta.rows[0]);
  } catch (error) {
    console.error('Error POST /citas:', error);
    res.status(500).json({ error: 'Error al crear la cita. Verificá que el paciente y veterinario existan.' });
  }
});

// PUT /api/citas/:id
router.put('/:id', verificarToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paciente_id, veterinario_id, servicio_id, fecha_hora_inicio, fecha_hora_fin, estado, notas } = req.body;

    if (!paciente_id || !veterinario_id || !fecha_hora_inicio || !fecha_hora_fin) {
      res.status(400).json({ error: 'Faltan campos requeridos: paciente_id, veterinario_id, fecha_hora_inicio, fecha_hora_fin' });
      return;
    }

    const existe = await pool.query(`SELECT id FROM citas WHERE id = $1 AND activo = TRUE`, [id]);
    if (existe.rows.length === 0) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    await pool.query(
      `UPDATE citas SET
         paciente_id = $1, veterinario_id = $2, servicio_id = $3,
         fecha_hora_inicio = $4, fecha_hora_fin = $5,
         estado = $6, notas = $7
       WHERE id = $8 AND activo = TRUE`,
      [paciente_id, veterinario_id, servicio_id || null, fecha_hora_inicio, fecha_hora_fin, estado, notas || null, id]
    );

    const citaActualizada = await pool.query(CITA_SELECT + ` AND c.id = $1`, [id]);
    res.json(citaActualizada.rows[0]);
  } catch (error) {
    console.error('Error PUT /citas/:id:', error);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
});

// PATCH /api/citas/:id/cancelar  — soft delete
router.patch('/:id/cancelar', verificarToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existe = await pool.query(`SELECT id FROM citas WHERE id = $1 AND activo = TRUE`, [id]);
    if (existe.rows.length === 0) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    await pool.query(`UPDATE citas SET activo = FALSE WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error PATCH /citas/:id/cancelar:', error);
    res.status(500).json({ error: 'Error al cancelar la cita' });
  }
});

export default router;
