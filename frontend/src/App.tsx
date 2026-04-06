import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Consultas from './pages/Consultas';
import Facturacion from './pages/Facturacion';
import Citas from './pages/Citas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <div style={{
              display: 'flex',
              height: '100vh',
              overflow: 'hidden',
              background: 'var(--superficie-canvas)',
            }}>
              <Sidebar />
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
              }}>
                <Header />
                <main style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 'var(--esp-6)',
                }}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard"   element={<Dashboard />} />
                    <Route path="/pacientes"   element={<Pacientes />} />
                    <Route path="/consultas"   element={<Consultas />} />
                    <Route path="/facturacion" element={<Facturacion />} />
                    <Route path="/citas"       element={<Citas />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
