import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

// GET /api/pacientes — listado con búsqueda
router.get('/', verificarToken, requierePermiso('pacientes', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const { q, especie_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const condiciones: string[] = ['pa.activo = TRUE'];
    const params: unknown[] = [];
    let idx = 1;

    if (q) {
      condiciones.push(`(pa.nombre ILIKE $${idx} OR cl.nombre ILIKE $${idx} OR pa.microchip ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (especie_id) {
      condiciones.push(`pa.especie_id = $${idx}`);
      params.push(especie_id);
      idx++;
    }

    const where = condiciones.join(' AND ');
    params.push(Number(limit), offset);

    const resultado = await pool.query(
      `SELECT pa.id, pa.nombre, pa.sexo, pa.fecha_nacimiento, pa.peso_kg,
              pa.microchip, pa.esterilizado, pa.fallecido, pa.foto_url,
              es.nombre AS especie, es.color_acento,
              r.nombre AS raza,
              cl.id AS cliente_id, cl.nombre || ' ' || cl.apellido AS dueño,
              cl.telefono,
              (SELECT MAX(c.fecha_hora) FROM consultas c
               WHERE c.paciente_id = pa.id AND c.activo = TRUE) AS ultima_consulta
       FROM pacientes pa
       JOIN especies es ON es.id = pa.especie_id
       JOIN clientes cl ON cl.id = pa.cliente_id
       LEFT JOIN razas r ON r.id = pa.raza_id
       WHERE ${where}
       ORDER BY pa.fecha_creacion DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const total = await pool.query(
      `SELECT COUNT(*) FROM pacientes pa JOIN clientes cl ON cl.id = pa.cliente_id WHERE ${where}`,
      params.slice(0, -2)
    );

    res.json({
      data: resultado.rows,
      total: Number(total.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  }
);

// GET /api/pacientes/:id — detalle completo
router.get('/:id', verificarToken, requierePermiso('pacientes', 'leer'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const paciente = await pool.query(
      `SELECT pa.*, es.nombre AS especie, es.color_acento, r.nombre AS raza,
              cl.nombre || ' ' || cl.apellido AS dueño, cl.email AS dueño_email,
              cl.telefono AS dueño_telefono, cl.direccion AS dueño_direccion
       FROM pacientes pa
       JOIN especies es ON es.id = pa.especie_id
       JOIN clientes cl ON cl.id = pa.cliente_id
       LEFT JOIN razas r ON r.id = pa.raza_id
       WHERE pa.id = $1 AND pa.activo = TRUE`,
      [id]
    );

    if (!paciente.rows[0]) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    const consultas = await pool.query(
      `SELECT c.id, c.fecha_hora, c.motivo_consulta, c.diagnostico, c.estado,
              u.nombre || ' ' || u.apellido AS veterinario
       FROM consultas c JOIN usuarios u ON u.id = c.veterinario_id
       WHERE c.paciente_id = $1 AND c.activo = TRUE
       ORDER BY c.fecha_hora DESC LIMIT 5`,
      [id]
    );

    const vacunaciones = await pool.query(
      `SELECT va.fecha_aplicacion, va.proxima_dosis, v.nombre AS vacuna, va.lote
       FROM vacunaciones va JOIN vacunas v ON v.id = va.vacuna_id
       WHERE va.paciente_id = $1 AND va.activo = TRUE
       ORDER BY va.fecha_aplicacion DESC`,
      [id]
    );

    res.json({
      ...paciente.rows[0],
      consultas_recientes: consultas.rows,
      vacunaciones: vacunaciones.rows,
    });
  }
);

// POST /api/pacientes
router.post('/', verificarToken, requierePermiso('pacientes', 'crear'),
  async (req: Request, res: Response): Promise<void> => {
    const {
      cliente_id, especie_id, raza_id, nombre, sexo, fecha_nacimiento,
      peso_kg, color_pelaje, microchip, foto_url, esterilizado, notas
    } = req.body;

    const resultado = await pool.query(
      `INSERT INTO pacientes
         (cliente_id, especie_id, raza_id, nombre, sexo, fecha_nacimiento,
          peso_kg, color_pelaje, microchip, foto_url, esterilizado, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [cliente_id, especie_id, raza_id, nombre, sexo, fecha_nacimiento,
       peso_kg, color_pelaje, microchip, foto_url, esterilizado ?? false, notas]
    );

    res.status(201).json(resultado.rows[0]);
  }
);

// PUT /api/pacientes/:id
router.put('/:id', verificarToken, requierePermiso('pacientes', 'editar'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      especie_id, raza_id, nombre, sexo, fecha_nacimiento,
      peso_kg, color_pelaje, microchip, foto_url, esterilizado, notas
    } = req.body;

    const resultado = await pool.query(
      `UPDATE pacientes SET
         especie_id=$1, raza_id=$2, nombre=$3, sexo=$4, fecha_nacimiento=$5,
         peso_kg=$6, color_pelaje=$7, microchip=$8, foto_url=$9,
         esterilizado=$10, notas=$11
       WHERE id=$12 AND activo=TRUE
       RETURNING *`,
      [especie_id, raza_id, nombre, sexo, fecha_nacimiento,
       peso_kg, color_pelaje, microchip, foto_url, esterilizado, notas, id]
    );

    if (!resultado.rows[0]) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }
    res.json(resultado.rows[0]);
  }
);

export default router;
