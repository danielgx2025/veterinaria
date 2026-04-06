import { useLocation } from 'react-router-dom';

const titulos: Record<string, { titulo: string; subtitulo: string }> = {
  '/dashboard':   { titulo: 'Dashboard',   subtitulo: 'Vista general de la clínica' },
  '/citas':       { titulo: 'Agenda',      subtitulo: 'Citas programadas y disponibilidad' },
  '/pacientes':   { titulo: 'Pacientes',   subtitulo: 'Historial clínico y fichas médicas' },
  '/consultas':   { titulo: 'Consultas',   subtitulo: 'Registro de atenciones médicas' },
  '/facturacion': { titulo: 'Facturación', subtitulo: 'Cobros, pagos y estados de cuenta' },
};

function BusquedaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function CampanaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const info = titulos[pathname] ?? { titulo: 'VetSystem', subtitulo: '' };

  return (
    <header style={{
      height: 'var(--alto-header)',
      background: 'var(--superficie-base)',
      borderBottom: '1px solid var(--borde-sutil)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--esp-6)',
      flexShrink: 0,
    }}>
      {/* Título de página */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--esp-3)' }}>
        <h1 style={{
          fontFamily: 'var(--fuente-display)',
          fontSize: 'var(--texto-xl)',
          fontWeight: 'var(--peso-semibold)',
          color: 'var(--ink-primario)',
          letterSpacing: 'var(--tracking-apretado)',
          lineHeight: 1,
        }}>
          {info.titulo}
        </h1>
        {info.subtitulo && (
          <span style={{
            fontSize: 'var(--texto-sm)',
            color: 'var(--ink-terciario)',
            display: 'none',
          }}
          className="subtitulo-header">
            {info.subtitulo}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-2)' }}>
        {/* Barra de búsqueda */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--esp-2)',
          background: 'var(--control-fondo)',
          border: '1px solid var(--control-borde)',
          borderRadius: 'var(--radio-md)',
          padding: 'var(--esp-2) var(--esp-3)',
          minWidth: 200,
        }}>
          <span style={{ color: 'var(--ink-muted)', display: 'flex' }}>
            <BusquedaIcon />
          </span>
          <input
            type="search"
            placeholder="Buscar paciente, cliente..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 'var(--texto-sm)',
              color: 'var(--ink-primario)',
              width: '100%',
            }}
          />
        </div>

        {/* Notificaciones */}
        <button style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radio-md)',
          border: '1px solid var(--borde-sutil)',
          background: 'var(--superficie-base)',
          color: 'var(--ink-secundario)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background var(--transicion-rapida)',
        }}>
          <CampanaIcon />
          {/* Indicador de alertas */}
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 7, height: 7,
            background: 'var(--ambar-500)',
            borderRadius: 'var(--radio-full)',
            border: '1.5px solid var(--superficie-base)',
          }} />
        </button>

        {/* Fecha actual */}
        <span style={{
          fontSize: 'var(--texto-xs)',
          color: 'var(--ink-terciario)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'short', day: 'numeric', month: 'short'
          })}
        </span>
      </div>
    </header>
  );
}
