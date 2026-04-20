import { useState, useEffect } from 'react';

interface Especie {
  id: number;
  nombre: string;
  icono?: string;
  color_acento?: string;
}

interface Raza {
  id: number;
  especie_id: number;
  nombre: string;
}

interface ClienteOpcion {
  id: number;
  nombre: string;
  apellido: string;
  telefono?: string;
}

export interface PacienteEditar {
  id: number;
  nombre: string;
  sexo: 'M' | 'H';
  especie_id: number;
  raza_id: number | null;
  cliente_id: number;
  dueño?: string;
  fecha_nacimiento: string | null;
  peso_kg: number | null;
  color_pelaje: string | null;
  microchip: string | null;
  foto_url: string | null;
  esterilizado: boolean;
  notas: string | null;
}

export interface NuevoPacienteModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
  pacienteEditar?: PacienteEditar | null;
  onGuardado?: () => void;
}

interface FormPaciente {
  nombre: string;
  sexo: '' | 'M' | 'H';
  especie_id: string;
  raza_id: string;
  cliente_id: string;
  fecha_nacimiento: string;
  peso_kg: string;
  color_pelaje: string;
  microchip: string;
  foto_url: string;
  esterilizado: boolean;
  notas: string;
}

const FORMA_VACIA: FormPaciente = {
  nombre: '', sexo: '', especie_id: '', raza_id: '', cliente_id: '',
  fecha_nacimiento: '', peso_kg: '', color_pelaje: '', microchip: '',
  foto_url: '', esterilizado: false, notas: '',
};

const ESPECIES_FALLBACK: Especie[] = [
  { id: 1, nombre: 'Perro',   icono: '🐕', color_acento: '#D4850A' },
  { id: 2, nombre: 'Gato',    icono: '🐈', color_acento: '#6B48B8' },
  { id: 3, nombre: 'Ave',     icono: '🐦', color_acento: '#0891B2' },
  { id: 4, nombre: 'Conejo',  icono: '🐇', color_acento: '#059669' },
  { id: 5, nombre: 'Hámster', icono: '🐹', color_acento: '#D97706' },
  { id: 6, nombre: 'Reptil',  icono: '🦎', color_acento: '#16A34A' },
  { id: 7, nombre: 'Pez',     icono: '🐠', color_acento: '#0284C7' },
  { id: 8, nombre: 'Exótico', icono: '🦜', color_acento: '#9333EA' },
];

const RAZAS_FALLBACK: Raza[] = [
  { id: 1,  especie_id: 1, nombre: 'Labrador Retriever' },
  { id: 2,  especie_id: 1, nombre: 'Golden Retriever' },
  { id: 3,  especie_id: 1, nombre: 'Pastor Alemán' },
  { id: 4,  especie_id: 1, nombre: 'Bulldog Francés' },
  { id: 5,  especie_id: 1, nombre: 'Poodle' },
  { id: 6,  especie_id: 1, nombre: 'Beagle' },
  { id: 7,  especie_id: 1, nombre: 'Rottweiler' },
  { id: 8,  especie_id: 1, nombre: 'Chihuahua' },
  { id: 9,  especie_id: 1, nombre: 'Yorkshire Terrier' },
  { id: 10, especie_id: 1, nombre: 'Schnauzer' },
  { id: 11, especie_id: 2, nombre: 'Persa' },
  { id: 12, especie_id: 2, nombre: 'Siamés' },
  { id: 13, especie_id: 2, nombre: 'Maine Coon' },
  { id: 14, especie_id: 2, nombre: 'Bengalí' },
  { id: 15, especie_id: 2, nombre: 'Ragdoll' },
  { id: 16, especie_id: 2, nombre: 'Británico de Pelo Corto' },
  { id: 17, especie_id: 3, nombre: 'Canario' },
  { id: 18, especie_id: 3, nombre: 'Periquito' },
  { id: 19, especie_id: 3, nombre: 'Loro' },
  { id: 20, especie_id: 3, nombre: 'Agapornis' },
  { id: 21, especie_id: 4, nombre: 'Enano Holandés' },
  { id: 22, especie_id: 4, nombre: 'Rex' },
];

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: 'var(--esp-2) var(--esp-3)',
  border: '1px solid var(--borde-control)',
  borderRadius: 'var(--radio-md)',
  background: 'var(--superficie-base)',
  fontSize: 'var(--texto-sm)',
  color: 'var(--ink-primario)',
  fontFamily: 'var(--fuente-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)',
  fontWeight: 600,
  color: 'var(--ink-secundario)',
  margin: '0 0 4px',
};

const errorTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)',
  color: 'var(--rojo-500, #EF4444)',
  margin: '3px 0 0',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 'var(--texto-xs)', fontWeight: 700,
    color: 'var(--ink-muted)', letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 'var(--esp-5) 0 var(--esp-3)',
    paddingBottom: 'var(--esp-2)',
    borderBottom: '1px solid var(--borde-sutil)',
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

export default function NuevoPacienteModal({ abierto, onCerrar, onCreado, pacienteEditar, onGuardado }: NuevoPacienteModalProps) {
  const modoEdicion = !!pacienteEditar;
  const [form, setForm] = useState<FormPaciente>(FORMA_VACIA);
  const [errores, setErrores] = useState<Partial<Record<keyof FormPaciente, string>>>({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const [especies, setEspecies] = useState<Especie[]>(ESPECIES_FALLBACK);
  const [razas, setRazas] = useState<Raza[]>(RAZAS_FALLBACK);
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Cargar catálogos cuando el modal abre
  useEffect(() => {
    if (!abierto) return;
    if (pacienteEditar) {
      const fechaStr = pacienteEditar.fecha_nacimiento
        ? pacienteEditar.fecha_nacimiento.split('T')[0]
        : '';
      setForm({
        nombre:           pacienteEditar.nombre,
        sexo:             pacienteEditar.sexo,
        especie_id:       String(pacienteEditar.especie_id),
        raza_id:          pacienteEditar.raza_id != null ? String(pacienteEditar.raza_id) : '',
        cliente_id:       String(pacienteEditar.cliente_id),
        fecha_nacimiento: fechaStr,
        peso_kg:          pacienteEditar.peso_kg != null ? String(pacienteEditar.peso_kg) : '',
        color_pelaje:     pacienteEditar.color_pelaje ?? '',
        microchip:        pacienteEditar.microchip ?? '',
        foto_url:         pacienteEditar.foto_url ?? '',
        esterilizado:     pacienteEditar.esterilizado,
        notas:            pacienteEditar.notas ?? '',
      });
    } else {
      setForm(FORMA_VACIA);
    }
    setErrores({});
    setErrorGlobal('');
    setExito(false);
    setBusquedaCliente('');
    setCargandoCatalogos(true);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.allSettled([
      fetch('/api/catalogos/especies', { headers }),
      fetch('/api/catalogos/razas', { headers }),
      fetch('/api/clientes?limit=200', { headers }),
    ]).then(async ([resE, resR, resC]) => {
      if (resE.status === 'fulfilled' && resE.value.ok) setEspecies(await resE.value.json());
      if (resR.status === 'fulfilled' && resR.value.ok) setRazas(await resR.value.json());
      if (resC.status === 'fulfilled' && resC.value.ok) setClientes(await resC.value.json());
    }).catch(() => { /* mantener fallback */ }).finally(() => setCargandoCatalogos(false));
  }, [abierto]);

  if (!abierto) return null;

  const razasFiltradas = razas.filter(r => r.especie_id === Number(form.especie_id));
  const clientesFiltrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const set = (key: keyof FormPaciente, value: string | boolean) => {
    setForm(f => ({ ...f, [key]: value } as FormPaciente));
    setErrores(e => ({ ...e, [key]: undefined }));
  };

  const cambiarEspecie = (value: string) => {
    setForm(f => ({ ...f, especie_id: value, raza_id: '' }));
    setErrores(e => ({ ...e, especie_id: undefined }));
  };

  const validar = (): boolean => {
    const e: Partial<Record<keyof FormPaciente, string>> = {};
    if (!form.nombre.trim())  e.nombre     = 'Requerido';
    if (!form.sexo)           e.sexo       = 'Requerido';
    if (!form.especie_id)     e.especie_id = 'Requerido';
    if (!form.cliente_id)     e.cliente_id = 'Requerido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (!validar()) return;
    setEnviando(true);
    setErrorGlobal('');
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const url    = modoEdicion ? `/api/pacientes/${pacienteEditar!.id}` : '/api/pacientes';
      const method = modoEdicion ? 'PUT' : 'POST';
      const body   = modoEdicion
        ? {
            especie_id:       Number(form.especie_id),
            raza_id:          form.raza_id ? Number(form.raza_id) : null,
            nombre:           form.nombre.trim(),
            sexo:             form.sexo,
            fecha_nacimiento: form.fecha_nacimiento || null,
            peso_kg:          form.peso_kg ? Number(form.peso_kg) : null,
            color_pelaje:     form.color_pelaje.trim() || null,
            microchip:        form.microchip.trim() || null,
            foto_url:         form.foto_url.trim() || null,
            esterilizado:     form.esterilizado,
            notas:            form.notas.trim() || null,
          }
        : {
            cliente_id:       Number(form.cliente_id),
            especie_id:       Number(form.especie_id),
            raza_id:          form.raza_id ? Number(form.raza_id) : null,
            nombre:           form.nombre.trim(),
            sexo:             form.sexo,
            fecha_nacimiento: form.fecha_nacimiento || null,
            peso_kg:          form.peso_kg ? Number(form.peso_kg) : null,
            color_pelaje:     form.color_pelaje.trim() || null,
            microchip:        form.microchip.trim() || null,
            foto_url:         form.foto_url.trim() || null,
            esterilizado:     form.esterilizado,
            notas:            form.notas.trim() || null,
          };

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });

      if (res.status === 401) {
        setErrorGlobal('No autenticado. Inicia sesión para continuar.');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorGlobal(err.error || (modoEdicion ? 'Error al guardar cambios.' : 'Error al registrar. Intenta nuevamente.'));
        return;
      }
      setExito(true);
      setTimeout(() => {
        if (modoEdicion) { (onGuardado ?? onCreado)(); }
        else { onCreado(); }
        onCerrar();
      }, 1400);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
    } finally {
      setEnviando(false);
    }
  };

  /* ── render ────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes fadeOverlay  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidePanel   { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes pulseGray    { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>

      {/* Overlay */}
      <div
        onClick={enviando ? undefined : onCerrar}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.45)',
          animation: 'fadeOverlay 0.15s ease',
        }}
      />

      {/* Panel lateral */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 500, maxWidth: '100vw',
        background: 'var(--superficie-base)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        animation: 'slidePanel 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* ── Encabezado ── */}
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
            }}>{modoEdicion ? `Editar paciente` : 'Registrar nuevo paciente'}</h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4 }}>
              {modoEdicion ? `Modificando datos de ${pacienteEditar!.nombre}` : 'Los campos marcados con * son obligatorios'}
            </p>
          </div>
          <button
            onClick={onCerrar}
            disabled={enviando}
            style={{
              width: 32, height: 32, flexShrink: 0,
              border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-md)',
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

        {/* ── Cuerpo scrollable ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--esp-2) var(--esp-6) var(--esp-6)' }}>

          {/* Banner de éxito */}
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
              {modoEdicion ? 'Cambios guardados exitosamente.' : 'Paciente registrado exitosamente.'}
            </div>
          )}

          {/* Banner de error global */}
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

          {/* ── PROPIETARIO ── */}
          <SectionTitle>{modoEdicion ? 'Propietario' : 'Propietario *'}</SectionTitle>

          {modoEdicion ? (
            <Campo label="Propietario del paciente">
              <input
                value={pacienteEditar!.dueño ?? `ID ${pacienteEditar!.cliente_id}`}
                readOnly
                style={{ ...inputBase, background: 'var(--neutro-100, #F1F5F1)', color: 'var(--ink-terciario)', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-muted)', margin: '3px 0 0' }}>
                El propietario no puede modificarse
              </p>
            </Campo>
          ) : cargandoCatalogos ? (
            <div style={{ height: 80, borderRadius: 'var(--radio-md)', background: 'var(--neutro-200, #E5EEE9)', animation: 'pulseGray 1.5s ease-in-out infinite' }} />
          ) : clientes.length > 0 ? (
            <Campo label="Propietario del paciente" error={errores.cliente_id}>
              <input
                placeholder="Filtrar por nombre..."
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                style={{ ...inputBase, marginBottom: 'var(--esp-2)' }}
              />
              <select
                value={form.cliente_id}
                onChange={e => set('cliente_id', e.target.value)}
                style={{ ...inputBase, borderColor: errores.cliente_id ? 'var(--rojo-500)' : 'var(--borde-control)' }}
                size={Math.min(clientesFiltrados.length + 1, 5)}
              >
                <option value="">— Seleccionar propietario —</option>
                {clientesFiltrados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido}{c.telefono ? `  ·  ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </Campo>
          ) : (
            <Campo label="ID del propietario *" error={errores.cliente_id}>
              <input
                placeholder="Ingresa el ID del cliente"
                value={form.cliente_id}
                onChange={e => set('cliente_id', e.target.value)}
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)', borderColor: errores.cliente_id ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
              <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-muted)', margin: '3px 0 0' }}>
                Backend no disponible — ingresa el ID del cliente manualmente
              </p>
            </Campo>
          )}

          {/* ── DATOS DEL PACIENTE ── */}
          <SectionTitle>Datos del paciente</SectionTitle>

          <Fila>
            <Campo label="Nombre *" error={errores.nombre}>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombre del animal"
                style={{ ...inputBase, borderColor: errores.nombre ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
            <Campo label="Sexo *" error={errores.sexo}>
              <select
                value={form.sexo}
                onChange={e => set('sexo', e.target.value)}
                style={{ ...inputBase, borderColor: errores.sexo ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              >
                <option value="">Seleccionar...</option>
                <option value="M">Macho</option>
                <option value="H">Hembra</option>
              </select>
            </Campo>
          </Fila>

          <Fila>
            <Campo label="Especie *" error={errores.especie_id}>
              <select
                value={form.especie_id}
                onChange={e => cambiarEspecie(e.target.value)}
                style={{ ...inputBase, borderColor: errores.especie_id ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              >
                <option value="">Seleccionar...</option>
                {especies.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.icono ? `${e.icono} ` : ''}{e.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Raza">
              <select
                value={form.raza_id}
                onChange={e => set('raza_id', e.target.value)}
                disabled={!form.especie_id}
                style={{ ...inputBase, opacity: !form.especie_id ? 0.45 : 1 }}
              >
                <option value="">
                  {form.especie_id
                    ? razasFiltradas.length > 0 ? 'Sin especificar' : 'Sin razas registradas'
                    : 'Selecciona especie primero'}
                </option>
                {razasFiltradas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </Campo>
          </Fila>

          <Campo label="Fecha de nacimiento">
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => set('fecha_nacimiento', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={inputBase}
            />
          </Campo>

          {/* ── DATOS CLÍNICOS ── */}
          <SectionTitle>Datos clínicos</SectionTitle>

          <Fila>
            <Campo label="Peso (kg)">
              <input
                type="number"
                value={form.peso_kg}
                onChange={e => set('peso_kg', e.target.value)}
                placeholder="Ej: 12.5"
                min="0" step="0.1"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
            <Campo label="Color de pelaje">
              <input
                value={form.color_pelaje}
                onChange={e => set('color_pelaje', e.target.value)}
                placeholder="Ej: Dorado, Tricolor"
                style={inputBase}
              />
            </Campo>
          </Fila>

          <Campo label="Número de microchip">
            <input
              value={form.microchip}
              onChange={e => set('microchip', e.target.value)}
              placeholder="Código único del microchip (opcional)"
              style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
            />
          </Campo>

          {/* Checkbox esterilizado */}
          <div
            onClick={() => set('esterilizado', !form.esterilizado)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--esp-3)',
              marginBottom: 'var(--esp-4)', cursor: 'pointer', userSelect: 'none',
            }}
          >
            <div style={{
              width: 18, height: 18, flexShrink: 0,
              border: `2px solid ${form.esterilizado ? 'var(--verde-600)' : 'var(--borde-control)'}`,
              borderRadius: 4,
              background: form.esterilizado ? 'var(--verde-600)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}>
              {form.esterilizado && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <polyline points="1.5,5.5 4.5,8.5 9.5,2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>
              Animal esterilizado/a
            </span>
          </div>

          {/* ── ADICIONAL ── */}
          <SectionTitle>Adicional</SectionTitle>

          <Campo label="URL de foto">
            <input
              type="url"
              value={form.foto_url}
              onChange={e => set('foto_url', e.target.value)}
              placeholder="https://..."
              style={inputBase}
            />
          </Campo>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Notas</p>
            <textarea
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones adicionales sobre el paciente..."
              rows={3}
              style={{ ...inputBase, resize: 'vertical', minHeight: 76 }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--esp-3)',
          padding: 'var(--esp-4) var(--esp-6)',
          borderTop: '1px solid var(--borde-sutil)',
          flexShrink: 0,
          background: 'var(--superficie-base)',
        }}>
          <button
            onClick={onCerrar}
            disabled={enviando}
            style={{
              padding: 'var(--esp-2) var(--esp-5)',
              border: '1px solid var(--borde-control)',
              borderRadius: 'var(--radio-md)',
              background: 'transparent',
              color: 'var(--ink-secundario)',
              fontSize: 'var(--texto-sm)',
              cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={enviando || exito}
            style={{
              padding: 'var(--esp-2) var(--esp-5)',
              border: 'none',
              borderRadius: 'var(--radio-md)',
              background: exito ? 'var(--verde-700, #15803D)' : 'var(--verde-600)',
              color: 'white',
              fontSize: 'var(--texto-sm)',
              fontWeight: 600,
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
            {enviando
              ? (modoEdicion ? 'Guardando...' : 'Registrando...')
              : exito
                ? (modoEdicion ? 'Guardado ✓' : 'Registrado ✓')
                : (modoEdicion ? 'Guardar cambios' : 'Registrar paciente')
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
