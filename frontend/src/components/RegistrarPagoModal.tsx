import { useState, useEffect } from 'react';

interface MetodoPago { id: number; nombre: string; }

export interface RegistrarPagoModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onRegistrado: () => void;
  facturaId: number | null;
  numeroFactura: string;
  totalFactura: number;
  totalPagado: number;
}

const METODOS_FB: MetodoPago[] = [
  { id: 1, nombre: 'Efectivo' },
  { id: 2, nombre: 'Tarjeta Débito' },
  { id: 3, nombre: 'Tarjeta Crédito' },
  { id: 4, nombre: 'Transferencia' },
];

const inputBase: React.CSSProperties = {
  width: '100%', padding: 'var(--esp-2) var(--esp-3)',
  border: '1px solid var(--borde-control)', borderRadius: 'var(--radio-md)',
  background: 'var(--superficie-base)', fontSize: 'var(--texto-sm)',
  color: 'var(--ink-primario)', fontFamily: 'var(--fuente-ui)',
  outline: 'none', boxSizing: 'border-box' as const,
};

const labelTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)', fontWeight: 600,
  color: 'var(--ink-secundario)', margin: '0 0 4px',
};

const Campo = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 'var(--esp-4)' }}>
    <p style={labelTxt}>{label}</p>
    {children}
    {error && <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--rojo-500,#EF4444)', margin: '3px 0 0' }}>{error}</p>}
  </div>
);

