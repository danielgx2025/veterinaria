import { useState } from 'react';

interface Consulta {
  id: number;
  paciente: string;
  especie: string;
  color_especie: string;
  dueño: string;
  veterinario: string;
  servicio: string;
  fecha_hora: string;
  motivo_consulta: string;
  diagnostico?: string;
  estado: 'en_curso' | 'completada' | 'requiere_seguimiento';
  peso_al_consulta?: number;
  temperatura_c?: number;
}

const CONSULTAS_EJEMPLO: Consulta[] = [
  { id: 1, paciente: 'Firulais', especie: 'Perro', color_especie: '#D4850A', dueño: 'Carlos M.', veterinario: 'Dra. García', servicio: 'Consulta General', fecha_hora: new Date().toISOString(), motivo_consulta: 'Revisión anual y vacunación', diagnostico: 'Animal sano, al día con vacunas', estado: 'completada', peso_al_consulta: 28.5, temperatura_c: 38.5 },
  { id: 2, paciente: 'Rocky', especie: 'Perro', color_especie: '#D4850A', dueño: 'Luis P.', veterinario: 'Dr. López', servicio: 'Consulta General', fecha_hora: new Date(Date.now() - 3600000).toISOString(), motivo_consulta: 'Vómitos frecuentes hace 2 días', estado: 'en_curso', peso_al_consulta: 34.2, temperatura_c: 39.1 },
  { id: 3, paciente: 'Mishi', especie: 'Gato', color_especie: '#6B48B8', dueño: 'Ana R.', veterinario: 'Dra. García', servicio: 'Hemograma Completo', fecha_hora: new Date(Date.now() - 86400000).toISOString(), motivo_consulta: 'Control post-operatorio', diagnostico: 'Recuperación satisfactoria', estado: 'requiere_seguimiento', peso_al_consulta: 4.2, temperatura_c: 38.8 },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  en_curso:           { color: '#D4850A', bg: '#FEF3E2', label: 'En curso' },
  completada:         { color: '#2A7A52', bg: '#EBF5EE', label: 'Completada' },
  requiere_seguimiento: { color: '#2C5F8A', bg: '#E8F1F8', label: 'Seguimiento' },
};

export default function Consultas() {
  const [consultas] = useState<Consulta[]>(CONSULTAS_EJEMPLO);
  const [seleccionada, setSeleccionada] = useState<Consulta | null>(null);

  return (
    <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--esp-6)',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--fuente-display)',
            fontSize: 'var(--texto-2xl)', fontWeight: 400,
            color: 'var(--ink-primario)',
          }}>
            Consultas
          </h2>
          <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
            {consultas.length} atenciones registradas
          </p>
        </div>
        <button style={{
          padding: 'var(--esp-2) var(--esp-4)',
          background: 'var(--verde-600)', color: 'white',
          border: 'none', borderRadius: 'var(--radio-md)',
          fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
          cursor: 'pointer',
        }}>
          + Nueva consulta
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1fr 380px' : '1fr', gap: 'var(--esp-4)' }}>
        {/* Lista de consultas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-2)' }}>
          {consultas.map(c => {
            const ec = ESTADO_CONFIG[c.estado];
            const activa = seleccionada?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSeleccionada(activa ? null : c)}
                style={{
                  background: 'var(--superficie-base)',
                  border: `1px solid ${activa ? c.color_especie + '50' : 'var(--borde-sutil)'}`,
                  borderRadius: 'var(--radio-lg)',
                  padding: 'var(--esp-4)',
                  cursor: 'pointer',
                  transition: 'border-color var(--transicion-rapida)',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  gap: 'var(--esp-4)', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--esp-3)', flex: 1, minWidth: 0 }}>
                    {/* Punto de especie */}
                    <div style={{
                      width: 10, height: 10,
                      borderRadius: 'var(--radio-full)',
                      background: c.color_especie,
                      marginTop: 5, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--texto-md)',
                        fontWeight: 'var(--peso-semibold)',
                        color: 'var(--ink-primario)',
                      }}>
                        {c.paciente}
                        <span style={{ fontWeight: 400, color: 'var(--ink-terciario)' }}>
                          {' · '}{c.dueño}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 'var(--texto-sm)',
                        color: 'var(--ink-secundario)',
                        marginTop: 2,
                      }}>
                        {c.motivo_consulta}
                      </div>
                      <div style={{
                        display: 'flex', gap: 'var(--esp-4)',
                        marginTop: 'var(--esp-2)',
                        fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)',
                      }}>
                        <span>{c.veterinario}</span>
                        <span>{c.servicio}</span>
                        {c.peso_al_consulta && <span>{c.peso_al_consulta} kg</span>}
                        {c.temperatura_c && <span>{c.temperatura_c}°C</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--esp-2)', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-medio)',
                      color: ec.color, background: ec.bg,
                      borderRadius: 'var(--radio-full)', padding: '3px 10px',
                    }}>
                      {ec.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--fuente-mono)',
                      fontSize: 'var(--texto-xs)', color: 'var(--ink-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {new Date(c.fecha_hora).toLocaleTimeString('es-ES', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de detalle */}
        {seleccionada && (
          <div style={{
            background: 'var(--superficie-base)',
            border: '1px solid var(--borde-sutil)',
            borderRadius: 'var(--radio-xl)',
            padding: 'var(--esp-5)',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 0,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 'var(--esp-4)',
            }}>
              <h3 style={{
                fontFamily: 'var(--fuente-display)',
                fontSize: 'var(--texto-lg)', fontWeight: 600,
                color: 'var(--ink-primario)',
              }}>
                Ficha clínica
              </h3>
              <button
                onClick={() => setSeleccionada(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-terciario)', fontSize: 18 }}
              >×</button>
            </div>

            {[
              { label: 'Paciente', valor: `${seleccionada.paciente} (${seleccionada.especie})` },
              { label: 'Dueño', valor: seleccionada.dueño },
              { label: 'Veterinario', valor: seleccionada.veterinario },
              { label: 'Motivo', valor: seleccionada.motivo_consulta },
              { label: 'Diagnóstico', valor: seleccionada.diagnostico || '—' },
              { label: 'Peso', valor: seleccionada.peso_al_consulta ? `${seleccionada.peso_al_consulta} kg` : '—' },
              { label: 'Temperatura', valor: seleccionada.temperatura_c ? `${seleccionada.temperatura_c}°C` : '—' },
            ].map(({ label, valor }) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', gap: 2,
                marginBottom: 'var(--esp-3)',
              }}>
                <span style={{
                  fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-semibold)',
                  color: 'var(--ink-terciario)',
                  letterSpacing: 'var(--tracking-muy-amplio)', textTransform: 'uppercase',
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)' }}>
                  {valor}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
