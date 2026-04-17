import { useState, useEffect } from 'react';

interface PacienteCatalogo {
  id: number;
  nombre: string;
  especie: string;
  dueño: string;
  color_acento: string;
}

interface ServicioCatalogo {
  id: number;
  nombre: string;
  precio: number;
}

export interface ConsultaEditar {
  id: number;
  paciente_id: number;
  servicio_id: number | null;
  motivo_consulta: string;
  anamnesis: string | null;
  examen_fisico: string | null;
  diagnostico: string | null;
  diagnostico_cie: string | null;
  tratamiento: string | null;
  indicaciones: string | null;
  observaciones: string | null;
  estado: string;
  peso_al_consulta: number | null;
  temperatura_c: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
}

export interface ConsultaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  consultaEditar?: ConsultaEditar | null;
}

interface FormConsulta {
  paciente_id: string;
  servicio_id: string;
  motivo_consulta: string;
  estado: string;
  anamnesis: string;
  examen_fisico: string;
  diagnostico: string;
  diagnostico_cie: string;
  tratamiento: string;
  indicaciones: string;
  observaciones: string;
  peso_al_consulta: string;
  temperatura_c: string;
  frecuencia_cardiaca: string;
  frecuencia_respiratoria: string;
}

const FORMA_VACIA: FormConsulta = {
  paciente_id: '', servicio_id: '', motivo_consulta: '', estado: 'en_curso',
  anamnesis: '', examen_fisico: '', diagnostico: '', diagnostico_cie: '',
  tratamiento: '', indicaciones: '', observaciones: '',
  peso_al_consulta: '', temperatura_c: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '',
};

const inputBase: React.CSSProperties = {
  width: '100%', padding: 'var(--esp-2) var(--esp-3)',
  border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
  background: 'var(--superficie-base)', fontSize: 'var(--texto-sm)',
  color: 'var(--ink-primario)', fontFamily: 'var(--fuente-ui)', outline: 'none',
  boxSizing: 'border-box',
};

const labelTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)', fontWeight: 600, color: 'var(--ink-secundario)', margin: '0 0 4px',
};

const errorTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)', color: 'var(--rojo-500, #EF4444)', margin: '3px 0 0',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 'var(--texto-xs)', fontWeight: 700, color: 'var(--ink-muted)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    margin: 'var(--esp-5) 0 var(--esp-3)',
    paddingBottom: 'var(--esp-2)', borderBottom: '1px solid var(--borde-sutil)',
  }}>{children}</p>
);

const Campo = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 'var(--esp-4)' }}>
    <p style={labelTxt}>{label}</p>
    {children}
    {error && <p style={errorTxt}>{error}</p>}
  </div>
);

const Fila = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-3)' }}>{children}</div>
);

