import { useState, useEffect } from 'react';

interface ClienteEditar {
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
}

export interface ClienteModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: () => void;
  clienteEditar?: ClienteEditar | null;
}

interface FormCliente {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  telefono_alternativo: string;
  direccion: string;
  ciudad: string;
  documento_identidad: string;
  notas: string;
}

const FORMA_VACIA: FormCliente = {
  nombre: '', apellido: '', email: '', telefono: '',
  telefono_alternativo: '', direccion: '', ciudad: '',
  documento_identidad: '', notas: '',
};

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

export default function ClienteModal({ abierto, onCerrar, onGuardado, clienteEditar }: ClienteModalProps) {
  const modoEdicion = !!clienteEditar;

  const [form, setForm] = useState<FormCliente>(FORMA_VACIA);
  const [errores, setErrores] = useState<Partial<Record<keyof FormCliente, string>>>({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setErrores({});
    setErrorGlobal('');
    setExito(false);
    if (clienteEditar) {
      setForm({
        nombre:               clienteEditar.nombre || '',
        apellido:             clienteEditar.apellido || '',
        email:                clienteEditar.email || '',
        telefono:             clienteEditar.telefono || '',
        telefono_alternativo: clienteEditar.telefono_alternativo || '',
        direccion:            clienteEditar.direccion || '',
        ciudad:               clienteEditar.ciudad || '',
        documento_identidad:  clienteEditar.documento_identidad || '',
        notas:                clienteEditar.notas || '',
      });
    } else {
      setForm(FORMA_VACIA);
    }
  }, [abierto, clienteEditar]);

  if (!abierto) return null;

  const set = (key: keyof FormCliente, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrores(e => ({ ...e, [key]: undefined }));
  };

  const validar = (): boolean => {
    const e: Partial<Record<keyof FormCliente, string>> = {};
    if (!form.nombre.trim())              e.nombre              = 'Requerido';
    if (!form.apellido.trim())            e.apellido            = 'Requerido';
    if (!form.email.trim())               e.email               = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.telefono.trim())            e.telefono            = 'Requerido';
    if (!form.documento_identidad.trim()) e.documento_identidad = 'Requerido';
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
      const url    = modoEdicion ? `/api/clientes/${clienteEditar!.id}` : '/api/clientes';
      const method = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          nombre:               form.nombre.trim(),
          apellido:             form.apellido.trim(),
          email:                form.email.trim(),
          telefono:             form.telefono.trim(),
          telefono_alternativo: form.telefono_alternativo.trim() || null,
          direccion:            form.direccion.trim() || null,
          ciudad:               form.ciudad.trim() || null,
          documento_identidad:  form.documento_identidad.trim(),
          notas:                form.notas.trim() || null,
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

  return (
    <>
      <style>{`
        @keyframes fadeOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slidePanel  { from { transform: translateX(100%) } to { transform: translateX(0) } }
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
        width: 500, maxWidth: '100vw',
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
              {modoEdicion ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4 }}>
              Los campos marcados con * son obligatorios
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
              Cliente {modoEdicion ? 'actualizado' : 'registrado'} exitosamente.
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

          <SectionTitle>Datos personales</SectionTitle>

          <Fila>
            <Campo label="Nombre *" error={errores.nombre}>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombre"
                style={{ ...inputBase, borderColor: errores.nombre ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
            <Campo label="Apellido *" error={errores.apellido}>
              <input
                value={form.apellido}
                onChange={e => set('apellido', e.target.value)}
                placeholder="Apellido"
                style={{ ...inputBase, borderColor: errores.apellido ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
          </Fila>

          <Fila>
            <Campo label="Email *" error={errores.email}>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="correo@ejemplo.com"
                style={{ ...inputBase, borderColor: errores.email ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
            <Campo label="Documento de identidad *" error={errores.documento_identidad}>
              <input
                value={form.documento_identidad}
                onChange={e => set('documento_identidad', e.target.value)}
                placeholder="DNI / Cédula"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)', borderColor: errores.documento_identidad ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
          </Fila>

          <Fila>
            <Campo label="Teléfono *" error={errores.telefono}>
              <input
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                placeholder="+54 9 11..."
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)', borderColor: errores.telefono ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              />
            </Campo>
            <Campo label="Teléfono alternativo">
              <input
                value={form.telefono_alternativo}
                onChange={e => set('telefono_alternativo', e.target.value)}
                placeholder="Opcional"
                style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
              />
            </Campo>
          </Fila>

          <SectionTitle>Dirección</SectionTitle>

          <Campo label="Dirección">
            <input
              value={form.direccion}
              onChange={e => set('direccion', e.target.value)}
              placeholder="Calle y número"
              style={inputBase}
            />
          </Campo>

          <Campo label="Ciudad">
            <input
              value={form.ciudad}
              onChange={e => set('ciudad', e.target.value)}
              placeholder="Ciudad"
              style={inputBase}
            />
          </Campo>

          <SectionTitle>Adicional</SectionTitle>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Notas</p>
            <textarea
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
              style={{ ...inputBase, resize: 'vertical', minHeight: 76 }}
            />
          </div>
        </div>

        {/* Footer */}
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
            {enviando ? 'Guardando...' : exito ? 'Guardado ✓' : modoEdicion ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  );
}
