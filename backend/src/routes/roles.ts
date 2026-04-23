import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';

const router = Router();

const esAdmin = (req: Request, res: Response): boolean => {
  if (req.usuario?.rolNombre !== 'Admin') {
    res.status(403).json({ error: 'Acceso restringido a administradores' });
    return false;
  }
  return true;
};

// GET / — lista con búsqueda, paginación y conteo de permisos
router.get('/', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { q = '', page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;
    const busqueda = q.trim() ? `%${q.trim()}%` : '';

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT r.id, r.nombre, r.descripcion, r.activo, r.fecha_creacion,
                COUNT(rp.permiso_id)::int AS total_permisos
         FROM roles r
         LEFT JOIN roles_permisos rp ON rp.rol_id = r.id
         WHERE r.activo = TRUE
           AND ($1 = '' OR (r.nombre ILIKE $1 OR r.descripcion ILIKE $1))
         GROUP BY r.id
         ORDER BY r.fecha_creacion DESC
         LIMIT $2 OFFSET $3`,
        [busqueda, limitNum, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM roles
         WHERE activo = TRUE
           AND ($1 = '' OR (nombre ILIKE $1 OR descripcion ILIKE $1))`,
        [busqueda]
      ),
    ]);

    res.json({
      data:  dataRes.rows,
      total: parseInt(countRes.rows[0].total),
      page:  pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// GET /:id — detalle con permiso_ids asignados
router.get('/:id', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const [rolRes, permisosRes] = await Promise.all([
      pool.query(
        `SELECT id, nombre, descripcion, activo, fecha_creacion FROM roles WHERE id = $1 AND activo = TRUE`,
        [id]
      ),
      pool.query(
        `SELECT permiso_id FROM roles_permisos WHERE rol_id = $1 ORDER BY permiso_id`,
        [id]
      ),
    ]);

    if (rolRes.rowCount === 0) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    res.json({
      ...rolRes.rows[0],
      permisos: permisosRes.rows.map((r: { permiso_id: number }) => r.permiso_id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
});

// POST / — crear rol
router.post('/', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { nombre, descripcion } = req.body as Record<string, string>;

    if (!nombre?.trim()) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    const resultado = await pool.query(
      `INSERT INTO roles (nombre, descripcion)
       VALUES ($1, $2)
       RETURNING id, nombre, descripcion, activo, fecha_creacion`,
      [nombre.trim(), descripcion?.trim() || null]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El nombre ya está en uso' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear rol' });
  }
});

// PUT /:id — editar rol
router.put('/:id', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body as Record<string, string>;

    if (!nombre?.trim()) {
      res.status(400).json({ error: 'El nombre es requerido' });
      return;
    }

    const resultado = await pool.query(
      `UPDATE roles SET nombre = $1, descripcion = $2
       WHERE id = $3 AND activo = TRUE
       RETURNING id, nombre, descripcion, activo, fecha_creacion`,
      [nombre.trim(), descripcion?.trim() || null, id]
    );

    if (resultado.rowCount === 0) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El nombre ya está en uso' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

// PATCH /:id/desactivar — soft-delete
router.patch('/:id/desactivar', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { id } = req.params;

    const rolRes = await pool.query(
      `SELECT nombre FROM roles WHERE id = $1 AND activo = TRUE`,
      [id]
    );

    if (rolRes.rowCount === 0) {
      res.status(404).json({ error: 'Rol no encontrado' });
      return;
    }

    if (rolRes.rows[0].nombre === 'Admin') {
      res.status(400).json({ error: 'No se puede desactivar el rol Admin' });
      return;
    }

    await pool.query(
      `UPDATE roles SET activo = FALSE WHERE id = $1`,
      [id]
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar rol' });
  }
});

// GET /:id/permisos — permisos asignados al rol
router.get('/:id/permisos', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `SELECT permiso_id FROM roles_permisos WHERE rol_id = $1 ORDER BY permiso_id`,
      [id]
    );
    res.json(resultado.rows.map((r: { permiso_id: number }) => r.permiso_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener permisos del rol' });
  }
});

// PUT /:id/permisos — reemplazar todos los permisos del rol (transaccional)
router.put('/:id/permisos', verificarToken, async (req: Request, res: Response): Promise<void> => {
  if (!esAdmin(req, res)) return;
  const { id } = req.params;
  const { permiso_ids } = req.body as { permiso_ids: number[] };

  if (!Array.isArray(permiso_ids)) {
    res.status(400).json({ error: 'permiso_ids debe ser un array' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM roles_permisos WHERE rol_id = $1', [id]);

    if (permiso_ids.length > 0) {
      await client.query(
        `INSERT INTO roles_permisos (rol_id, permiso_id)
         SELECT $1, unnest($2::int[])`,
        [id, permiso_ids]
      );
    }

    await client.query('COMMIT');

    const updated = await client.query(
      `SELECT permiso_id FROM roles_permisos WHERE rol_id = $1 ORDER BY permiso_id`,
      [id]
    );
    res.json(updated.rows.map((r: { permiso_id: number }) => r.permiso_id));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar permisos del rol' });
  } finally {
    client.release();
  }
});

export default router;
