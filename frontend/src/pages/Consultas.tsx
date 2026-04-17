import { useState, useEffect } from 'react';
import ConsultaModal, { type ConsultaEditar } from '../components/ConsultaModal';

interface Consulta {
  id: number;
  paciente_id: number;
  veterinario_id: number;
  servicio_id: number | null;
  paciente: string;
  especie: string;
  color_acento: string;
  dueño: string;
  veterinario: string;
  servicio: string | null;
  fecha_hora: string;
  motivo_consulta: string;
  diagnostico: string | null;
  diagnostico_cie: string | null;
  estado: 'en_curso' | 'completada' | 'requiere_seguimiento';
  peso_al_consulta: number | null;
  temperatura_c: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  anamnesis: string | null;
  examen_fisico: string | null;
  tratamiento: string | null;
  indicaciones: string | null;
  observaciones: string | null;
}

const CONSULTAS_EJEMPLO: Consulta[] = [
  { id: 1, paciente_id: 1, veterinario_id: 1, servicio_id: null, paciente: 'Firulais', especie: 'Perro', color_acento: '#D4850A', dueño: 'Carlos M.', veterinario: 'Dra. García', servicio: 'Consulta General', fecha_hora: new Date().toISOString(), motivo_consulta: 'Revisión anual y vacunación', diagnostico: 'Animal sano', diagnostico_cie: null, estado: 'completada', peso_al_consulta: 28.5, temperatura_c: 38.5, frecuencia_cardiaca: 80, frecuencia_respiratoria: 20, anamnesis: null, examen_fisico: null, tratamiento: null, indicaciones: null, observaciones: null },
  { id: 2, paciente_id: 2, veterinario_id: 1, servicio_id: null, paciente: 'Rocky', especie: 'Perro', color_acento: '#D4850A', dueño: 'Luis P.', veterinario: 'Dr. López', servicio: 'Consulta General', fecha_hora: new Date(Date.now() - 3600000).toISOString(), motivo_consulta: 'Vómitos frecuentes hace 2 días', diagnostico: null, diagnostico_cie: null, estado: 'en_curso', peso_al_consulta: 34.2, temperatura_c: 39.1, frecuencia_cardiaca: null, frecuencia_respiratoria: null, anamnesis: null, examen_fisico: null, tratamiento: null, indicaciones: null, observaciones: null },
  { id: 3, paciente_id: 3, veterinario_id: 1, servicio_id: null, paciente: 'Mishi', especie: 'Gato', color_acento: '#6B48B8', dueño: 'Ana R.', veterinario: 'Dra. García', servicio: 'Hemograma', fecha_hora: new Date(Date.now() - 86400000).toISOString(), motivo_consulta: 'Control post-operatorio', diagnostico: 'Recuperación satisfactoria', diagnostico_cie: null, estado: 'requiere_seguimiento', peso_al_consulta: 4.2, temperatura_c: 38.8, frecuencia_cardiaca: null, frecuencia_respiratoria: null, anamnesis: null, examen_fisico: null, tratamiento: null, indicaciones: null, observaciones: null },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  en_curso:             { color: '#D4850A', bg: '#FEF3E2', label: 'En curso' },
  completada:           { color: '#2A7A52', bg: '#EBF5EE', label: 'Completada' },
  requiere_seguimiento: { color: '#2C5F8A', bg: '#E8F1F8', label: 'Seguimiento' },
};

