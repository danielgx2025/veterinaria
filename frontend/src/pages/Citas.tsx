import { useState, useEffect } from 'react';
import NuevaCitaModal from '../components/NuevaCitaModal';

interface Cita {
  id: number;
  paciente_id: number;
  veterinario_id: number;
  servicio_id: number | null;
  paciente: string;
  especie: string;
  color_especie: string;
  dueño: string;
  telefono: string;
  servicio: string;
  veterinario: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_se_presento';
  notas?: string;
}

const CITAS_EJEMPLO: Cita[] = [
  { id: 1, paciente_id: 1, veterinario_id: 1, servicio_id: 1, paciente: 'Firulais', especie: 'Perro', color_especie: '#D4850A', dueño: 'Carlos M.', telefono: '555-1234', servicio: 'Vacunación Antirrábica', veterinario: 'Dra. García', fecha_hora_inicio: new Date(new Date().setHours(9, 0)).toISOString(), fecha_hora_fin: new Date(new Date().setHours(9, 30)).toISOString(), estado: 'confirmada' },
  { id: 2, paciente_id: 2, veterinario_id: 2, servicio_id: 2, paciente: 'Mishi', especie: 'Gato', color_especie: '#6B48B8', dueño: 'Ana R.', telefono: '555-5678', servicio: 'Consulta General', veterinario: 'Dr. López', fecha_hora_inicio: new Date(new Date().setHours(10, 0)).toISOString(), fecha_hora_fin: new Date(new Date().setHours(10, 30)).toISOString(), estado: 'programada' },
  { id: 3, paciente_id: 3, veterinario_id: 1, servicio_id: 3, paciente: 'Rocky', especie: 'Perro', color_especie: '#D4850A', dueño: 'Luis P.', telefono: '555-9012', servicio: 'Desparasitación', veterinario: 'Dra. García', fecha_hora_inicio: new Date(new Date().setHours(11, 0)).toISOString(), fecha_hora_fin: new Date(new Date().setHours(11, 15)).toISOString(), estado: 'en_curso' },
  { id: 4, paciente_id: 4, veterinario_id: 2, servicio_id: 2, paciente: 'Piolín', especie: 'Ave', color_especie: '#0891B2', dueño: 'María G.', telefono: '555-3456', servicio: 'Consulta General', veterinario: 'Dr. López', fecha_hora_inicio: new Date(new Date().setHours(14, 0)).toISOString(), fecha_hora_fin: new Date(new Date().setHours(14, 30)).toISOString(), estado: 'programada' },
  { id: 5, paciente_id: 5, veterinario_id: 1, servicio_id: 4, paciente: 'Luna', especie: 'Gato', color_especie: '#6B48B8', dueño: 'Roberto L.', telefono: '555-7890', servicio: 'Castración', veterinario: 'Dra. García', fecha_hora_inicio: new Date(new Date().setHours(15, 30)).toISOString(), fecha_hora_fin: new Date(new Date().setHours(17, 0)).toISOString(), estado: 'programada' },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  programada:      { color: '#2C5F8A', bg: '#E8F1F8', label: 'Programada' },
  confirmada:      { color: '#2A7A52', bg: '#EBF5EE', label: 'Confirmada' },
  en_curso:        { color: '#D4850A', bg: '#FEF3E2', label: 'En curso' },
  completada:      { color: '#6B48B8', bg: '#EDE9F8', label: 'Completada' },
  cancelada:       { color: '#C53030', bg: '#FEE8E8', label: 'Cancelada' },
  no_se_presento:  { color: '#6B7280', bg: '#F3F4F6', label: 'No se presentó' },
};

