import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import pacientesRoutes from './routes/pacientes';
import clientesRoutes from './routes/clientes';
import consultasRoutes from './routes/consultas';
import facturacionRoutes from './routes/facturacion';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Rutas
app.use('/api/auth',      authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/clientes',  clientesRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/facturas',  facturacionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
