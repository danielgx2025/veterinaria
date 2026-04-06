import { useState, useEffect } from 'react';

interface Paciente { id: number; nombre: string; especie: string; color_acento: string; dueño: string; }
interface Veterinario { id: number; nombre_completo: string; rol: string; }
interface Servicio { id: number; nombre: string; precio: number; duracion_minutos: number; }

interface CitaEditar {
  id: number;
  paciente_id: number;
  veterinario_id: number;
  servicio_id: number | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  notas?: string;
}

interface NuevaCitaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardada: () => void;
  citaEditar?: CitaEditar | null;
}

const PACIENTES_FB: Paciente[] = [
  { id: 1, nombre: 'Firulais', especie: 'Perro', color_acento: '#D4850A', dueño: 'Carlos Martínez' },
  { id: 2, nombre: 'Mishi', especie: 'Gato', color_acento: '#6B48B8', dueño: 'Ana Rodríguez' },
  { id: 3, nombre: 'Rocky', especie: 'Perro', color_acento: '#D4850A', dueño: 'Luis Pérez' },
];
const VETS_FB: Veterinario[] = [
  { id: 1, nombre_completo: 'Dra. García', rol: 'veterinario' },
  { id: 2, nombre_completo: 'Dr. López', rol: 'veterinario' },
];
const SERVICIOS_FB: Servicio[] = [
  { id: 1, nombre: 'Consulta General', precio: 350, duracion_minutos: 30 },
  { id: 2, nombre: 'Vacunación', precio: 200, duracion_minutos: 15 },
  { id: 3, nombre: 'Desparasitación', precio: 150, duracion_minutos: 15 },
  { id: 4, nombre: 'Castración', precio: 1200, duracion_minutos: 90 },
];

