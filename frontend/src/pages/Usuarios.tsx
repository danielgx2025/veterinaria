import { useState, useEffect } from 'react';
import UsuarioModal, { UsuarioEditar } from '../components/UsuarioModal';

interface Usuario {
  id: number;
  rol_id: number;
  rol: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}

const USUARIOS_EJEMPLO: Usuario[] = [
  { id: 1, rol_id: 1, rol: 'Admin', nombre: 'Administrador', apellido: 'Sistema', email: 'admin@veterinaria.com', telefono: '+1-000-000-0000', activo: true, fecha_creacion: new Date(Date.now() - 60 * 86400000).toISOString(), ultimo_acceso: new Date().toISOString() },
  { id: 2, rol_id: 2, rol: 'Veterinario', nombre: 'María', apellido: 'González', email: 'veterinario@veterinaria.com', telefono: null, activo: true, fecha_creacion: new Date(Date.now() - 30 * 86400000).toISOString(), ultimo_acceso: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, rol_id: 3, rol: 'Recepcionista', nombre: 'Carlos', apellido: 'López', email: 'recepcion@veterinaria.com', telefono: '+54 9 11 5555-1234', activo: true, fecha_creacion: new Date(Date.now() - 15 * 86400000).toISOString(), ultimo_acceso: null },
];

const ROL_COLORES: Record<string, { bg: string; color: string }> = {
  Admin:         { bg: 'var(--verde-100)', color: 'var(--verde-700)' },
  Veterinario:   { bg: 'var(--azul-100, #E8F1F8)', color: 'var(--azul-600, #1E4266)' },
  Recepcionista: { bg: 'var(--ambar-100)', color: 'var(--ambar-600)' },
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_EJEMPLO);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioEditar | null>(null);
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
        const res = await fetch(`/api/usuarios?${params}`, { headers });
        if (res.ok) {
          const datos = await res.json();
          const lista = Array.isArray(datos) ? datos : (datos.data ?? USUARIOS_EJEMPLO);
          setUsuarios(lista);
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

  const abrirNuevo = () => { setUsuarioEditar(null); setModalAbierto(true); };

  const abrirEditar = (u: Usuario) => {
    setUsuarioEditar({
      id:       u.id,
      rol_id:   u.rol_id,
      nombre:   u.nombre,
      apellido: u.apellido,
      email:    u.email,
      telefono: u.telefono,
    });
    setModalAbierto(true);
  };

  const desactivar = async (id: number) => {
    if (!confirm('¿Desactivar este usuario? No podrá iniciar sesión.')) return;
    setEliminando(id);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/usuarios/${id}/desactivar`, { method: 'PATCH', headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(err.error ?? 'No se pudo desactivar el usuario');
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
      <UsuarioModal
        abierto={modalAbierto}
        onCerrar={() => { setModalAbierto(false); setUsuarioEditar(null); }}
        onGuardado={() => setReloadKey(k => k + 1)}
        usuarioEditar={usuarioEditar}
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
              Usuarios
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} activo{usuarios.length !== 1 ? 's' : ''}
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
            + Nuevo usuario
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
            placeholder="Buscar por nombre, email..."
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
                {['Usuario', 'Email', 'Rol', 'Teléfono', 'Registrado', 'Último acceso', ''].map(h => (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--borde-sutil)' : 'none' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                        <div style={{
                          height: 14, borderRadius: 4,
                          background: 'var(--neutro-200)',
                          animation: 'pulse 1.5s ease-in-out infinite',
                          width: j === 0 ? '80%' : j === 6 ? 60 : '60%',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: 'var(--esp-16)',
                    textAlign: 'center', color: 'var(--ink-terciario)',
                    fontSize: 'var(--texto-sm)',
                  }}>
                    {busqueda ? `No se encontraron usuarios para "${busqueda}"` : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                usuarios.map((u, idx) => {
                  const rolColor = ROL_COLORES[u.rol] ?? { bg: 'var(--neutro-100)', color: 'var(--ink-secundario)' };
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--borde-sutil)' : 'none',
                        transition: 'background var(--transicion-rapida)',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--superficie-canvas)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* Usuario */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-3)' }}>
                          <div style={{
                            width: 32, height: 32, flexShrink: 0,
                            borderRadius: 'var(--radio-full)',
                            background: 'var(--verde-100)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'var(--texto-sm)', fontWeight: 700,
                            color: 'var(--verde-700)',
                          }}>
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 'var(--texto-sm)', fontWeight: 500, color: 'var(--ink-primario)', whiteSpace: 'nowrap' }}>
                              {u.nombre} {u.apellido}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>
                        {u.email}
                      </td>
                      {/* Rol */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          fontSize: 'var(--texto-xs)', fontWeight: 600,
                          color: rolColor.color,
                          background: rolColor.bg,
                          borderRadius: 'var(--radio-full)', padding: '2px 10px',
                          whiteSpace: 'nowrap',
                        }}>
                          {u.rol}
                        </span>
                      </td>
                      {/* Teléfono */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-secundario)', whiteSpace: 'nowrap' }}>
                        {u.telefono ?? '—'}
                      </td>
                      {/* Registrado */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-terciario)', whiteSpace: 'nowrap' }}>
                        {fmtFecha(u.fecha_creacion)}
                      </td>
                      {/* Último acceso */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-terciario)', whiteSpace: 'nowrap' }}>
                        {u.ultimo_acceso ? fmtFecha(u.ultimo_acceso) : '—'}
                      </td>
                      {/* Acciones */}
                      <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--esp-2)', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => abrirEditar(u)}
                            title="Editar"
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
                          <button
                            onClick={() => desactivar(u.id)}
                            disabled={eliminando === u.id}
                            title="Desactivar"
                            style={{
                              width: 30, height: 30,
                              border: '1px solid var(--borde-control)',
                              borderRadius: 'var(--radio-md)',
                              background: 'transparent',
                              color: eliminando === u.id ? 'var(--ink-muted)' : '#C53030',
                              cursor: eliminando === u.id ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: eliminando === u.id ? 0.5 : 1,
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