function token() { return localStorage.getItem('token') ?? ''; }
function authHeaders(): HeadersInit {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function ConsultaModal({ abierto, onCerrar, onGuardado, consultaEditar }: ConsultaModalProps) {
  const modoEdicion = !!consultaEditar;

  const [form, setForm] = useState<FormConsulta>(FORMA_VACIA);
  const [errores, setErrores] = useState<Partial<Record<keyof FormConsulta, string>>>({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteCatalogo[]>([]);
  const [servicios, setServicios] = useState<ServicioCatalogo[]>([]);

  useEffect(() => {
    if (!abierto) return;
    setErrores({});
    setErrorGlobal('');
    setExito(false);

    if (consultaEditar) {
      setForm({
        paciente_id:           String(consultaEditar.paciente_id),
        servicio_id:           consultaEditar.servicio_id ? String(consultaEditar.servicio_id) : '',
        motivo_consulta:       consultaEditar.motivo_consulta || '',
        estado:                consultaEditar.estado || 'en_curso',
        anamnesis:             consultaEditar.anamnesis || '',
        examen_fisico:         consultaEditar.examen_fisico || '',
        diagnostico:           consultaEditar.diagnostico || '',
        diagnostico_cie:       consultaEditar.diagnostico_cie || '',
        tratamiento:           consultaEditar.tratamiento || '',
        indicaciones:          consultaEditar.indicaciones || '',
        observaciones:         consultaEditar.observaciones || '',
        peso_al_consulta:      consultaEditar.peso_al_consulta != null ? String(consultaEditar.peso_al_consulta) : '',
        temperatura_c:         consultaEditar.temperatura_c != null ? String(consultaEditar.temperatura_c) : '',
        frecuencia_cardiaca:   consultaEditar.frecuencia_cardiaca != null ? String(consultaEditar.frecuencia_cardiaca) : '',
        frecuencia_respiratoria: consultaEditar.frecuencia_respiratoria != null ? String(consultaEditar.frecuencia_respiratoria) : '',
      });
    } else {
      setForm(FORMA_VACIA);
    }

    Promise.all([
      fetch('/api/catalogos/pacientes', { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      fetch('/api/catalogos/servicios',  { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
    ]).then(([p, s]) => {
      setPacientes(Array.isArray(p) ? p : []);
      setServicios(Array.isArray(s) ? s : []);
    }).catch(() => {});
  }, [abierto, consultaEditar]);

  if (!abierto) return null;

  const set = (key: keyof FormConsulta, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrores(e => ({ ...e, [key]: undefined }));
  };

  const validar = (): boolean => {
    const e: Partial<Record<keyof FormConsulta, string>> = {};
    if (!form.paciente_id)             e.paciente_id     = 'Requerido';
    if (!form.motivo_consulta.trim())  e.motivo_consulta = 'Requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorGlobal('');
    try {
      const url    = modoEdicion ? `/api/consultas/${consultaEditar!.id}` : '/api/consultas';
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          paciente_id:            Number(form.paciente_id),
          servicio_id:            form.servicio_id ? Number(form.servicio_id) : null,
          motivo_consulta:        form.motivo_consulta.trim(),
          estado:                 form.estado,
          anamnesis:              form.anamnesis.trim() || null,
          examen_fisico:          form.examen_fisico.trim() || null,
          diagnostico:            form.diagnostico.trim() || null,
          diagnostico_cie:        form.diagnostico_cie.trim() || null,
          tratamiento:            form.tratamiento.trim() || null,
          indicaciones:           form.indicaciones.trim() || null,
          observaciones:          form.observaciones.trim() || null,
          peso_al_consulta:       form.peso_al_consulta ? Number(form.peso_al_consulta) : null,
          temperatura_c:          form.temperatura_c ? Number(form.temperatura_c) : null,
          frecuencia_cardiaca:    form.frecuencia_cardiaca ? Number(form.frecuencia_cardiaca) : null,
          frecuencia_respiratoria: form.frecuencia_respiratoria ? Number(form.frecuencia_respiratoria) : null,
        }),
      });

      if (res.status === 401) { setErrorGlobal('No autenticado. Inicia sesión nuevamente.'); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorGlobal(err.error || 'Error al guardar. Intenta nuevamente.');
        return;
      }
      setExito(true);
      setTimeout(() => { onGuardado(); onCerrar(); }, 1400);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const selectStyle = (hasError?: boolean): React.CSSProperties => ({
    ...inputBase,
    borderColor: hasError ? 'var(--rojo-500, #EF4444)' : 'var(--borde-control)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    cursor: 'pointer',
  });

  return (
    <>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidePanel  { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin        { to { transform: rotate(360deg) } }
      `}</style>

      <div
        onClick={enviando ? undefined : onCerrar}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.45)',
          animation: 'fadeOverlay 0.15s ease',
        }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 520, maxWidth: '100vw',
        background: 'var(--superficie-base)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        animation: 'slidePanel 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: 'var(--esp-5) var(--esp-6)',
          borderBottom: '1px solid var(--borde-sutil)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-xl)',
              fontWeight: 400, color: 'var(--ink-primario)', margin: 0,
            }}>
              {modoEdicion ? 'Editar consulta' : 'Nueva consulta'}
            </h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4 }}>
              Los campos marcados con * son obligatorios
            </p>
          </div>
          <button
            onClick={onCerrar} disabled={enviando}
            style={{
              width: 32, height: 32, flexShrink: 0,
              border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
              background: 'transparent', cursor: enviando ? 'not-allowed' : 'pointer',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--esp-2) var(--esp-6) var(--esp-6)' }}>

          {exito && (
            <div style={{
              marginTop: 'var(--esp-4)',
              background: 'var(--verde-50, #F0FDF4)', border: '1px solid #86EFAC',
              borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)',
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
              color: 'var(--verde-700, #15803D)', fontSize: 'var(--texto-sm)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Consulta {modoEdicion ? 'actualizada' : 'registrada'} exitosamente.
            </div>
          )}

          {errorGlobal && (
            <div style={{
              marginTop: 'var(--esp-4)',
              background: 'var(--rojo-50, #FEF2F2)', border: '1px solid #FECACA',
              borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)',
              color: 'var(--rojo-700, #B91C1C)', fontSize: 'var(--texto-sm)',
            }}>
              {errorGlobal}
            </div>
          )}

          <SectionTitle>Paciente y servicio</SectionTitle>

          <Campo label="Paciente *" error={errores.paciente_id}>
            <select
              value={form.paciente_id}
              onChange={e => set('paciente_id', e.target.value)}
              disabled={modoEdicion}
              style={{ ...selectStyle(!!errores.paciente_id), opacity: modoEdicion ? 0.6 : 1 }}
            >
              <option value="">Seleccionar paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — {p.especie} ({p.dueño})</option>
              ))}
            </select>
          </Campo>

          <Fila>
            <Campo label="Servicio">
              <select value={form.servicio_id} onChange={e => set('servicio_id', e.target.value)} style={selectStyle()}>
                <option value="">Sin servicio</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Estado">
              <select value={form.estado} onChange={e => set('estado', e.target.value)} style={selectStyle()}>
                <option value="en_curso">En curso</option>
                <option value="completada">Completada</option>
                <option value="requiere_seguimiento">Requiere seguimiento</option>
              </select>
            </Campo>
          </Fila>

          <SectionTitle>Motivo de consulta</SectionTitle>

          <Campo label="Motivo *" error={errores.motivo_consulta}>
            <textarea
              value={form.motivo_consulta}
              onChange={e => set('motivo_consulta', e.target.value)}
              placeholder="Descripción del motivo de la consulta..."
              rows={2}
              style={{
                ...inputBase, resize: 'vertical', minHeight: 60,
                borderColor: errores.motivo_consulta ? 'var(--rojo-500, #EF4444)' : 'var(--borde-control)',
              }}
            />
          </Campo>

          <Campo label="Anamnesis">
            <textarea
              value={form.anamnesis}
              onChange={e => set('anamnesis', e.target.value)}
              placeholder="Historia clínica aportada por el propietario..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
            />
          </Campo>

          <SectionTitle>Signos vitales</SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-3)' }}>
            <Campo label="Peso (kg)">
              <input
                type="number" step="0.01" min="0"
                value={form.peso_al_consulta}
                onChange={e => set('peso_al_consulta', e.target.value)}
                placeholder="ej. 28.5"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
            <Campo label="Temperatura (°C)">
              <input
                type="number" step="0.1" min="35" max="43"
                value={form.temperatura_c}
                onChange={e => set('temperatura_c', e.target.value)}
                placeholder="ej. 38.5"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
            <Campo label="Frec. cardíaca (lpm)">
              <input
                type="number" min="0"
                value={form.frecuencia_cardiaca}
                onChange={e => set('frecuencia_cardiaca', e.target.value)}
                placeholder="ej. 80"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
            <Campo label="Frec. respiratoria (rpm)">
              <input
                type="number" min="0"
                value={form.frecuencia_respiratoria}
                onChange={e => set('frecuencia_respiratoria', e.target.value)}
                placeholder="ej. 20"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
          </div>

          <SectionTitle>Examen y diagnóstico</SectionTitle>

          <Campo label="Examen físico">
            <textarea
              value={form.examen_fisico}
              onChange={e => set('examen_fisico', e.target.value)}
              placeholder="Hallazgos del examen físico..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
            />
          </Campo>

          <Fila>
            <Campo label="Diagnóstico">
              <textarea
                value={form.diagnostico}
                onChange={e => set('diagnostico', e.target.value)}
                placeholder="Diagnóstico..."
                rows={2}
                style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
              />
            </Campo>
            <Campo label="Código CIE">
              <input
                value={form.diagnostico_cie}
                onChange={e => set('diagnostico_cie', e.target.value)}
                placeholder="ej. J00"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
          </Fila>

          <SectionTitle>Tratamiento e indicaciones</SectionTitle>

          <Campo label="Tratamiento">
            <textarea
              value={form.tratamiento}
              onChange={e => set('tratamiento', e.target.value)}
              placeholder="Tratamiento indicado..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
            />
          </Campo>

          <Campo label="Indicaciones para el propietario">
            <textarea
              value={form.indicaciones}
              onChange={e => set('indicaciones', e.target.value)}
              placeholder="Instrucciones para el dueño..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
            />
          </Campo>

          <SectionTitle>Observaciones</SectionTitle>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Observaciones adicionales</p>
            <textarea
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              placeholder="Otras observaciones relevantes..."
              rows={3}
              style={{ ...inputBase, resize: 'vertical', minHeight: 72 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--esp-3)',
          padding: 'var(--esp-4) var(--esp-6)',
          borderTop: '1px solid var(--borde-sutil)', flexShrink: 0,
          background: 'var(--superficie-base)',
        }}>
          <button
            onClick={onCerrar} disabled={enviando}
            style={{
              padding: 'var(--esp-2) var(--esp-5)',
              border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
              background: 'transparent', color: 'var(--ink-secundario)',
              fontSize: 'var(--texto-sm)', cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={enviar} disabled={enviando || exito}
            style={{
              padding: 'var(--esp-2) var(--esp-5)', border: 'none',
              borderRadius: 'var(--radio-md)',
              background: exito ? 'var(--verde-700, #15803D)' : 'var(--verde-600)',
              color: 'white', fontSize: 'var(--texto-sm)', fontWeight: 600,
              cursor: enviando || exito ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.7 : 1,
              transition: 'background 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
            }}
          >
            {enviando && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {enviando ? 'Guardando...' : exito ? 'Guardado ✓' : modoEdicion ? 'Guardar cambios' : 'Registrar consulta'}
          </button>
        </div>
      </div>
    </>
  );
}
