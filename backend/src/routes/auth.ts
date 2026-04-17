import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  const resultado = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash,
            u.rol_id, r.nombre AS rol_nombre, u.activo
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.email = $1`,
    [email.toLowerCase().trim()]
  );

  const usuario = resultado.rows[0];

  if (!usuario || !usuario.activo) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  // Actualizar último acceso
  await pool.query(
    'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
    [usuario.id]
  );

  const token = jwt.sign(
    {
      userId: usuario.id,
      rolId: usuario.rol_id,
      rolNombre: usuario.rol_nombre,
      email: usuario.email,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol_nombre,
    },
  });
});

// GET /api/auth/me
router.get('/me', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol,
            u.telefono, u.activo, u.fecha_creacion
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.id = $1`,
    [req.usuario!.userId]
  );
  res.json(resultado.rows[0]);
});

export default router;