export default function RegistrarPagoModal({
  abierto, onCerrar, onRegistrado, facturaId, numeroFactura, totalFactura, totalPagado,
}: RegistrarPagoModalProps) {
  const [metodos,      setMetodos]      = useState<MetodoPago[]>(METODOS_FB);
  const [metodoPagoId, setMetodoPagoId] = useState('');
  const [monto,        setMonto]        = useState('');
  const [referencia,   setReferencia]   = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [errores,      setErrores]      = useState<Record<string, string>>({});
  const [errorGlobal,  setErrorGlobal]  = useState('');
  const [enviando,     setEnviando]     = useState(false);
  const [exito,        setExito]        = useState(false);

  const saldo = Math.max(0, totalFactura - totalPagado);

  useEffect(() => {
    if (!abierto) return;
    setMetodoPagoId(''); setMonto(saldo > 0 ? String(saldo.toFixed(2)) : '');
    setReferencia(''); setObservaciones('');
    setErrores({}); setErrorGlobal(''); setExito(false);

    const token = localStorage.getItem('token');
    const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/catalogos/metodos_pago', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length) setMetodos(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto || !facturaId) return null;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!metodoPagoId)                          e.metodo = 'Selecciona un método';
    if (!monto || parseFloat(monto) <= 0)       e.monto  = 'Ingresa un monto válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (!validar()) return;
    setEnviando(true); setErrorGlobal('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/facturas/${facturaId}/pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          metodo_pago_id: Number(metodoPagoId),
          monto:          parseFloat(monto),
          referencia:     referencia.trim() || null,
          observaciones:  observaciones.trim() || null,
        }),
      });
      if (res.status === 401) { setErrorGlobal('No autenticado.'); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorGlobal(err.error || 'Error al registrar el pago.');
        return;
      }
      setExito(true);
      setTimeout(() => { onRegistrado(); onCerrar(); }, 1200);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeOverlay2 { from { opacity:0 } to { opacity:1 } }
        @keyframes slidePanel2  { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes spin2        { to   { transform:rotate(360deg) } }
      `}</style>

      <div onClick={enviando ? undefined : onCerrar} style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(15,23,42,0.50)', animation: 'fadeOverlay2 0.15s ease',
      }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: '100vw',
        background: 'var(--superficie-base)', zIndex: 301,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        animation: 'slidePanel2 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: 'var(--esp-5) var(--esp-6)', borderBottom: '1px solid var(--borde-sutil)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-xl)', fontWeight: 400, color: 'var(--ink-primario)', margin: 0 }}>
              Registrar pago
            </h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4, fontFamily: 'var(--fuente-mono)' }}>
              {numeroFactura}
            </p>
          </div>
          <button onClick={onCerrar} disabled={enviando} style={{
            width: 32, height: 32, border: '1px solid var(--borde-control)',
            borderRadius: 'var(--radio-md)', background: 'transparent',
            cursor: enviando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-secundario)', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--esp-2) var(--esp-6) var(--esp-6)' }}>

          {/* Resumen saldo */}
          <div style={{
            marginTop: 'var(--esp-4)', marginBottom: 'var(--esp-5)',
            background: 'var(--superficie-canvas)', borderRadius: 'var(--radio-md)',
            border: '1px solid var(--borde-sutil)', padding: 'var(--esp-4)',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--esp-3)',
          }}>
            {[
              { label: 'Total factura', valor: totalFactura, color: 'var(--ink-primario)' },
              { label: 'Ya pagado',     valor: totalPagado,  color: 'var(--verde-600)' },
              { label: 'Saldo',         valor: saldo,        color: saldo > 0 ? 'var(--ambar-500,#F59E0B)' : 'var(--verde-600)' },
            ].map(({ label, valor, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-lg)', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                  ${valor.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {exito && (
            <div style={{ marginBottom: 'var(--esp-4)', background: 'var(--verde-50,#F0FDF4)', border: '1px solid #86EFAC', borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)', display: 'flex', alignItems: 'center', gap: 'var(--esp-2)', color: 'var(--verde-700,#15803D)', fontSize: 'var(--texto-sm)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Pago registrado exitosamente.
            </div>
          )}

          {errorGlobal && (
            <div style={{ marginBottom: 'var(--esp-4)', background: 'var(--rojo-50,#FEF2F2)', border: '1px solid #FECACA', borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)', color: 'var(--rojo-700,#B91C1C)', fontSize: 'var(--texto-sm)' }}>
              {errorGlobal}
            </div>
          )}

          <Campo label="Método de pago *" error={errores.metodo}>
            <select
              value={metodoPagoId}
              onChange={e => { setMetodoPagoId(e.target.value); setErrores(er => ({ ...er, metodo: '' })); }}
              style={{ ...inputBase, borderColor: errores.metodo ? 'var(--rojo-500)' : 'var(--borde-control)' }}
            >
              <option value="">— Seleccionar —</option>
              {metodos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </Campo>

          <Campo label="Monto *" error={errores.monto}>
            <input
              type="number" min="0.01" step="0.01"
              value={monto}
              onChange={e => { setMonto(e.target.value); setErrores(er => ({ ...er, monto: '' })); }}
              style={{ ...inputBase, fontFamily: 'var(--fuente-mono)', borderColor: errores.monto ? 'var(--rojo-500)' : 'var(--borde-control)' }}
            />
          </Campo>

          <Campo label="Referencia / N° transacción">
            <input
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              placeholder="Opcional — voucher, transferencia, etc."
              style={{ ...inputBase, fontFamily: 'var(--fuente-mono)' }}
            />
          </Campo>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Observaciones</p>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 56 }}
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
          <button onClick={onCerrar} disabled={enviando} style={{
            padding: 'var(--esp-2) var(--esp-5)', border: '1px solid var(--borde-control)',
            borderRadius: 'var(--radio-md)', background: 'transparent',
            color: 'var(--ink-secundario)', fontSize: 'var(--texto-sm)',
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={enviar} disabled={enviando || exito} style={{
            padding: 'var(--esp-2) var(--esp-5)', border: 'none',
            borderRadius: 'var(--radio-md)',
            background: exito ? 'var(--verde-700,#15803D)' : 'var(--verde-600)',
            color: 'white', fontSize: 'var(--texto-sm)', fontWeight: 600,
            cursor: enviando || exito ? 'not-allowed' : 'pointer',
            opacity: enviando ? 0.7 : 1, transition: 'background 0.15s ease',
            display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
          }}>
            {enviando && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin2 0.7s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {enviando ? 'Registrando...' : exito ? 'Registrado ✓' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </>
  );
}
