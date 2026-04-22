import { Router, Request, Response } from 'express';
import { pool } from '../config/db';
import { verificarToken } from '../middleware/auth';

const router = Router();

// GET /api/catalogos/especies
router.get('/especies', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre, icono, color_acento FROM especies WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/razas?especie_id=X
router.get('/razas', verificarToken,
  async (req: Request, res: Response): Promise<void> => {
    const { especie_id } = req.query;
    const resultado = await pool.query(
      `SELECT id, especie_id, nombre FROM razas WHERE activo = TRUE${especie_id ? ' AND especie_id = $1' : ''} ORDER BY nombre`,
      especie_id ? [especie_id] : []
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/veterinarios
router.get('/veterinarios', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT u.id, u.nombre || ' ' || u.apellido AS nombre_completo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.activo = TRUE
       ORDER BY u.nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/servicios
router.get('/servicios', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre, precio_base AS precio, duracion_minutos FROM servicios WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/pacientes  — para selector en citas
router.get('/pacientes', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT p.id, p.nombre, e.nombre AS especie, e.color_acento,
              cl.nombre || ' ' || cl.apellido AS dueño
       FROM pacientes p
       JOIN especies e ON e.id = p.especie_id
       JOIN clientes cl ON cl.id = p.cliente_id
       WHERE p.activo = TRUE AND p.fallecido = FALSE
       ORDER BY p.nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/clientes
router.get('/clientes', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre, apellido, telefono, email
       FROM clientes WHERE activo = TRUE ORDER BY apellido, nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/productos
router.get('/productos', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre, precio_venta AS precio, stock_actual, unidad_medida
       FROM productos WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/metodos_pago
router.get('/metodos_pago', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre FROM metodos_pago WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(resultado.rows);
  }
);

// GET /api/catalogos/roles
router.get('/roles', verificarToken,
  async (_req: Request, res: Response): Promise<void> => {
    const resultado = await pool.query(
      `SELECT id, nombre FROM roles WHERE activo = TRUE ORDER BY nombre`
    );
    res.json(resultado.rows);
  }
);

export default router;
