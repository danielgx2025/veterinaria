import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';
import { requierePermiso } from '../middleware/rbac';

const router = Router();

const SALT_ROUNDS = 10;

const USUARIO_COLS = `
  u.id, u.rol_id, r.nombre AS rol,
  u.nombre, u.apellido, u.email,
  u.telefono, u.activo, u.fecha_creacion, u.ultimo_acceso
`;

// GET / — lista con búsqueda y paginación
router.get('/', verificarToken, requierePermiso('usuarios', 'leer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { q = '', page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;
    const busqueda = q.trim() ? `%${q.trim()}%` : '';

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT ${USUARIO_COLS}
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.activo = TRUE
           AND ($1 = '' OR (
             u.nombre   ILIKE $1 OR
             u.apellido ILIKE $1 OR
             u.email    ILIKE $1
           ))
         ORDER BY u.fecha_creacion DESC
         LIMIT $2 OFFSET $3`,
        [busqueda, limitNum, offset]
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM usuarios u
         WHERE u.activo = TRUE
           AND ($1 = '' OR (
             u.nombre   ILIKE $1 OR
             u.apellido ILIKE $1 OR
             u.email    ILIKE $1
           ))`,
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
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /:id — detalle
router.get('/:id', verificarToken, requierePermiso('usuarios', 'leer'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      `SELECT ${USUARIO_COLS}
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1 AND u.activo = TRUE`,
      [id]
    );
    if (resultado.rowCount === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST / — crear usuario
router.post('/', verificarToken, requierePermiso('usuarios', 'crear'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { rol_id, nombre, apellido, email, password, telefono } = req.body as Record<string, string>;

    if (!rol_id)            { res.status(400).json({ error: 'El rol es requerido' }); return; }
    if (!nombre?.trim())    { res.status(400).json({ error: 'El nombre es requerido' }); return; }
    if (!apellido?.trim())  { res.status(400).json({ error: 'El apellido es requerido' }); return; }
    if (!email?.trim())     { res.status(400).json({ error: 'El email es requerido' }); return; }
    if (!password?.trim())  { res.status(400).json({ error: 'La contraseña es requerida' }); return; }
    if (password.trim().length < 6) { res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Email inválido' }); return;
    }

    const password_hash = await bcrypt.hash(password.trim(), SALT_ROUNDS);

    const resultado = await pool.query(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, rol_id, nombre, apellido, email, telefono, activo, fecha_creacion`,
      [
        parseInt(rol_id),
        nombre.trim(),
        apellido.trim(),
        email.trim().toLowerCase(),
        password_hash,
        telefono?.trim() || null,
      ]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /:id — editar usuario
router.put('/:id', verificarToken, requierePermiso('usuarios', 'editar'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rol_id, nombre, apellido, email, password, telefono } = req.body as Record<string, string>;

    if (!rol_id)           { res.status(400).json({ error: 'El rol es requerido' }); return; }
    if (!nombre?.trim())   { res.status(400).json({ error: 'El nombre es requerido' }); return; }
    if (!apellido?.trim()) { res.status(400).json({ error: 'El apellido es requerido' }); return; }
    if (!email?.trim())    { res.status(400).json({ error: 'El email es requerido' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Email inválido' }); return;
    }
    if (password?.trim() && password.trim().length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' }); return;
    }

    let resultado;
    if (password?.trim()) {
      const password_hash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
      resultado = await pool.query(
        `UPDATE usuarios
         SET rol_id=$1, nombre=$2, apellido=$3, email=$4, password_hash=$5, telefono=$6
         WHERE id=$7 AND activo=TRUE
         RETURNING id, rol_id, nombre, apellido, email, telefono, activo, fecha_creacion`,
        [
          parseInt(rol_id),
          nombre.trim(),
          apellido.trim(),
          email.trim().toLowerCase(),
          password_hash,
          telefono?.trim() || null,
          id,
        ]
      );
    } else {
      resultado = await pool.query(
        `UPDATE usuarios
         SET rol_id=$1, nombre=$2, apellido=$3, email=$4, telefono=$5
         WHERE id=$6 AND activo=TRUE
         RETURNING id, rol_id, nombre, apellido, email, telefono, activo, fecha_creacion`,
        [
          parseInt(rol_id),
          nombre.trim(),
          apellido.trim(),
          email.trim().toLowerCase(),
          telefono?.trim() || null,
          id,
        ]
      );
    }

    if (resultado.rowCount === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PATCH /:id/desactivar — soft-delete
router.patch('/:id/desactivar', verificarToken, requierePermiso('usuarios', 'eliminar'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.usuario!.userId === parseInt(id)) {
      res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
      return;
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET activo = FALSE WHERE id = $1 AND activo = TRUE RETURNING id`,
      [id]
    );

    if (resultado.rowCount === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

export default router;