function authHeaders(): HeadersInit {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function Consultas() {
  const [consultas, setConsultas] = useState<Consulta[]>(CONSULTAS_EJEMPLO);
  const [cargando, setCargando] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [seleccionada, setSeleccionada] = useState<Consulta | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [consultaEditar, setConsultaEditar] = useState<ConsultaEditar | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const res = await fetch('/api/consultas?limit=50', { headers: authHeaders() });
        if (res.ok) {
          const datos = await res.json();
          setConsultas(Array.isArray(datos) ? datos : CONSULTAS_EJEMPLO);
        }
      } catch {
        // usar datos de ejemplo
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [reloadKey]);

  const abrirNuevo = () => { setConsultaEditar(null); setModalAbierto(true); };

  const abrirEditar = (c: Consulta) => {
    setConsultaEditar({
      id: c.id,
      paciente_id: c.paciente_id,
      servicio_id: c.servicio_id,
      motivo_consulta: c.motivo_consulta,
      anamnesis: c.anamnesis,
      examen_fisico: c.examen_fisico,
      diagnostico: c.diagnostico,
      diagnostico_cie: c.diagnostico_cie,
      tratamiento: c.tratamiento,
      indicaciones: c.indicaciones,
      observaciones: c.observaciones,
      estado: c.estado,
      peso_al_consulta: c.peso_al_consulta,
      temperatura_c: c.temperatura_c,
      frecuencia_cardiaca: c.frecuencia_cardiaca,
      frecuencia_respiratoria: c.frecuencia_respiratoria,
    });
    setModalAbierto(true);
  };

  const desactivar = async (id: number) => {
    if (!confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.')) return;
    setEliminando(id);
    try {
      await fetch(`/api/consultas/${id}/desactivar`, { method: 'PATCH', headers: authHeaders() });
      if (seleccionada?.id === id) setSeleccionada(null);
      setReloadKey(k => k + 1);
    } catch { /* silencioso */ } finally {
      setEliminando(null);
    }
  };

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const fmtHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <ConsultaModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => setReloadKey(k => k + 1)}
        consultaEditar={consultaEditar}
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
              Consultas
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {consultas.length} atención{consultas.length !== 1 ? 'es' : ''} registrada{consultas.length !== 1 ? 's' : ''}
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
            + Nueva consulta
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1fr 380px' : '1fr', gap: 'var(--esp-4)' }}>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-2)' }}>
            {cargando ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  background: 'var(--superficie-base)', border: '1px solid var(--borde-sutil)',
                  borderRadius: 'var(--radio-lg)', padding: 'var(--esp-4)',
                }}>
                  {[80, 60, 40].map((w, j) => (
                    <div key={j} style={{
                      height: 12, width: `${w}%`, borderRadius: 4,
                      background: 'var(--neutro-200)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      marginBottom: j < 2 ? 8 : 0,
                    }} />
                  ))}
                </div>
              ))
            ) : consultas.length === 0 ? (
              <div style={{
                background: 'var(--superficie-base)', border: '1px solid var(--borde-sutil)',
                borderRadius: 'var(--radio-lg)', padding: 'var(--esp-16)',
                textAlign: 'center', color: 'var(--ink-terciario)', fontSize: 'var(--texto-sm)',
              }}>
                No hay consultas registradas
              </div>
            ) : (
              consultas.map(c => {
                const ec = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.en_curso;
                const activa = seleccionada?.id === c.id;
                return (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--superficie-base)',
                      border: `1px solid ${activa ? (c.color_acento + '50') : 'var(--borde-sutil)'}`,
                      borderRadius: 'var(--radio-lg)',
                      padding: 'var(--esp-4)',
                      transition: 'border-color var(--transicion-rapida)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--esp-4)', justifyContent: 'space-between' }}>
                      {/* Info principal — clickable para detalle */}
                      <div
                        onClick={() => setSeleccionada(activa ? null : c)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--esp-3)', flex: 1, minWidth: 0, cursor: 'pointer' }}
                      >
                        <div style={{
                          width: 10, height: 10, borderRadius: 'var(--radio-full)',
                          background: c.color_acento, marginTop: 5, flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--texto-md)', fontWeight: 'var(--peso-semibold)', color: 'var(--ink-primario)' }}>
                            {c.paciente}
                            <span style={{ fontWeight: 400, color: 'var(--ink-terciario)' }}>{' · '}{c.dueño}</span>
                          </div>
                          <div style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)', marginTop: 2 }}>
                            {c.motivo_consulta}
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--esp-4)', marginTop: 'var(--esp-2)', fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>
                            <span>{c.veterinario}</span>
                            {c.servicio && <span>{c.servicio}</span>}
                            {c.peso_al_consulta != null && <span style={{ fontFamily: 'var(--fuente-mono)' }}>{c.peso_al_consulta} kg</span>}
                            {c.temperatura_c != null && <span style={{ fontFamily: 'var(--fuente-mono)' }}>{c.temperatura_c}°C</span>}
                          </div>
                        </div>
                      </div>

                      {/* Acciones + estado */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--esp-2)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-2)' }}>
                          <span style={{
                            fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-medio)',
                            color: ec.color, background: ec.bg,
                            borderRadius: 'var(--radio-full)', padding: '3px 10px',
                          }}>
                            {ec.label}
                          </span>
                          <button
                            onClick={() => abrirEditar(c)}
                            title="Editar"
                            style={{
                              width: 28, height: 28,
                              border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
                              background: 'transparent', color: 'var(--ink-secundario)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => desactivar(c.id)}
                            disabled={eliminando === c.id}
                            title="Eliminar"
                            style={{
                              width: 28, height: 28,
                              border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
                              background: 'transparent',
                              color: eliminando === c.id ? 'var(--ink-muted)' : '#C53030',
                              cursor: eliminando === c.id ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: eliminando === c.id ? 0.5 : 1,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                        <span style={{
                          fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-xs)',
                          color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {fmtFecha(c.fecha_hora)} {fmtHora(c.fecha_hora)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel de detalle */}
          {seleccionada && (
            <div style={{
              background: 'var(--superficie-base)', border: '1px solid var(--borde-sutil)',
              borderRadius: 'var(--radio-xl)', padding: 'var(--esp-5)',
              alignSelf: 'flex-start', position: 'sticky', top: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--esp-4)' }}>
                <h3 style={{
                  fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-lg)',
                  fontWeight: 600, color: 'var(--ink-primario)',
                }}>
                  Ficha clínica
                </h3>
                <button
                  onClick={() => setSeleccionada(null)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-terciario)', fontSize: 18 }}
                >×</button>
              </div>

              {([
                { label: 'Paciente', valor: `${seleccionada.paciente} (${seleccionada.especie})` },
                { label: 'Dueño', valor: seleccionada.dueño },
                { label: 'Veterinario', valor: seleccionada.veterinario },
                { label: 'Fecha', valor: `${fmtFecha(seleccionada.fecha_hora)} ${fmtHora(seleccionada.fecha_hora)}` },
                { label: 'Motivo', valor: seleccionada.motivo_consulta },
                { label: 'Diagnóstico', valor: seleccionada.diagnostico ?? '—' },
                { label: 'Tratamiento', valor: seleccionada.tratamiento ?? '—' },
                { label: 'Indicaciones', valor: seleccionada.indicaciones ?? '—' },
                { label: 'Peso', valor: seleccionada.peso_al_consulta != null ? `${seleccionada.peso_al_consulta} kg` : '—' },
                { label: 'Temperatura', valor: seleccionada.temperatura_c != null ? `${seleccionada.temperatura_c}°C` : '—' },
                { label: 'FC', valor: seleccionada.frecuencia_cardiaca != null ? `${seleccionada.frecuencia_cardiaca} lpm` : '—' },
                { label: 'FR', valor: seleccionada.frecuencia_respiratoria != null ? `${seleccionada.frecuencia_respiratoria} rpm` : '—' },
              ] as { label: string; valor: string }[]).map(({ label, valor }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--esp-3)' }}>
                  <span style={{
                    fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-semibold)',
                    color: 'var(--ink-terciario)', letterSpacing: 'var(--tracking-muy-amplio)',
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)' }}>
                    {valor}
                  </span>
                </div>
              ))}

              {seleccionada.observaciones && (
                <div style={{ marginTop: 'var(--esp-2)' }}>
                  <span style={{
                    fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-semibold)',
                    color: 'var(--ink-terciario)', letterSpacing: 'var(--tracking-muy-amplio)',
                    textTransform: 'uppercase', display: 'block', marginBottom: 4,
                  }}>
                    Observaciones
                  </span>
                  <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>
                    {seleccionada.observaciones}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
