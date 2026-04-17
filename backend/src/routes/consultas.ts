import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

// GET /api/consultas
router.get('/', verificarToken, requierePermiso('consultas', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const { paciente_id, veterinario_id, fecha_desde, fecha_hasta, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const condiciones = ['c.activo = TRUE'];
    const params: unknown[] = [];
    let idx = 1;

    if (paciente_id) { condiciones.push(`c.paciente_id = $${idx++}`); params.push(paciente_id); }
    if (veterinario_id) { condiciones.push(`c.veterinario_id = $${idx++}`); params.push(veterinario_id); }
    if (fecha_desde) { condiciones.push(`c.fecha_hora >= $${idx++}`); params.push(fecha_desde); }
    if (fecha_hasta) { condiciones.push(`c.fecha_hora <= $${idx++}`); params.push(fecha_hasta); }

    params.push(Number(limit), offset);
    const where = condiciones.join(' AND ');

    const resultado = await pool.query(
      `SELECT c.id, c.fecha_hora, c.motivo_consulta, c.diagnostico, c.estado,
              c.peso_al_consulta, c.temperatura_c,
              pa.nombre AS paciente, es.nombre AS especie, es.color_acento,
              cl.nombre || ' ' || cl.apellido AS dueño,
              u.nombre || ' ' || u.apellido AS veterinario,
              s.nombre AS servicio
       FROM consultas c
       JOIN pacientes pa ON pa.id = c.paciente_id
       JOIN especies es ON es.id = pa.especie_id
       JOIN clientes cl ON cl.id = pa.cliente_id
       JOIN usuarios u ON u.id = c.veterinario_id
       LEFT JOIN servicios s ON s.id = c.servicio_id
       WHERE ${where}
       ORDER BY c.fecha_hora DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json(resultado.rows);
  }
);

// GET /api/consultas/:id
router.get('/:id', verificarToken, requierePermiso('consultas', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT c.*, pa.nombre AS paciente, pa.peso_kg AS peso_base,
              es.nombre AS especie, r.nombre AS raza,
              cl.nombre || ' ' || cl.apellido AS dueño, cl.telefono AS dueño_telefono,
              u.nombre || ' ' || u.apellido AS veterinario,
              s.nombre AS servicio, s.categoria
       FROM consultas c
       JOIN pacientes pa ON pa.id = c.paciente_id
       JOIN especies es ON es.id = pa.especie_id
       JOIN clientes cl ON cl.id = pa.cliente_id
       JOIN usuarios u ON u.id = c.veterinario_id
       LEFT JOIN razas r ON r.id = pa.raza_id
       LEFT JOIN servicios s ON s.id = c.servicio_id
       WHERE c.id = $1 AND c.activo = TRUE`,
      [req.params.id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }
    res.json(resultado.rows[0]);
  }
);

// POST /api/consultas
router.post('/', verificarToken, requierePermiso('consultas', 'crear'),
  async (req: Request, res: Response): Promise<void> => {
    const {
      paciente_id, servicio_id, cita_id, motivo_consulta, anamnesis,
      examen_fisico, diagnostico, diagnostico_cie, tratamiento, indicaciones,
      observaciones, peso_al_consulta, temperatura_c, frecuencia_cardiaca,
      frecuencia_respiratoria, estado
    } = req.body;

    if (!paciente_id || !motivo_consulta?.trim()) {
      res.status(400).json({ error: 'paciente_id y motivo_consulta son obligatorios' });
      return;
    }

    const veterinario_id = req.usuario!.userId;

    const resultado = await pool.query(
      `INSERT INTO consultas
         (paciente_id, veterinario_id, cita_id, servicio_id, motivo_consulta,
          anamnesis, examen_fisico, diagnostico, diagnostico_cie, tratamiento,
          indicaciones, observaciones, peso_al_consulta, temperatura_c,
          frecuencia_cardiaca, frecuencia_respiratoria, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [paciente_id, veterinario_id, cita_id || null, servicio_id || null,
       motivo_consulta.trim(), anamnesis || null, examen_fisico || null,
       diagnostico || null, diagnostico_cie || null, tratamiento || null,
       indicaciones || null, observaciones || null,
       peso_al_consulta || null, temperatura_c || null,
       frecuencia_cardiaca || null, frecuencia_respiratoria || null,
       estado || 'en_curso']
    );

    await pool.query(
      `INSERT INTO historial_clinico (paciente_id, consulta_id, tipo_evento, descripcion)
       VALUES ($1, $2, 'consulta', $3)`,
      [paciente_id, resultado.rows[0].id, `Consulta: ${motivo_consulta.trim()}`]
    );

    res.status(201).json(resultado.rows[0]);
  }
);

// PUT /api/consultas/:id
router.put('/:id', verificarToken, requierePermiso('consultas', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const {
      servicio_id, motivo_consulta, anamnesis, examen_fisico, diagnostico,
      diagnostico_cie, tratamiento, indicaciones, observaciones, estado,
      peso_al_consulta, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria
    } = req.body;

    if (!motivo_consulta?.trim()) {
      res.status(400).json({ error: 'motivo_consulta es obligatorio' });
      return;
    }

    const resultado = await pool.query(
      `UPDATE consultas SET
         servicio_id = $1, motivo_consulta = $2, anamnesis = $3,
         examen_fisico = $4, diagnostico = $5, diagnostico_cie = $6,
         tratamiento = $7, indicaciones = $8, observaciones = $9,
         estado = $10, peso_al_consulta = $11, temperatura_c = $12,
         frecuencia_cardiaca = $13, frecuencia_respiratoria = $14
       WHERE id = $15 AND activo = TRUE
       RETURNING *`,
      [servicio_id || null, motivo_consulta.trim(), anamnesis || null,
       examen_fisico || null, diagnostico || null, diagnostico_cie || null,
       tratamiento || null, indicaciones || null, observaciones || null,
       estado || 'en_curso',
       peso_al_consulta || null, temperatura_c || null,
       frecuencia_cardiaca || null, frecuencia_respiratoria || null,
       req.params.id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }
    res.json(resultado.rows[0]);
  }
);

// PATCH /api/consultas/:id/completar
router.patch('/:id/completar', verificarToken, requierePermiso('consultas', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `UPDATE consultas SET estado = 'completada'
       WHERE id = $1 AND activo = TRUE RETURNING *`,
      [req.params.id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }
    res.json(resultado.rows[0]);
  }
);

// PATCH /api/consultas/:id/desactivar
router.patch('/:id/desactivar', verificarToken, requierePermiso('consultas', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `UPDATE consultas SET activo = FALSE
       WHERE id = $1 AND activo = TRUE RETURNING id`,
      [req.params.id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }
    res.json({ ok: true });
  }
);

export default router;
