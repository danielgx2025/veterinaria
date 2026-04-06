import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export function requierePermiso(recurso: string, accion: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.usuario) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { rolId } = req.usuario;

    const resultado = await pool.query(
      `SELECT 1
       FROM roles_permisos rp
       JOIN permisos p ON p.id = rp.permiso_id
       WHERE rp.rol_id = $1
         AND p.recurso = $2
         AND p.accion = $3
         AND p.activo = TRUE`,
      [rolId, recurso, accion]
    );

    if (resultado.rowCount === 0) {
      res.status(403).json({ error: 'No tienes permiso para esta acción' });
      return;
    }

    next();
  };
}