const ESTADOS_EDICION = ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_se_presento'];

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sumarMinutos(iso: string, mins: number) {
  const d = new Date(new Date(iso).getTime() + mins * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NuevaCitaModal({ abierto, onCerrar, onGuardada, citaEditar }: NuevaCitaModalProps) {
  const modoEdicion = !!citaEditar;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [vets, setVets] = useState<Veterinario[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [buscaPaciente, setBuscaPaciente] = useState('');

  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const defaultInicio = `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours() + 1)}:00`;

  const [form, setForm] = useState({
    paciente_id: '',
    veterinario_id: '',
    servicio_id: '',
    fecha_hora_inicio: defaultInicio,
    fecha_hora_fin: sumarMinutos(defaultInicio, 30),
    estado: 'programada',
    notas: '',
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setError('');
    setExito(false);

    if (modoEdicion && citaEditar) {
      setForm({
        paciente_id: String(citaEditar.paciente_id),
        veterinario_id: String(citaEditar.veterinario_id),
        servicio_id: citaEditar.servicio_id ? String(citaEditar.servicio_id) : '',
        fecha_hora_inicio: toDatetimeLocal(citaEditar.fecha_hora_inicio),
        fecha_hora_fin: toDatetimeLocal(citaEditar.fecha_hora_fin),
        estado: citaEditar.estado,
        notas: citaEditar.notas ?? '',
      });
    } else {
      const now = new Date();
      const ini = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours() + 1)}:00`;
      setForm({
        paciente_id: '', veterinario_id: '', servicio_id: '',
        fecha_hora_inicio: ini, fecha_hora_fin: sumarMinutos(ini, 30),
        estado: 'programada', notas: '',
      });
    }
    setBuscaPaciente('');

    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/catalogos/pacientes', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/catalogos/veterinarios', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/catalogos/servicios', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([p, v, s]) => {
      setPacientes(p ?? PACIENTES_FB);
      setVets(v ?? VETS_FB);
      setServicios(s ?? SERVICIOS_FB);
    }).catch(() => {
      setPacientes(PACIENTES_FB);
      setVets(VETS_FB);
      setServicios(SERVICIOS_FB);
    });
  }, [abierto, modoEdicion]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const onServicioChange = (servicioId: string) => {
    set('servicio_id', servicioId);
    if (servicioId && form.fecha_hora_inicio) {
      const srv = servicios.find(s => String(s.id) === servicioId);
      if (srv) set('fecha_hora_fin', sumarMinutos(form.fecha_hora_inicio, srv.duracion_minutos));
    }
  };

  const onInicioChange = (val: string) => {
    set('fecha_hora_inicio', val);
    const srv = servicios.find(s => String(s.id) === form.servicio_id);
    const mins = srv ? srv.duracion_minutos : 30;
    if (val) set('fecha_hora_fin', sumarMinutos(val, mins));
  };

  const guardar = async () => {
    if (!form.paciente_id || !form.veterinario_id || !form.fecha_hora_inicio || !form.fecha_hora_fin) {
      setError('Completa los campos obligatorios: paciente, veterinario, inicio y fin.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body = {
        paciente_id: Number(form.paciente_id),
        veterinario_id: Number(form.veterinario_id),
        servicio_id: form.servicio_id ? Number(form.servicio_id) : null,
        fecha_hora_inicio: new Date(form.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(form.fecha_hora_fin).toISOString(),
        estado: form.estado,
        notas: form.notas || null,
      };
      const url = modoEdicion ? `/api/citas/${citaEditar!.id}` : '/api/citas';
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (res.status === 401) { setError('No autenticado. Inicia sesión.'); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Error al guardar.'); return; }
      setExito(true);
      setTimeout(() => { onGuardada(); onCerrar(); }, 1200);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    !buscaPaciente || p.nombre.toLowerCase().includes(buscaPaciente.toLowerCase()) ||
    p.dueño.toLowerCase().includes(buscaPaciente.toLowerCase())
  );

  if (!abierto) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: 'var(--esp-2) var(--esp-3)',
    border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
    background: 'var(--superficie-base)', color: 'var(--ink-primario)',
    fontSize: 'var(--texto-sm)', outline: 'none', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: 'var(--texto-xs)',
    color: 'var(--ink-terciario)', marginBottom: 'var(--esp-1)',
    fontWeight: 'var(--peso-medio)',
  };

  return (
    <>
      <style>{`
        @keyframes fadeOverlayCita { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidePanelCita { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spinCita { to { transform: rotate(360deg) } }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200,
          animation: 'fadeOverlayCita 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: 'var(--superficie-base)', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        animation: 'slidePanelCita 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--esp-5) var(--esp-6)',
          borderBottom: '1px solid var(--borde-sutil)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{
              fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-xl)',
              fontWeight: 400, color: 'var(--ink-primario)', margin: 0,
            }}>
              {modoEdicion ? 'Editar cita' : 'Nueva cita'}
            </h3>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {modoEdicion ? 'Modifica los datos de la cita' : 'Completa los campos para agendar'}
            </p>
          </div>
          <button
            onClick={onCerrar}
            style={{
              width: 32, height: 32, borderRadius: 'var(--radio-full)',
              border: '1px solid var(--borde-control)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-terciario)', fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--esp-5) var(--esp-6)' }}>

          {/* Paciente */}
          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <label style={label}>Paciente *</label>
            <input
              value={buscaPaciente}
              onChange={e => setBuscaPaciente(e.target.value)}
              placeholder="Buscar paciente..."
              style={{ ...inp, marginBottom: 'var(--esp-1)' }}
            />
            <select
              size={4}
              value={form.paciente_id}
              onChange={e => set('paciente_id', e.target.value)}
              style={{ ...inp, height: 'auto' }}
            >
              <option value="">-- seleccionar --</option>
              {pacientesFiltrados.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.especie}) · {p.dueño}
                </option>
              ))}
            </select>
          </div>

          {/* Veterinario */}
          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <label style={label}>Veterinario *</label>
            <select value={form.veterinario_id} onChange={e => set('veterinario_id', e.target.value)} style={inp}>
              <option value="">-- seleccionar --</option>
              {vets.map(v => (
                <option key={v.id} value={v.id}>{v.nombre_completo}</option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <label style={label}>Servicio</label>
            <select value={form.servicio_id} onChange={e => onServicioChange(e.target.value)} style={inp}>
              <option value="">-- sin especificar --</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre} ({s.duracion_minutos} min)</option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-3)', marginBottom: 'var(--esp-4)' }}>
            <div>
              <label style={label}>Inicio *</label>
              <input type="datetime-local" value={form.fecha_hora_inicio} onChange={e => onInicioChange(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={label}>Fin *</label>
              <input type="datetime-local" value={form.fecha_hora_fin} onChange={e => set('fecha_hora_fin', e.target.value)} style={inp} />
            </div>
          </div>

          {/* Estado (solo edición) */}
          {modoEdicion && (
            <div style={{ marginBottom: 'var(--esp-4)' }}>
              <label style={label}>Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inp}>
                {ESTADOS_EDICION.map(e => (
                  <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notas */}
          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <label style={label}>Notas</label>
            <textarea
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              rows={3}
              placeholder="Indicaciones, motivo de consulta..."
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--esp-3)', borderRadius: 'var(--radio-md)',
              background: '#FEE8E8', color: '#C53030',
              fontSize: 'var(--texto-sm)', marginBottom: 'var(--esp-3)',
            }}>
              {error}
            </div>
          )}

          {exito && (
            <div style={{
              padding: 'var(--esp-3)', borderRadius: 'var(--radio-md)',
              background: '#EBF5EE', color: '#2A7A52',
              fontSize: 'var(--texto-sm)', marginBottom: 'var(--esp-3)',
            }}>
              {modoEdicion ? 'Cita actualizada correctamente.' : 'Cita creada correctamente.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--esp-4) var(--esp-6)',
          borderTop: '1px solid var(--borde-sutil)',
          display: 'flex', gap: 'var(--esp-3)', justifyContent: 'flex-end',
        }}>
          <button onClick={onCerrar} style={{
            padding: 'var(--esp-2) var(--esp-4)',
            border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
            background: 'transparent', color: 'var(--ink-secundario)',
            fontSize: 'var(--texto-sm)', cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando || exito}
            style={{
              padding: 'var(--esp-2) var(--esp-5)',
              background: guardando || exito ? 'var(--verde-400)' : 'var(--verde-600)',
              color: 'white', border: 'none', borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
              cursor: guardando || exito ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
            }}
          >
            {guardando && (
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white', borderRadius: '50%',
                display: 'inline-block', animation: 'spinCita 0.6s linear infinite',
              }} />
            )}
            {modoEdicion ? 'Guardar cambios' : 'Crear cita'}
          </button>
        </div>
      </div>
    </>
  );
}
