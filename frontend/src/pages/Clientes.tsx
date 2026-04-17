import { useState, useEffect } from 'react';
import ClienteModal from '../components/ClienteModal';

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  telefono_alternativo: string | null;
  direccion: string | null;
  ciudad: string | null;
  documento_identidad: string | null;
  notas: string | null;
  activo: boolean;
  fecha_creacion: string;
  total_mascotas: number | string;
}

const CLIENTES_EJEMPLO: Cliente[] = [
  { id: 1, nombre: 'Carlos', apellido: 'Martínez', email: 'carlos@example.com', telefono: '+54 9 11 1234-5678', telefono_alternativo: null, direccion: 'Av. Corrientes 1234', ciudad: 'Buenos Aires', documento_identidad: '28456789', notas: null, activo: true, fecha_creacion: new Date(Date.now() - 30 * 86400000).toISOString(), total_mascotas: 2 },
  { id: 2, nombre: 'Ana', apellido: 'Rodríguez', email: 'ana@example.com', telefono: '+54 9 11 8765-4321', telefono_alternativo: null, direccion: null, ciudad: 'Córdoba', documento_identidad: '33112233', notas: null, activo: true, fecha_creacion: new Date(Date.now() - 15 * 86400000).toISOString(), total_mascotas: 1 },
  { id: 3, nombre: 'Luis', apellido: 'Pérez', email: 'luis@example.com', telefono: '+54 9 351 555-1234', telefono_alternativo: null, direccion: 'San Martín 567', ciudad: 'Rosario', documento_identidad: '25987654', notas: null, activo: true, fecha_creacion: new Date(Date.now() - 5 * 86400000).toISOString(), total_mascotas: 3 },
];

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_EJEMPLO);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const params = new URLSearchParams();
        if (busqueda) params.set('q', busqueda);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/clientes?${params}&limit=100`, { headers });
        if (res.ok) {
          const datos = await res.json();
          setClientes(Array.isArray(datos) ? datos : CLIENTES_EJEMPLO);
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

  const abrirNuevo = () => { setClienteEditar(null); setModalAbierto(true); };
  const abrirEditar = (c: Cliente) => { setClienteEditar(c); setModalAbierto(true); };

  const desactivar = async (id: number) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    setEliminando(id);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/clientes/${id}/desactivar`, { method: 'PATCH', headers });
      setReloadKey(k => k + 1);
    } catch { /* silencioso */ } finally {
      setEliminando(null);
    }
  };

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <>
      <ClienteModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => setReloadKey(k => k + 1)}
        clienteEditar={clienteEditar}
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
              Clientes
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}
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
            + Nuevo cliente
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
            placeholder="Buscar por nombre, email, documento..."
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
                {['Cliente', 'Email', 'Teléfono', 'Documento', 'Mascotas', 'Registrado', ''].map(h => (
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
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: 'var(--esp-16)',
                    textAlign: 'center', color: 'var(--ink-terciario)',
                    fontSize: 'var(--texto-sm)',
                  }}>
                    {busqueda ? `No se encontraron clientes para "${busqueda}"` : 'No hay clientes registrados'}
                  </td>
                </tr>
              ) : (
                clientes.map((c, idx) => (
                  <tr
                    key={c.id}
                    style={{
                      borderTop: idx > 0 ? '1px solid var(--borde-sutil)' : 'none',
                      transition: 'background var(--transicion-rapida)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--superficie-canvas)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    {/* Nombre */}
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
                          {c.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--texto-sm)', fontWeight: 500, color: 'var(--ink-primario)', whiteSpace: 'nowrap' }}>
                            {c.nombre} {c.apellido}
                          </div>
                          {c.ciudad && (
                            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>{c.ciudad}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>
                      {c.email ?? '—'}
                    </td>
                    {/* Teléfono */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-secundario)', whiteSpace: 'nowrap' }}>
                      {c.telefono ?? '—'}
                    </td>
                    {/* Documento */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-sm)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-secundario)' }}>
                      {c.documento_identidad ?? '—'}
                    </td>
                    {/* Mascotas */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)',
                        fontWeight: 600,
                        color: Number(c.total_mascotas) > 0 ? 'var(--verde-700)' : 'var(--ink-muted)',
                        background: Number(c.total_mascotas) > 0 ? 'var(--verde-100)' : 'var(--neutro-100, #F1F5F9)',
                        borderRadius: 'var(--radio-full)', padding: '2px 8px',
                      }}>
                        {c.total_mascotas ?? 0}
                      </span>
                    </td>
                    {/* Fecha */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)', fontSize: 'var(--texto-xs)', fontFamily: 'var(--fuente-mono)', color: 'var(--ink-terciario)', whiteSpace: 'nowrap' }}>
                      {fmtFecha(c.fecha_creacion)}
                    </td>
                    {/* Acciones */}
                    <td style={{ padding: 'var(--esp-3) var(--esp-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--esp-2)', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => abrirEditar(c)}
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
                          onClick={() => desactivar(c.id)}
                          disabled={eliminando === c.id}
                          title="Desactivar"
                          style={{
                            width: 30, height: 30,
                            border: '1px solid var(--borde-control)',
                            borderRadius: 'var(--radio-md)',
                            background: 'transparent',
                            color: eliminando === c.id ? 'var(--ink-muted)' : '#C53030',
                            cursor: eliminando === c.id ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: eliminando === c.id ? 0.5 : 1,
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
      </div>
    </>
  );
}
