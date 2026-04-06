import { useEffect, useState } from 'react';
import MetricaStrip from '../components/MetricaStrip';

interface KPIs {
  citas_hoy: number;
  consultas_hoy: number;
  ingresos_hoy: number;
  total_pacientes_activos: number;
  alertas_stock: number;
  facturas_pendientes: number;
}

interface CitaHoy {
  fecha_hora_inicio: string;
  paciente: string;
  especie: string;
  color_especie: string;
  servicio: string;
  veterinario: string;
  dueño: string;
  telefono: string;
  estado: string;
}

interface AlertaStock {
  producto: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  nivel_alerta: string;
}

interface ServicioRanking {
  nombre: string;
  categoria: string;
  total_consultas: number;
}

// Datos de ejemplo para preview sin backend
const KPI_EJEMPLO: KPIs = {
  citas_hoy: 8,
  consultas_hoy: 5,
  ingresos_hoy: 320,
  total_pacientes_activos: 247,
  alertas_stock: 3,
  facturas_pendientes: 4,
};

const CITAS_EJEMPLO: CitaHoy[] = [
  { fecha_hora_inicio: new Date().toISOString(), paciente: 'Firulais', especie: 'Perro', color_especie: '#D4850A', servicio: 'Vacunación', veterinario: 'Dra. García', dueño: 'Carlos M.', telefono: '555-1234', estado: 'confirmada' },
  { fecha_hora_inicio: new Date(Date.now() + 3600000).toISOString(), paciente: 'Mishi', especie: 'Gato', color_especie: '#6B48B8', servicio: 'Consulta General', veterinario: 'Dr. López', dueño: 'Ana R.', telefono: '555-5678', estado: 'programada' },
  { fecha_hora_inicio: new Date(Date.now() + 7200000).toISOString(), paciente: 'Rocky', especie: 'Perro', color_especie: '#D4850A', servicio: 'Desparasitación', veterinario: 'Dra. García', dueño: 'Luis P.', telefono: '555-9012', estado: 'programada' },
];

const ALERTAS_EJEMPLO: AlertaStock[] = [
  { producto: 'Vacuna Antirrábica Nobivac', categoria: 'Vacunas', stock_actual: 2, stock_minimo: 10, nivel_alerta: 'critico' },
  { producto: 'Suero Fisiológico 500ml', categoria: 'Medicamentos', stock_actual: 1, stock_minimo: 8, nivel_alerta: 'critico' },
  { producto: 'Guantes de nitrilo M (x100)', categoria: 'Insumos', stock_actual: 3, stock_minimo: 5, nivel_alerta: 'bajo' },
];

const SERVICIOS_EJEMPLO: ServicioRanking[] = [
  { nombre: 'Consulta General', categoria: 'Consulta', total_consultas: 48 },
  { nombre: 'Vacunación Antirrábica', categoria: 'Vacunación', total_consultas: 32 },
  { nombre: 'Desparasitación Interna', categoria: 'Preventivo', total_consultas: 27 },
  { nombre: 'Baño y Secado', categoria: 'Estética', total_consultas: 21 },
  { nombre: 'Hemograma Completo', categoria: 'Laboratorio', total_consultas: 15 },
];

// Datos sparkline simulados (30 días)
const INGRESOS_SPARKLINE = Array.from({ length: 14 }, (_, i) => ({
  valor: 200 + Math.sin(i * 0.7) * 80 + Math.random() * 60,
}));

const CONSULTAS_SPARKLINE = Array.from({ length: 14 }, (_, i) => ({
  valor: 3 + Math.floor(Math.sin(i) * 2 + Math.random() * 3),
}));

