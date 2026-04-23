import { useState, useEffect } from 'react';

interface Permiso {
  id: number;
  recurso: string;
  accion: string;
  descripcion: string | null;
}

interface RolPermisosModalProps {
  abierto: boolean;
  onCerrar: () => void;
  rolId: number;
  rolNombre: string;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RolPermisosModal({ abierto, onCerrar, rolId, rolNombre }: RolPermisosModalProps) {
  const [todosPermisos, setTodosPermisos] = useState<Permiso[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');

  useEffect(() => {
    if (!abierto || !rolId) return;
    setCargando(true);
    setExito(false);
    setErrorGlobal('');

    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/catalogos/permisos', { headers }).then(r => r.json()),
      fetch(`/api/roles/${rolId}/permisos`, { headers }).then(r => r.json()),
    ])
      .then(([todos, asignados]: [Permiso[], number[]]) => {
        setTodosPermisos(todos);
        setSeleccionados(new Set(asignados));
      })
      .catch(() => setErrorGlobal('No se pudieron cargar los permisos.'))
      .finally(() => setCargando(false));
  }, [abierto, rolId]);

  if (!abierto) return null;

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

  const guardar = async () => {
    setGuardando(true);
    setErrorGlobal('');
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/roles/${rolId}/permisos`, {
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
      setTimeout(() => onCerrar(), 1400);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidePanel  { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin        { to { transform: rotate(360deg) } }
        @keyframes pulse       { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>

      <div
        onClick={guardando ? undefined : onCerrar}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.45)',
          animation: 'fadeOverlay 0.15s ease',
        }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 620, maxWidth: '100vw',
        background: 'var(--superficie-base)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        animation: 'slidePanel 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: 'var(--esp-5) var(--esp-6)',
          borderBottom: '1px solid var(--borde-sutil)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-xl)',
              fontWeight: 400, color: 'var(--ink-primario)', margin: 0,
            }}>
              Permisos de {rolNombre}
            </h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4 }}>
              {seleccionados.size} permiso{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onCerrar}
            disabled={guardando}
            style={{
              width: 32, height: 32, flexShrink: 0,
              border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-md)',
              background: 'transparent', cursor: guardando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-secundario)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--esp-4) var(--esp-6)' }}>

          {/* Banner para rol Admin */}
          {rolNombre === 'Admin' && (
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
              Permisos actualizados exitosamente.
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

          {/* Skeleton */}
          {cargando ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                border: '1px solid var(--borde-sutil)',
                borderRadius: 'var(--radio-md)',
                marginBottom: 'var(--esp-3)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: 44, background: 'var(--neutro-200)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
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
            ))
          ) : (
            Object.entries(grupos).map(([recurso, permisos]) => {
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
                      <span style={{
                        fontSize: 'var(--texto-sm)', fontWeight: 600,
                        color: 'var(--ink-primario)',
                      }}>
                        {capitalizar(recurso)}
                      </span>
                      {algunosOn && (
                        <span style={{
                          fontSize: 'var(--texto-xs)', color: 'var(--ambar-600)',
                          background: 'var(--ambar-100)',
                          borderRadius: 'var(--radio-full)', padding: '1px 6px',
                        }}>
                          parcial
                        </span>
                      )}
                      {todosOn && (
                        <span style={{
                          fontSize: 'var(--texto-xs)', color: 'var(--verde-700)',
                          background: 'var(--verde-100)',
                          borderRadius: 'var(--radio-full)', padding: '1px 6px',
                        }}>
                          todos
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleGrupo(permisos)}
                      style={{
                        fontSize: 'var(--texto-xs)',
                        color: todosOn ? 'var(--rojo-500, #EF4444)' : 'var(--verde-600)',
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', padding: '2px 6px',
                        borderRadius: 'var(--radio-sm)',
                        fontWeight: 500,
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
                      <label
                        key={p.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
                          fontSize: 'var(--texto-sm)', cursor: 'pointer',
                          padding: 'var(--esp-1) var(--esp-2)',
                          borderRadius: 'var(--radio-sm)',
                          color: seleccionados.has(p.id) ? 'var(--verde-700)' : 'var(--ink-secundario)',
                          fontWeight: seleccionados.has(p.id) ? 500 : 400,
                        }}
                      >
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
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--esp-4) var(--esp-6)',
          borderTop: '1px solid var(--borde-sutil)',
          flexShrink: 0,
          background: 'var(--superficie-base)',
        }}>
          <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>
            {seleccionados.size} de {todosPermisos.length} permisos activos
          </span>
          <div style={{ display: 'flex', gap: 'var(--esp-3)' }}>
            <button
              onClick={onCerrar}
              disabled={guardando}
              style={{
                padding: 'var(--esp-2) var(--esp-5)',
                border: '1px solid var(--borde-control)',
                borderRadius: 'var(--radio-md)',
                background: 'transparent',
                color: 'var(--ink-secundario)',
                fontSize: 'var(--texto-sm)',
                cursor: guardando ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || exito || cargando}
              style={{
                padding: 'var(--esp-2) var(--esp-5)',
                border: 'none',
                borderRadius: 'var(--radio-md)',
                background: exito ? 'var(--verde-700, #15803D)' : 'var(--verde-600)',
                color: 'white',
                fontSize: 'var(--texto-sm)',
                fontWeight: 600,
                cursor: guardando || exito || cargando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.7 : 1,
                transition: 'background 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
              }}
            >
              {guardando && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {guardando ? 'Guardando...' : exito ? 'Guardado ✓' : 'Guardar permisos'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
