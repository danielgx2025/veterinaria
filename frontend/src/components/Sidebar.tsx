import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface UsuarioLocal { nombre: string; apellido: string; email: string; rol: string; }

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/citas',
    label: 'Agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    to: '/consultas',
    label: 'Consultas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    to: '/facturacion',
    label: 'Facturación',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try { setUsuario(JSON.parse(raw)); } catch { /* ignorar */ }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login', { replace: true });
  };

  const inicial = usuario ? usuario.nombre.charAt(0).toUpperCase() : 'U';
  const nombreCompleto = usuario ? `${usuario.nombre} ${usuario.apellido}` : '—';
  const rolLabel = usuario?.rol ?? '—';

  return (
    <aside style={{
      width: 'var(--ancho-sidebar)',
      minWidth: 'var(--ancho-sidebar)',
      height: '100vh',
      background: 'var(--superficie-base)',
      borderRight: '1px solid var(--borde-normal)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--esp-4) 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: 'var(--esp-2) var(--esp-5)',
        marginBottom: 'var(--esp-6)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--esp-3)',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radio-md)',
          background: 'var(--verde-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--fuente-display)',
            fontWeight: 'var(--peso-semibold)',
            fontSize: 'var(--texto-lg)',
            color: 'var(--ink-primario)',
            lineHeight: 1.1,
          }}>
            VetSystem
          </div>
          <div style={{
            fontSize: 'var(--texto-xs)',
            color: 'var(--ink-terciario)',
            letterSpacing: 'var(--tracking-amplio)',
          }}>
            CLÍNICA
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '0 var(--esp-3)' }}>
        <div style={{
          fontSize: 'var(--texto-xs)',
          fontWeight: 'var(--peso-semibold)',
          color: 'var(--ink-terciario)',
          letterSpacing: 'var(--tracking-muy-amplio)',
          textTransform: 'uppercase',
          padding: '0 var(--esp-3)',
          marginBottom: 'var(--esp-2)',
        }}>
          Principal
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--esp-1)' }}>
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--esp-3)',
                  padding: 'var(--esp-2) var(--esp-3)',
                  borderRadius: 'var(--radio-md)',
                  textDecoration: 'none',
                  fontSize: 'var(--texto-sm)',
                  fontWeight: isActive ? 'var(--peso-semibold)' : 'var(--peso-normal)',
                  color: isActive ? 'var(--verde-700)' : 'var(--ink-secundario)',
                  background: isActive ? 'var(--verde-100)' : 'transparent',
                  transition: 'all var(--transicion-rapida)',
                })}
              >
                <span style={{ color: 'inherit', display: 'flex', flexShrink: 0 }}>{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuario + logout */}
      <div style={{
        padding: 'var(--esp-3) var(--esp-4)',
        borderTop: '1px solid var(--borde-sutil)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-3)', marginBottom: 'var(--esp-2)' }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 'var(--radio-full)',
            background: 'var(--verde-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--texto-sm)',
            fontWeight: 'var(--peso-semibold)',
            color: 'var(--verde-700)',
            flexShrink: 0,
          }}>
            {inicial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--texto-sm)',
              fontWeight: 'var(--peso-medio)',
              color: 'var(--ink-primario)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {nombreCompleto}
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>
              {rolLabel}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--esp-2)',
            padding: 'var(--esp-2) var(--esp-3)',
            border: '1px solid var(--borde-sutil)',
            borderRadius: 'var(--radio-md)',
            background: 'transparent',
            color: 'var(--ink-terciario)',
            fontSize: 'var(--texto-xs)',
            cursor: 'pointer',
            transition: 'color var(--transicion-rapida), border-color var(--transicion-rapida)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#C53030';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#C53030';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-terciario)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--borde-sutil)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
