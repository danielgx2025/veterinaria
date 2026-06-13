import express from 'express';
import 'express-async-errors'; // DEBE ir antes de las rutas: captura rechazos async y los manda al error handler en vez de crashear el proceso
import cors from 'cors';
import dotenv from 'dotenv';

import { pool } from './config/db';
import authRoutes from './routes/auth';
import pacientesRoutes from './routes/pacientes';
import clientesRoutes from './routes/clientes';
import consultasRoutes from './routes/consultas';
import facturacionRoutes from './routes/facturacion';
import dashboardRoutes from './routes/dashboard';
import catalogosRoutes from './routes/catalogos';
import citasRoutes from './routes/citas';
import usuariosRoutes from './routes/usuarios';
import rolesRoutes from './routes/roles';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Aviso temprano en logs si falta config crítica (no crashea: mejor degradar que caer en loop)
const VARIABLES_REQUERIDAS = ['JWT_SECRET', 'DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const faltantes = VARIABLES_REQUERIDAS.filter((k) => !process.env[k]);
if (faltantes.length) {
  console.error(`[ARRANQUE] Faltan variables de entorno requeridas: ${faltantes.join(', ')}`);
}

// El header Origin del navegador nunca lleva barra final ni espacios
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Rutas
app.use('/api/auth',      authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/clientes',  clientesRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/facturas',  facturacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/citas',     citasRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/roles',     rolesRoutes);

// Health check. Montado bajo /api para que sea alcanzable a través del proxy nginx (solo proxea /api/).
// Verifica además la conectividad real a PostgreSQL para diagnosticar fallos de DB.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'error', error: (err as Error).message });
  }
});
// Se mantiene /health para chequeos internos del orquestador
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.stack || err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Red de seguridad a nivel proceso: registrar en vez de tumbar el contenedor.
// express-async-errors cubre los handlers de rutas; esto cubre cualquier otro caso.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