const ESTADO_COLORS: Record<string, string> = {
  confirmada:      '#2A7A52',
  programada:      '#2C5F8A',
  en_curso:        '#D4850A',
  completada:      '#6B48B8',
  cancelada:       '#C53030',
  no_se_presento:  '#A0B5A8',
};

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs>(KPI_EJEMPLO);
  const [citasHoy, setCitasHoy] = useState<CitaHoy[]>(CITAS_EJEMPLO);
  const [alertasStock, setAlertasStock] = useState<AlertaStock[]>(ALERTAS_EJEMPLO);
  const [serviciosRanking, setServiciosRanking] = useState<ServicioRanking[]>(SERVICIOS_EJEMPLO);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [kpisRes, citasRes, stockRes, serviciosRes] = await Promise.all([
          fetch('/api/dashboard/kpis'),
          fetch('/api/dashboard/kpis'),
          fetch('/api/dashboard/stock-bajo'),
          fetch('/api/dashboard/servicios-ranking'),
        ]);
        if (kpisRes.ok) setKpis(await kpisRes.json());
        if (citasRes.ok) setCitasHoy(await citasRes.json());
        if (stockRes.ok) setAlertasStock(await stockRes.json());
        if (serviciosRes.ok) setServiciosRanking(await serviciosRes.json());
      } catch {
        // Backend no disponible, usar datos de ejemplo
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const maxConsultas = Math.max(...serviciosRanking.map(s => s.total_consultas), 1);

  return (
    <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
      {/* Saludo */}
      <div style={{ marginBottom: 'var(--esp-6)' }}>
        <h2 style={{
          fontFamily: 'var(--fuente-display)',
          fontSize: 'var(--texto-2xl)',
          fontWeight: 400,
          color: 'var(--ink-primario)',
          letterSpacing: 'var(--tracking-apretado)',
        }}>
          Buenos días, clínica
        </h2>
        <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 'var(--esp-1)' }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {cargando && ' · Actualizando...'}
        </p>
      </div>

      {/* KPI strips — métricas del día */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--esp-3)',
        marginBottom: 'var(--esp-8)',
      }}>
        <MetricaStrip
          etiqueta="Ingresos hoy"
          valor={`$${kpis.ingresos_hoy.toLocaleString('es-ES')}`}
          variacion={12.4}
          datos={INGRESOS_SPARKLINE}
          estado="exito"
        />
        <MetricaStrip
          etiqueta="Citas hoy"
          valor={kpis.citas_hoy}
          subcampo={`${kpis.consultas_hoy} completadas`}
          datos={CONSULTAS_SPARKLINE}
          estado="normal"
        />
        <MetricaStrip
          etiqueta="Pacientes activos"
          valor={kpis.total_pacientes_activos}
          variacion={3.2}
          estado="normal"
        />
        {kpis.alertas_stock > 0 && (
          <MetricaStrip
            etiqueta="Alertas stock"
            valor={kpis.alertas_stock}
            subcampo="productos bajo mínimo"
            estado="alerta"
            color="var(--ambar-500)"
          />
        )}
        {kpis.facturas_pendientes > 0 && (
          <MetricaStrip
            etiqueta="Facturas pendientes"
            valor={kpis.facturas_pendientes}
            estado="normal"
          />
        )}
      </section>

      {/* Fila principal: Agenda + Ranking */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 'var(--esp-6)',
        marginBottom: 'var(--esp-6)',
      }}>
        {/* Agenda del día */}
        <section>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--esp-4)',
          }}>
            <h3 style={{
              fontFamily: 'var(--fuente-display)',
              fontSize: 'var(--texto-lg)',
              fontWeight: 600,
              color: 'var(--ink-primario)',
            }}>
              Agenda de hoy
            </h3>
            <span style={{
              fontSize: 'var(--texto-xs)',
              color: 'var(--verde-600)',
              fontWeight: 'var(--peso-semibold)',
              cursor: 'pointer',
            }}>
              Ver agenda completa →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-2)' }}>
            {citasHoy.length === 0 ? (
              <div style={{
                padding: 'var(--esp-8)',
                textAlign: 'center',
                color: 'var(--ink-terciario)',
                fontSize: 'var(--texto-sm)',
                background: 'var(--superficie-base)',
                borderRadius: 'var(--radio-lg)',
                border: '1px solid var(--borde-sutil)',
              }}>
                No hay citas programadas para hoy
              </div>
            ) : citasHoy.map((cita, i) => (
              <div key={i} style={{
                background: 'var(--superficie-base)',
                border: '1px solid var(--borde-sutil)',
                borderRadius: 'var(--radio-md)',
                padding: 'var(--esp-3) var(--esp-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--esp-4)',
              }}>
                {/* Hora */}
                <div style={{
                  fontFamily: 'var(--fuente-mono)',
                  fontSize: 'var(--texto-sm)',
                  fontWeight: 'var(--peso-semibold)',
                  color: 'var(--ink-primario)',
                  minWidth: 44,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>

                {/* Punto de color especie */}
                <div style={{
                  width: 8, height: 8,
                  borderRadius: 'var(--radio-full)',
                  background: cita.color_especie,
                  flexShrink: 0,
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--texto-sm)',
                    fontWeight: 'var(--peso-medio)',
                    color: 'var(--ink-primario)',
                  }}>
                    {cita.paciente}
                    <span style={{ fontWeight: 400, color: 'var(--ink-terciario)' }}>
                      {' '}— {cita.servicio}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)' }}>
                    {cita.dueño} · {cita.veterinario}
                  </div>
                </div>

                {/* Estado */}
                <span style={{
                  fontSize: 'var(--texto-xs)',
                  fontWeight: 'var(--peso-medio)',
                  color: ESTADO_COLORS[cita.estado] ?? 'var(--ink-secundario)',
                  background: `${ESTADO_COLORS[cita.estado] ?? '#4A6058'}12`,
                  borderRadius: 'var(--radio-full)',
                  padding: '2px 8px',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                }}>
                  {cita.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel derecho: Ranking + Alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-6)' }}>
          {/* Ranking servicios */}
          <section>
            <h3 style={{
              fontFamily: 'var(--fuente-display)',
              fontSize: 'var(--texto-lg)',
              fontWeight: 600,
              color: 'var(--ink-primario)',
              marginBottom: 'var(--esp-4)',
            }}>
              Servicios top
            </h3>
            <div style={{
              background: 'var(--superficie-base)',
              border: '1px solid var(--borde-sutil)',
              borderRadius: 'var(--radio-lg)',
              overflow: 'hidden',
            }}>
              {serviciosRanking.slice(0, 5).map((s, i) => (
                <div key={i} style={{
                  padding: 'var(--esp-3) var(--esp-4)',
                  borderBottom: i < 4 ? '1px solid var(--borde-sutil)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--esp-1)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 'var(--texto-sm)',
                      color: 'var(--ink-primario)',
                      fontWeight: 'var(--peso-medio)',
                    }}>
                      {s.nombre}
                    </span>
                    <span style={{
                      fontFamily: 'var(--fuente-mono)',
                      fontSize: 'var(--texto-sm)',
                      fontWeight: 'var(--peso-semibold)',
                      color: 'var(--verde-600)',
                    }}>
                      {s.total_consultas}
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div style={{
                    height: 3,
                    background: 'var(--neutro-200)',
                    borderRadius: 'var(--radio-full)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(s.total_consultas / maxConsultas) * 100}%`,
                      background: 'var(--verde-500)',
                      borderRadius: 'var(--radio-full)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Alertas de stock */}
          {alertasStock.length > 0 && (
            <section>
              <h3 style={{
                fontFamily: 'var(--fuente-display)',
                fontSize: 'var(--texto-lg)',
                fontWeight: 600,
                color: 'var(--ink-primario)',
                marginBottom: 'var(--esp-4)',
              }}>
                Stock bajo
              </h3>
              <div style={{
                background: 'var(--ambar-100)',
                border: '1px solid rgba(212,133,10,0.25)',
                borderRadius: 'var(--radio-lg)',
                overflow: 'hidden',
              }}>
                {alertasStock.map((a, i) => (
                  <div key={i} style={{
                    padding: 'var(--esp-3) var(--esp-4)',
                    borderBottom: i < alertasStock.length - 1 ? '1px solid rgba(212,133,10,0.15)' : 'none',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--esp-2)',
                    }}>
                      <div>
                        <div style={{
                          fontSize: 'var(--texto-sm)',
                          fontWeight: 'var(--peso-medio)',
                          color: 'var(--ink-primario)',
                          marginBottom: 2,
                        }}>
                          {a.producto}
                        </div>
                        <div style={{
                          fontSize: 'var(--texto-xs)',
                          color: 'var(--ink-terciario)',
                        }}>
                          {a.categoria}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: 'var(--fuente-mono)',
                          fontSize: 'var(--texto-sm)',
                          fontWeight: 'var(--peso-bold)',
                          color: a.nivel_alerta === 'critico' ? 'var(--rojo-500, #C53030)' : 'var(--ambar-600)',
                        }}>
                          {a.stock_actual}/{a.stock_minimo}
                        </div>
                        <div style={{
                          fontSize: 'var(--texto-xs)',
                          color: 'var(--ambar-600)',
                          fontWeight: 'var(--peso-medio)',
                        }}>
                          {a.nivel_alerta === 'critico' ? '⚠ Crítico' : '↓ Bajo'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
