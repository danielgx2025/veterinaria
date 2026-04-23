import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Permiso {
  id: number;
  recurso: string;
  accion: string;
  descripcion: string | null;
}

interface RolOpcion {
  id: number;
  nombre: string;
  descripcion: string | null;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RolesPermisos() {
  const [searchParams] = useSearchParams();

  const [roles, setRoles] = useState<RolOpcion[]>([]);
  const [rolIdSeleccionado, setRolIdSeleccionado] = useState<number | null>(null);
  const [rolNombre, setRolNombre] = useState('');
  const [todosPermisos, setTodosPermisos] = useState<Permiso[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoPermisos, setCargandoPermisos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');

  // Carga inicial: roles + catálogo de permisos
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/roles?limit=100', { headers }).then(r => r.json()),
      fetch('/api/catalogos/permisos', { headers }).then(r => r.json()),
    ])
      .then(([rolesData, permisosData]) => {
        const lista: RolOpcion[] = Array.isArray(rolesData) ? rolesData : (rolesData.data ?? []);
        setRoles(lista);
        setTodosPermisos(permisosData);

        // Preseleccionar desde URL param ?rol=X
        const rolParam = searchParams.get('rol');
        if (rolParam) {
          const rolId = parseInt(rolParam);
          const encontrado = lista.find(r => r.id === rolId);
          if (encontrado) {
            setRolIdSeleccionado(rolId);
            setRolNombre(encontrado.nombre);
          }
        }
      })
      .catch(() => setErrorGlobal('No se pudieron cargar los datos.'))
      .finally(() => setCargandoInicial(false));
  }, []);

  // Carga permisos del rol seleccionado
  useEffect(() => {
    if (!rolIdSeleccionado) { setSeleccionados(new Set()); return; }
    setCargandoPermisos(true);
    setExito(false);
    setErrorGlobal('');
    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`/api/roles/${rolIdSeleccionado}/permisos`, { headers })
      .then(r => r.json())
      .then((ids: number[]) => setSeleccionados(new Set(ids)))
      .catch(() => setErrorGlobal('No se pudieron cargar los permisos del rol.'))
      .finally(() => setCargandoPermisos(false));
  }, [rolIdSeleccionado]);

  const grupos = todosPermisos.reduce<Record<string, Permiso[]>>((acc, p) => {
    if (!acc[p.recurso]) acc[p.recurso] = [];
    acc[p.recurso].push(p);
    return acc;
  }, {});

  const toggle = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGrupo = (permisos: Permiso[]) => {
    const todosOn = permisos.every(p => seleccionados.has(p.id));
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (todosOn) { permisos.forEach(p => next.delete(p.id)); }
      else         { permisos.forEach(p => next.add(p.id)); }
      return next;
    });
  };

  const seleccionarTodo = () => setSeleccionados(new Set(todosPermisos.map(p => p.id)));
  const limpiarTodo = () => setSeleccionados(new Set());

  const guardar = async () => {
    if (!rolIdSeleccionado) return;
    setGuardando(true);
    setErrorGlobal('');
    setExito(false);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/roles/${rolIdSeleccionado}/permisos`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permiso_ids: Array.from(seleccionados) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorGlobal(err.error ?? 'Error al guardar permisos.');
        return;
      }
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const handleRolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (isNaN(id)) { setRolIdSeleccionado(null); setRolNombre(''); return; }
    const rol = roles.find(r => r.id === id);
    setRolIdSeleccionado(id);
    setRolNombre(rol?.nombre ?? '');
  };

  return (
    <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes spin  { to { transform: rotate(360deg) } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 'var(--esp-6)' }}>
        <h2 style={{
          fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-2xl)',
          fontWeight: 400, color: 'var(--ink-primario)',
        }}>
          Permisos de Roles
        </h2>
        <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
          Asigna o modifica los permisos de cada rol del sistema
        </p>
      </div>

      {/* Selector de rol */}
      <div style={{
        background: 'var(--superficie-base)',
        border: '1px solid var(--borde-normal)',
        borderRadius: 'var(--radio-lg)',
        padding: 'var(--esp-5) var(--esp-6)',
        marginBottom: 'var(--esp-5)',
      }}>
        <p style={{
          fontSize: 'var(--texto-xs)', fontWeight: 700,
          color: 'var(--ink-muted)', letterSpacing: '0.08em',
          textTransform: 'uppercase', margin: '0 0 var(--esp-3)',
        }}>
          Seleccionar rol
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-4)', flexWrap: 'wrap' }}>
          <select
            value={rolIdSeleccionado ?? ''}
            onChange={handleRolChange}
            disabled={cargandoInicial}
            style={{
              padding: 'var(--esp-2) var(--esp-3)',
              border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-md)',
              background: 'var(--superficie-base)',
              fontSize: 'var(--texto-sm)',
              color: 'var(--ink-primario)',
              fontFamily: 'var(--fuente-ui)',
              outline: 'none',
              cursor: cargandoInicial ? 'not-allowed' : 'pointer',
              minWidth: 240,
            }}
          >
            <option value="">Seleccionar un rol...</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>

          {rolIdSeleccionado && !cargandoPermisos && (
            <div style={{ display: 'flex', gap: 'var(--esp-2)' }}>
              <button
                onClick={seleccionarTodo}
                style={{
                  padding: 'var(--esp-1) var(--esp-3)',
                  border: '1px solid var(--verde-300)',
                  borderRadius: 'var(--radio-md)',
                  background: 'var(--verde-50, #F0FDF4)',
                  color: 'var(--verde-700)',
                  fontSize: 'var(--texto-xs)', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Seleccionar todo
              </button>
              <button
                onClick={limpiarTodo}
                style={{
                  padding: 'var(--esp-1) var(--esp-3)',
                  border: '1px solid var(--borde-control)',
                  borderRadius: 'var(--radio-md)',
                  background: 'transparent',
                  color: 'var(--ink-secundario)',
                  fontSize: 'var(--texto-xs)', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {rolIdSeleccionado && !cargandoPermisos && (
            <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', fontFamily: 'var(--fuente-mono)' }}>
              {seleccionados.size} / {todosPermisos.length} permisos
            </span>
          )}
        </div>
      </div>

      {/* Banners */}
      {rolNombre === 'Admin' && rolIdSeleccionado && (
        <div style={{
          background: 'var(--ambar-100)', border: '1px solid var(--ambar-300)',
          borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)',
          marginBottom: 'var(--esp-4)',
          display: 'flex', alignItems: 'flex-start', gap: 'var(--esp-2)',
          color: 'var(--ambar-700)', fontSize: 'var(--texto-sm)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          El rol Admin tiene acceso total. Se recomienda mantener todos los permisos habilitados.
        </div>
      )}

      {exito && (
        <div style={{
          background: 'var(--verde-50, #F0FDF4)', border: '1px solid #86EFAC',
          borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)',
          marginBottom: 'var(--esp-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
          color: 'var(--verde-700, #15803D)', fontSize: 'var(--texto-sm)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Permisos de {rolNombre} actualizados exitosamente.
        </div>
      )}

      {errorGlobal && (
        <div style={{
          background: 'var(--rojo-50, #FEF2F2)', border: '1px solid #FECACA',
          borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)',
          marginBottom: 'var(--esp-4)',
          color: 'var(--rojo-700, #B91C1C)', fontSize: 'var(--texto-sm)',
        }}>
          {errorGlobal}
        </div>
      )}

      {/* Estado vacío */}
      {!rolIdSeleccionado && !cargandoInicial && (
        <div style={{
          background: 'var(--superficie-base)',
          border: '1px solid var(--borde-sutil)',
          borderRadius: 'var(--radio-lg)',
          padding: 'var(--esp-16)',
          textAlign: 'center',
          color: 'var(--ink-terciario)',
          fontSize: 'var(--texto-sm)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto var(--esp-4)', display: 'block', color: 'var(--neutro-300)' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Selecciona un rol para gestionar sus permisos
        </div>
      )}

      {/* Skeleton */}
      {cargandoPermisos && (
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              border: '1px solid var(--borde-sutil)',
              borderRadius: 'var(--radio-md)',
              marginBottom: 'var(--esp-3)',
              overflow: 'hidden',
            }}>
              <div style={{ height: 44, background: 'var(--neutro-200)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ padding: 'var(--esp-3) var(--esp-4)', display: 'flex', gap: 'var(--esp-3)', flexWrap: 'wrap' }}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} style={{
                    height: 20, width: 80, borderRadius: 4,
                    background: 'var(--neutro-200)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Matriz de permisos */}
      {rolIdSeleccionado && !cargandoPermisos && (
        <>
          {Object.entries(grupos).map(([recurso, permisos]) => {
            const todosOn = permisos.every(p => seleccionados.has(p.id));
            const algunosOn = !todosOn && permisos.some(p => seleccionados.has(p.id));
            return (
              <div key={recurso} style={{
                border: '1px solid var(--borde-normal)',
                borderRadius: 'var(--radio-md)',
                marginBottom: 'var(--esp-3)',
                overflow: 'hidden',
              }}>
                {/* Card header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--esp-3) var(--esp-4)',
                  background: 'var(--superficie-canvas)',
                  borderBottom: '1px solid var(--borde-sutil)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-2)' }}>
                    <span style={{ fontSize: 'var(--texto-sm)', fontWeight: 600, color: 'var(--ink-primario)' }}>
                      {capitalizar(recurso)}
                    </span>
                    {algunosOn && (
                      <span style={{
                        fontSize: 'var(--texto-xs)', color: 'var(--ambar-600)',
                        background: 'var(--ambar-100)',
                        borderRadius: 'var(--radio-full)', padding: '1px 6px',
                      }}>parcial</span>
                    )}
                    {todosOn && (
                      <span style={{
                        fontSize: 'var(--texto-xs)', color: 'var(--verde-700)',
                        background: 'var(--verde-100)',
                        borderRadius: 'var(--radio-full)', padding: '1px 6px',
                      }}>todos</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleGrupo(permisos)}
                    style={{
                      fontSize: 'var(--texto-xs)',
                      color: todosOn ? 'var(--rojo-500, #EF4444)' : 'var(--verde-600)',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', padding: '2px 6px',
                      borderRadius: 'var(--radio-sm)', fontWeight: 500,
                    }}
                  >
                    {todosOn ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                {/* Checkboxes */}
                <div style={{
                  padding: 'var(--esp-3) var(--esp-4)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 'var(--esp-2)',
                }}>
                  {permisos.map(p => (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
                      fontSize: 'var(--texto-sm)', cursor: 'pointer',
                      padding: 'var(--esp-1) var(--esp-2)',
                      borderRadius: 'var(--radio-sm)',
                      color: seleccionados.has(p.id) ? 'var(--verde-700)' : 'var(--ink-secundario)',
                      fontWeight: seleccionados.has(p.id) ? 500 : 400,
                    }}>
                      <input
                        type="checkbox"
                        checked={seleccionados.has(p.id)}
                        onChange={() => toggle(p.id)}
                        style={{ accentColor: 'var(--verde-600)', cursor: 'pointer' }}
                      />
                      {p.accion}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Botón guardar */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            gap: 'var(--esp-4)',
            marginTop: 'var(--esp-4)',
            padding: 'var(--esp-4) var(--esp-6)',
            background: 'var(--superficie-base)',
            border: '1px solid var(--borde-normal)',
            borderRadius: 'var(--radio-lg)',
          }}>
            <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>
              {seleccionados.size} de {todosPermisos.length} permisos activos para <strong>{rolNombre}</strong>
            </span>
            <button
              onClick={guardar}
              disabled={guardando}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
                padding: 'var(--esp-2) var(--esp-5)',
                border: 'none', borderRadius: 'var(--radio-md)',
                background: 'var(--verde-600)', color: 'white',
                fontSize: 'var(--texto-sm)', fontWeight: 600,
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.7 : 1,
              }}
            >
              {guardando && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {guardando ? 'Guardando...' : 'Guardar permisos'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
