import { useState, useEffect } from 'react';
import RolModal, { RolEditar } from '../components/RolModal';
import RolPermisosModal from '../components/RolPermisosModal';

interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fecha_creacion: string;
  total_permisos: number;
}

const ROLES_EJEMPLO: Rol[] = [
  { id: 1, nombre: 'Admin', descripcion: 'Acceso total al sistema', activo: true, fecha_creacion: new Date(Date.now() - 90 * 86400000).toISOString(), total_permisos: 33 },
  { id: 2, nombre: 'Veterinario', descripcion: 'Acceso a consultas, historiales y vacunaciones', activo: true, fecha_creacion: new Date(Date.now() - 90 * 86400000).toISOString(), total_permisos: 18 },
  { id: 3, nombre: 'Recepcionista', descripcion: 'Gestión de citas, clientes y facturación', activo: true, fecha_creacion: new Date(Date.now() - 90 * 86400000).toISOString(), total_permisos: 12 },
];

export default function Roles() {
  const [roles, setRoles] = useState<Rol[]>(ROLES_EJEMPLO);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditar, setRolEditar] = useState<RolEditar | null>(null);
  const [permisosModalAbierto, setPermisosModalAbierto] = useState(false);
  const [rolPermisos, setRolPermisos] = useState<{ id: number; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const params = new URLSearchParams();
        if (busqueda) params.set('q', busqueda);
        params.set('limit', '100');
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/roles?${params}`, { headers });
        if (res.ok) {
          const datos = await res.json();
          const lista = Array.isArray(datos) ? datos : (datos.data ?? ROLES_EJEMPLO);
          setRoles(lista);
        }
      } catch {
        // usar datos de ejemplo
      } finally {
        setCargando(false);
      }
    };
    const timer = setTimeout(cargar, 300);
    return () => clearTimeout(timer);
  }, [busqueda, reloadKey]);

  const abrirNuevo = () => { setRolEditar(null); setModalAbierto(true); };

  const abrirEditar = (r: Rol) => {
    setRolEditar({ id: r.id, nombre: r.nombre, descripcion: r.descripcion });
    setModalAbierto(true);
  };

  const abrirPermisos = (r: Rol) => {
    setRolPermisos({ id: r.id, nombre: r.nombre });
    setPermisosModalAbierto(true);
  };

  const desactivar = async (id: number, nombre: string) => {
    if (!confirm(`¿Desactivar el rol "${nombre}"? Los usuarios con este rol perderán el acceso.`)) return;
    setEliminando(id);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/roles/${id}/desactivar`, { method: 'PATCH', headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error ?? 'No se pudo desactivar el rol');
        return;
      }
      setReloadKey(k => k + 1);
    } catch { /* silencioso */ } finally {
      setEliminando(null);
    }
  };

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <>
      <RolModal
        abierto={modalAbierto}
        onCerrar={() => { setModalAbierto(false); setRolEditar(null); }}
        onGuardado={() => setReloadKey(k => k + 1)}
        rolEditar={rolEditar}
      />
      <RolPermisosModal
        abierto={permisosModalAbierto}
        onCerrar={() => { setPermisosModalAbierto(false); setRolPermisos(null); }}
        rolId={rolPermisos?.id ?? 0}
        rolNombre={rolPermisos?.nombre ?? ''}
      />

      <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--esp-6)', flexWrap: 'wrap', gap: 'var(--esp-4)',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-2xl)',
              fontWeight: 400, color: 'var(--ink-primario)',
            }}>
              Roles
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {roles.length} rol{roles.length !== 1 ? 'es' : ''} definido{roles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
              padding: 'var(--esp-2) var(--esp-4)',
              background: 'var(--verde-600)', color: 'white',
              border: 'none', borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
              cursor: 'pointer',
            }}
          >
            + Nuevo rol
          </button>
        </div>

        {/* Búsqueda */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
          background: 'var(--superficie-base)',
          border: '1px solid var(--borde-control)',
          borderRadius: 'var(--radio-md)',
          padding: 'var(--esp-2) var(--esp-3)',
          maxWidth: 380,
          marginBottom: 'var(--esp-4)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)', width: '100%',
            }}
          />
        </div>

        {/* Tabla */}
        <div style={{
          background: 'var(--superficie-base)',
          border: '1px solid var(--borde-normal)',
          borderRadius: 'var(--radio-lg)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--borde-sutil)' }}>
                {['Rol', 'Descripción', 'Permisos', 'Creado', ''].map(h => (
                  <th key={h} style={{
                    padding: 'var(--esp-3) var(--esp-4)',
                    fontSize: 'var(--texto-xs)', fontWeight: 700,
                    color: 'var(--ink-muted)', letterSpacing: '0.06em',
                    textTransform: 'uppercase', textAlign: 'left',
                    background: 'var(--superficie-canvas)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--borde-sutil)' : 'none' }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                        <div style={{
                          height: 14, borderRadius: 4,
                          background: 'var(--neutro-200)',
                          animation: 'pulse 1.5s ease-in-out infinite',
                          width: j === 0 ? '60%' : j === 4 ? 90 : '50%',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: 'var(--esp-16)',
                    textAlign: 'center', color: 'var(--ink-terciario)',
                    fontSize: 'var(--texto-sm)',
                  }}>
                    {busqueda ? `No se encontraron roles para "${busqueda}"` : 'No hay roles definidos'}
                  </td>
                </tr>
              ) : (
                roles.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: idx > 0 ? '1px solid var(--borde-sutil)' : 'none',
                      transition: 'background var(--transicion-rapida)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--superficie-canvas)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    {/* Rol */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-3)' }}>
                        <div style={{
                          width: 32, height: 32, flexShrink: 0,
                          borderRadius: 'var(--radio-md)',
                          background: 'var(--verde-100)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--verde-700)',
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 500, color: 'var(--ink-primario)', whiteSpace: 'nowrap' }}>
                          {r.nombre}
                        </span>
                      </div>
                    </td>
                    {/* Descripción */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)', maxWidth: 300 }}>
                      {r.descripcion ?? <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic' }}>Sin descripción</span>}
                    </td>
                    {/* Permisos */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)',
                        fontWeight: 600,
                        color: r.total_permisos > 0 ? 'var(--verde-700)' : 'var(--ink-muted)',
                        background: r.total_permisos > 0 ? 'var(--verde-100)' : 'var(--neutro-100, #F1F5F9)',
                        borderRadius: 'var(--radio-full)', padding: '2px 8px',
                        whiteSpace: 'nowrap',
                      }}>
                        {r.total_permisos}
                      </span>
                    </td>
                    {/* Creado */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-terciario)', whiteSpace: 'nowrap' }}>
                      {fmtFecha(r.fecha_creacion)}
                    </td>
                    {/* Acciones */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--esp-2)', justifyContent: 'flex-end' }}>
                        {/* Editar */}
                        <button
                          onClick={() => abrirEditar(r)}
                          title="Editar rol"
                          style={{
                            width: 30, height: 30,
                            border: '1px solid var(--borde-control)',
                            borderRadius: 'var(--radio-md)',
                            background: 'transparent',
                            color: 'var(--ink-secundario)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        {/* Gestionar permisos */}
                        <button
                          onClick={() => abrirPermisos(r)}
                          title="Gestionar permisos"
                          style={{
                            width: 30, height: 30,
                            border: '1px solid var(--borde-control)',
                            borderRadius: 'var(--radio-md)',
                            background: 'transparent',
                            color: 'var(--verde-600)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </button>
                        {/* Desactivar */}
                        <button
                          onClick={() => r.nombre !== 'Admin' && desactivar(r.id, r.nombre)}
                          disabled={eliminando === r.id || r.nombre === 'Admin'}
                          title={r.nombre === 'Admin' ? 'El rol Admin no puede desactivarse' : 'Desactivar rol'}
                          style={{
                            width: 30, height: 30,
                            border: '1px solid var(--borde-control)',
                            borderRadius: 'var(--radio-md)',
                            background: 'transparent',
                            color: (eliminando === r.id || r.nombre === 'Admin') ? 'var(--ink-muted)' : '#C53030',
                            cursor: (eliminando === r.id || r.nombre === 'Admin') ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: r.nombre === 'Admin' ? 0.3 : eliminando === r.id ? 0.5 : 1,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
      </div>
    </>
  );
}
