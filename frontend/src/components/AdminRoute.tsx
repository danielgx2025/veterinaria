import { Navigate } from 'react-router-dom';

interface AdminRouteProps { children: React.ReactNode; }

export default function AdminRoute({ children }: AdminRouteProps) {
  const raw = localStorage.getItem('usuario');
  if (!raw) return <Navigate to="/login" replace />;
  try {
    const usuario = JSON.parse(raw) as { rol?: string };
    if (usuario?.rol !== 'Admin') return <Navigate to="/dashboard" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