const HORAS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export default function Citas() {
  const [citas, setCitas] = useState<Cita[]>(CITAS_EJEMPLO);
  const [vistaTipo, setVistaTipo] = useState<'lista' | 'timeline'>('timeline');
  const [reloadKey, setReloadKey] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const today = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/api/citas?fecha=${today}`, { headers });
        if (res.ok) {
          const datos = await res.json();
          setCitas(datos.data ?? CITAS_EJEMPLO);
        }
      } catch {
        // usar datos de ejemplo
      }
    };
    cargar();
  }, [reloadKey]);

  const recargar = () => setReloadKey(k => k + 1);

  const abrirEditar = (cita: Cita) => {
    setCitaEditando(cita);
    setModalAbierto(true);
  };

  const abrirNueva = () => {
    setCitaEditando(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCitaEditando(null);
  };

  const cancelarCita = async (id: number) => {
    setEliminando(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/citas/${id}/cancelar`, { method: 'PATCH', headers });
      if (res.ok) {
        setCitas(prev => prev.filter(c => c.id !== id));
      }
    } catch {
      // silencioso
    } finally {
      setEliminando(false);
      setConfirmandoId(null);
    }
  };

  const citaPorHora = (hora: string) =>
    citas.filter(c => new Date(c.fecha_hora_inicio).getHours() === parseInt(hora));

  const AccionesCita = ({ cita }: { cita: Cita }) => (
    <div style={{ display: 'flex', gap: 'var(--esp-1)', flexShrink: 0 }}>
      {confirmandoId === cita.id ? (
        <>
          <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', alignSelf: 'center' }}>
            ¿Cancelar?
          </span>
          <button
            onClick={() => cancelarCita(cita.id)}
            disabled={eliminando}
            style={{
              padding: '2px 8px', fontSize: 'var(--texto-xs)',
              background: '#C53030', color: 'white', border: 'none',
              borderRadius: 'var(--radio-sm)', cursor: 'pointer',
            }}
          >
            {eliminando ? '...' : 'Sí'}
          </button>
          <button
            onClick={() => setConfirmandoId(null)}
            style={{
              padding: '2px 8px', fontSize: 'var(--texto-xs)',
              background: 'transparent', color: 'var(--ink-terciario)',
              border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-sm)', cursor: 'pointer',
            }}
          >
            No
          </button>
        </>
      ) : (
        <>
          <button
            onClick={e => { e.stopPropagation(); abrirEditar(cita); }}
            title="Editar"
            style={{
              width: 28, height: 28, border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-sm)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-terciario)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirmandoId(cita.id); }}
            title="Cancelar cita"
            style={{
              width: 28, height: 28, border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-sm)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-terciario)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <NuevaCitaModal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        onGuardada={recargar}
        citaEditar={citaEditando}
      />

      <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
        {/* Cabecera */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--esp-6)', flexWrap: 'wrap', gap: 'var(--esp-4)',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--fuente-display)',
              fontSize: 'var(--texto-2xl)', fontWeight: 400,
              color: 'var(--ink-primario)',
            }}>
              Agenda
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{citas.length} cita{citas.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--esp-3)', alignItems: 'center' }}>
            {/* Toggle vista */}
            <div style={{
              display: 'flex', background: 'var(--superficie-elevada)',
              borderRadius: 'var(--radio-md)', padding: 2,
              border: '1px solid var(--borde-sutil)',
            }}>
              {(['timeline', 'lista'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVistaTipo(v)}
                  style={{
                    padding: 'var(--esp-1) var(--esp-3)',
                    borderRadius: 'var(--radio-sm)', border: 'none',
                    background: vistaTipo === v ? 'var(--superficie-base)' : 'transparent',
                    color: vistaTipo === v ? 'var(--ink-primario)' : 'var(--ink-terciario)',
                    fontSize: 'var(--texto-xs)',
                    fontWeight: vistaTipo === v ? 'var(--peso-semibold)' : 'var(--peso-normal)',
                    cursor: 'pointer',
                    boxShadow: vistaTipo === v ? 'var(--sombra-sm)' : 'none',
                    transition: 'all var(--transicion-rapida)',
                  }}
                >
                  {v === 'timeline' ? 'Línea de tiempo' : 'Lista'}
                </button>
              ))}
            </div>

            <button
              onClick={abrirNueva}
              style={{
                padding: 'var(--esp-2) var(--esp-4)',
                background: 'var(--verde-600)', color: 'white',
                border: 'none', borderRadius: 'var(--radio-md)',
                fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
                cursor: 'pointer',
              }}
            >
              + Nueva cita
            </button>
          </div>
        </div>

        {vistaTipo === 'timeline' ? (
          /* VISTA TIMELINE */
          <div style={{
            background: 'var(--superficie-base)',
            border: '1px solid var(--borde-sutil)',
            borderRadius: 'var(--radio-xl)',
            overflow: 'hidden',
          }}>
            {HORAS.map((hora, hi) => {
              const citasHora = citaPorHora(hora);
              return (
                <div key={hora} style={{
                  display: 'flex',
                  borderBottom: hi < HORAS.length - 1 ? '1px solid var(--borde-sutil)' : 'none',
                  minHeight: citasHora.length > 0 ? 'auto' : 48,
                }}>
                  <div style={{
                    width: 64, minWidth: 64, padding: 'var(--esp-3)',
                    fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-xs)',
                    color: 'var(--ink-terciario)', borderRight: '1px solid var(--borde-sutil)',
                    display: 'flex', alignItems: 'flex-start', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {hora}
                  </div>
                  <div style={{
                    flex: 1, padding: 'var(--esp-2)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--esp-2)',
                  }}>
                    {citasHora.map(cita => {
                      const ec = ESTADO_CONFIG[cita.estado];
                      return (
                        <div key={cita.id} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--esp-3)',
                          padding: 'var(--esp-2) var(--esp-3)',
                          background: `${cita.color_especie}08`,
                          borderLeft: `3px solid ${cita.color_especie}`,
                          borderRadius: 'var(--radio-md)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
                              color: 'var(--ink-primario)',
                            }}>
                              {cita.paciente}
                              <span style={{ color: 'var(--ink-terciario)', fontWeight: 400 }}>
                                {' · '}{cita.servicio}
                              </span>
                            </div>
                            <div style={{
                              fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)',
                              display: 'flex', gap: 'var(--esp-3)', marginTop: 2,
                            }}>
                              <span>{cita.dueño}</span>
                              <span>{cita.veterinario}</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-medio)',
                            color: ec.color, background: ec.bg,
                            borderRadius: 'var(--radio-full)', padding: '2px 8px',
                            whiteSpace: 'nowrap', flexShrink: 0,
                          }}>
                            {ec.label}
                          </span>
                          <AccionesCita cita={cita} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA LISTA */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-2)' }}>
            {citas.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 'var(--esp-16)',
                color: 'var(--ink-terciario)', fontSize: 'var(--texto-sm)',
              }}>
                No hay citas programadas para hoy
              </div>
            ) : citas.map(cita => {
              const ec = ESTADO_CONFIG[cita.estado];
              return (
                <div key={cita.id} style={{
                  background: 'var(--superficie-base)',
                  border: '1px solid var(--borde-sutil)',
                  borderRadius: 'var(--radio-md)',
                  padding: 'var(--esp-4)',
                  display: 'flex', alignItems: 'center', gap: 'var(--esp-4)',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 'var(--radio-full)',
                    background: cita.color_especie, flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)',
                    color: 'var(--ink-secundario)', minWidth: 48, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 'var(--peso-semibold)' }}>{cita.paciente}</span>
                    <span style={{ color: 'var(--ink-terciario)' }}> · {cita.servicio}</span>
                    <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 2 }}>
                      {cita.dueño} · {cita.telefono} · {cita.veterinario}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-medio)',
                    color: ec.color, background: ec.bg,
                    borderRadius: 'var(--radio-full)', padding: '3px 10px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {ec.label}
                  </span>
                  <AccionesCita cita={cita} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
