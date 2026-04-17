import { useState, useEffect } from 'react';

interface ClienteCat { id: number; nombre: string; apellido: string; telefono: string | null; }
interface ServicioCat { id: number; nombre: string; precio: number; }
interface ProductoCat { id: number; nombre: string; precio: number; stock_actual: number; unidad_medida: string; }

interface LineItem {
  key: string;
  tipo: 'servicio' | 'producto';
  ref_id: string;
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
  descuento: string;
}

export interface NuevaFacturaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: () => void;
}

const CLIENTES_FB: ClienteCat[] = [
  { id: 1, nombre: 'Carlos', apellido: 'Martínez', telefono: '+54 9 11 1234-5678' },
  { id: 2, nombre: 'Ana',    apellido: 'Rodríguez', telefono: null },
];
const SERVICIOS_FB: ServicioCat[] = [
  { id: 1, nombre: 'Consulta general',    precio: 85.00 },
  { id: 2, nombre: 'Vacunación',          precio: 45.00 },
  { id: 3, nombre: 'Cirugía menor',       precio: 320.00 },
  { id: 4, nombre: 'Baño y peluquería',   precio: 60.00 },
  { id: 5, nombre: 'Radiografía',         precio: 110.00 },
];
const PRODUCTOS_FB: ProductoCat[] = [
  { id: 1, nombre: 'Ivermectina 1%',    precio: 12.50, stock_actual: 20, unidad_medida: 'ml' },
  { id: 2, nombre: 'Amoxicilina 250mg', precio: 8.00,  stock_actual: 15, unidad_medida: 'caja' },
  { id: 3, nombre: 'Alimento Premium',  precio: 35.00, stock_actual: 10, unidad_medida: 'kg' },
];

const inputBase: React.CSSProperties = {
  padding: 'var(--esp-2) var(--esp-3)',
  border: '1px solid var(--borde-control)',
  borderRadius: 'var(--radio-md)',
  background: 'var(--superficie-base)',
  fontSize: 'var(--texto-sm)',
  color: 'var(--ink-primario)',
  fontFamily: 'var(--fuente-ui)',
  outline: 'none',
  boxSizing: 'border-box' as const,
  width: '100%',
};

const labelTxt: React.CSSProperties = {
  fontSize: 'var(--texto-xs)', fontWeight: 600,
  color: 'var(--ink-secundario)', margin: '0 0 4px',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 'var(--texto-xs)', fontWeight: 700, color: 'var(--ink-muted)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    margin: 'var(--esp-5) 0 var(--esp-3)',
    paddingBottom: 'var(--esp-2)', borderBottom: '1px solid var(--borde-sutil)',
  }}>{children}</p>
);

let itemCounter = 0;
const newKey = () => `item-${++itemCounter}`;

const emptyItem = (): LineItem => ({
  key: newKey(), tipo: 'servicio', ref_id: '', descripcion: '',
  cantidad: '1', precio_unitario: '', descuento: '0',
});

const itemSubtotal = (it: LineItem) => {
  const q = parseFloat(it.cantidad) || 0;
  const p = parseFloat(it.precio_unitario) || 0;
  const d = parseFloat(it.descuento) || 0;
  return Math.max(0, q * p - d);
};

export default function NuevaFacturaModal({ abierto, onCerrar, onCreada }: NuevaFacturaModalProps) {
  const [clientes,  setClientes]  = useState<ClienteCat[]>(CLIENTES_FB);
  const [servicios, setServicios] = useState<ServicioCat[]>(SERVICIOS_FB);
  const [productos, setProductos] = useState<ProductoCat[]>(PRODUCTOS_FB);
  const [cargando,  setCargando]  = useState(false);

  const [clienteId,  setClienteId]  = useState('');
  const [notas,      setNotas]      = useState('');
  const [descuento,  setDescuento]  = useState('0');
  const [impuesto,   setImpuesto]   = useState('0');
  const [items,      setItems]      = useState<LineItem[]>([emptyItem()]);

  const [errores,    setErrores]    = useState<Record<string, string>>({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [enviando,   setEnviando]   = useState(false);
  const [exito,      setExito]      = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setClienteId(''); setNotas(''); setDescuento('0'); setImpuesto('0');
    setItems([emptyItem()]); setErrores({}); setErrorGlobal(''); setExito(false);
    setCargando(true);
    const token = localStorage.getItem('token');
    const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.allSettled([
      fetch('/api/catalogos/clientes',  { headers: h }),
      fetch('/api/catalogos/servicios', { headers: h }),
      fetch('/api/catalogos/productos', { headers: h }),
    ]).then(async ([rC, rS, rP]) => {
      if (rC.status === 'fulfilled' && rC.value.ok) setClientes(await rC.value.json());
      if (rS.status === 'fulfilled' && rS.value.ok) setServicios(await rS.value.json());
      if (rP.status === 'fulfilled' && rP.value.ok) setProductos(await rP.value.json());
    }).finally(() => setCargando(false));
  }, [abierto]);

  if (!abierto) return null;

  /* ── helpers ── */
  const subtotalItems = items.reduce((s, it) => s + itemSubtotal(it), 0);
  const descGlobal    = parseFloat(descuento) || 0;
  const impGlobal     = parseFloat(impuesto)  || 0;
  const totalFinal    = Math.max(0, subtotalItems - descGlobal + impGlobal);

  const fmt = (n: number) => n.toFixed(2);

  const setItem = (key: string, patch: Partial<LineItem>) =>
    setItems(prev => prev.map(it => it.key === key ? { ...it, ...patch } : it));

  const seleccionarRef = (key: string, ref_id: string, tipo: 'servicio' | 'producto') => {
    const cat = tipo === 'servicio'
      ? servicios.find(s => String(s.id) === ref_id)
      : productos.find(p => String(p.id) === ref_id);
    setItem(key, {
      ref_id,
      descripcion:     cat ? cat.nombre : '',
      precio_unitario: cat ? String(cat.precio) : '',
    });
    setErrores(e => ({ ...e, [`${key}_ref`]: '' }));
  };

  const cambiarTipo = (key: string, tipo: 'servicio' | 'producto') =>
    setItem(key, { tipo, ref_id: '', descripcion: '', precio_unitario: '' });

  const agregarItem = () => setItems(prev => [...prev, emptyItem()]);
  const quitarItem  = (key: string) => setItems(prev => prev.filter(it => it.key !== key));

  /* ── validación ── */
  const validar = () => {
    const e: Record<string, string> = {};
    if (!clienteId) e.cliente = 'Selecciona un cliente';
    items.forEach(it => {
      if (!it.ref_id) e[`${it.key}_ref`] = 'Selecciona un ítem';
      if (!it.cantidad || parseFloat(it.cantidad) <= 0) e[`${it.key}_cant`] = 'Cantidad inválida';
      if (it.precio_unitario === '' || parseFloat(it.precio_unitario) < 0) e[`${it.key}_precio`] = 'Precio requerido';
    });
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  /* ── enviar ── */
  const enviar = async () => {
    if (!validar()) return;
    setEnviando(true); setErrorGlobal('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          descuento:  parseFloat(descuento) || 0,
          impuesto:   parseFloat(impuesto)  || 0,
          notas:      notas.trim() || null,
          items: items.map(it => ({
            servicio_id:     it.tipo === 'servicio' ? Number(it.ref_id) : null,
            producto_id:     it.tipo === 'producto' ? Number(it.ref_id) : null,
            consulta_id:     null,
            descripcion:     it.descripcion.trim(),
            cantidad:        parseFloat(it.cantidad),
            precio_unitario: parseFloat(it.precio_unitario),
            descuento:       parseFloat(it.descuento) || 0,
          })),
        }),
      });
      if (res.status === 401) { setErrorGlobal('No autenticado.'); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setErrorGlobal(err.error || 'Error al crear la factura.');
        return;
      }
      setExito(true);
      setTimeout(() => { onCreada(); onCerrar(); }, 1400);
    } catch {
      setErrorGlobal('No se pudo conectar al servidor.');
    } finally {
      setEnviando(false);
    }
  };

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes fadeOverlay { from { opacity:0 } to { opacity:1 } }
        @keyframes slidePanel  { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes spin        { to   { transform:rotate(360deg) } }
      `}</style>

      <div onClick={enviando ? undefined : onCerrar} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,23,42,0.45)', animation: 'fadeOverlay 0.15s ease',
      }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 620, maxWidth: '100vw',
        background: 'var(--superficie-base)', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        animation: 'slidePanel 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: 'var(--esp-5) var(--esp-6)', borderBottom: '1px solid var(--borde-sutil)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-xl)', fontWeight: 400, color: 'var(--ink-primario)', margin: 0 }}>
              Nueva factura
            </h2>
            <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', marginTop: 4 }}>
              El número se genera automáticamente
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

          {exito && (
            <div style={{ marginTop: 'var(--esp-4)', background: 'var(--verde-50,#F0FDF4)', border: '1px solid #86EFAC', borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)', display: 'flex', alignItems: 'center', gap: 'var(--esp-2)', color: 'var(--verde-700,#15803D)', fontSize: 'var(--texto-sm)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Factura creada exitosamente.
            </div>
          )}

          {errorGlobal && (
            <div style={{ marginTop: 'var(--esp-4)', background: 'var(--rojo-50,#FEF2F2)', border: '1px solid #FECACA', borderRadius: 'var(--radio-md)', padding: 'var(--esp-3) var(--esp-4)', color: 'var(--rojo-700,#B91C1C)', fontSize: 'var(--texto-sm)' }}>
              {errorGlobal}
            </div>
          )}

          {/* ── CABECERA ── */}
          <SectionTitle>Cabecera</SectionTitle>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Cliente *</p>
            {cargando ? (
              <div style={{ height: 38, borderRadius: 'var(--radio-md)', background: 'var(--neutro-200)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : (
              <select
                value={clienteId}
                onChange={e => { setClienteId(e.target.value); setErrores(er => ({ ...er, cliente: '' })); }}
                style={{ ...inputBase, borderColor: errores.cliente ? 'var(--rojo-500)' : 'var(--borde-control)' }}
              >
                <option value="">— Seleccionar cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.apellido}, {c.nombre}{c.telefono ? `  ·  ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            )}
            {errores.cliente && <p style={{ fontSize: 'var(--texto-xs)', color: 'var(--rojo-500,#EF4444)', margin: '3px 0 0' }}>{errores.cliente}</p>}
          </div>

          <div style={{ marginBottom: 'var(--esp-4)' }}>
            <p style={labelTxt}>Notas</p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones para la factura..."
              rows={2}
              style={{ ...inputBase, resize: 'vertical', minHeight: 60 }}
            />
          </div>

          {/* ── ÍTEMS ── */}
          <SectionTitle>Ítems</SectionTitle>

          {/* Cabecera de la tabla de ítems */}
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr 60px 90px 70px 70px 28px',
            gap: 'var(--esp-2)', marginBottom: 'var(--esp-2)',
          }}>
            {['Tipo', 'Servicio / Producto', 'Cant.', 'P. Unit.', 'Desc.', 'Subtotal', ''].map(h => (
              <span key={h} style={{ fontSize: 'var(--texto-xs)', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {items.map(it => {
            const catalog = it.tipo === 'servicio' ? servicios : productos;
            const sub = itemSubtotal(it);
            return (
              <div key={it.key} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 60px 90px 70px 70px 28px',
                gap: 'var(--esp-2)', marginBottom: 'var(--esp-2)', alignItems: 'start',
              }}>
                {/* Tipo */}
                <select
                  value={it.tipo}
                  onChange={e => cambiarTipo(it.key, e.target.value as 'servicio' | 'producto')}
                  style={{ ...inputBase, padding: 'var(--esp-2)' }}
                >
                  <option value="servicio">Servicio</option>
                  <option value="producto">Producto</option>
                </select>

                {/* Ref */}
                <div>
                  <select
                    value={it.ref_id}
                    onChange={e => seleccionarRef(it.key, e.target.value, it.tipo)}
                    style={{ ...inputBase, padding: 'var(--esp-2)', borderColor: errores[`${it.key}_ref`] ? 'var(--rojo-500)' : 'var(--borde-control)' }}
                  >
                    <option value="">— Seleccionar —</option>
                    {catalog.map((c: ServicioCat | ProductoCat) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}{'stock_actual' in c ? ` (Stock: ${c.stock_actual})` : ''}
                      </option>
                    ))}
                  </select>
                  {errores[`${it.key}_ref`] && <p style={{ fontSize: 11, color: 'var(--rojo-500,#EF4444)', margin: '2px 0 0' }}>{errores[`${it.key}_ref`]}</p>}
                </div>

                {/* Cantidad */}
                <div>
                  <input
                    type="number" min="0.001" step="any"
                    value={it.cantidad}
                    onChange={e => { setItem(it.key, { cantidad: e.target.value }); setErrores(er => ({ ...er, [`${it.key}_cant`]: '' })); }}
                    style={{ ...inputBase, padding: 'var(--esp-2)', fontFamily: 'var(--fuente-mono)', borderColor: errores[`${it.key}_cant`] ? 'var(--rojo-500)' : 'var(--borde-control)', textAlign: 'right' }}
                  />
                </div>

                {/* Precio unitario */}
                <div>
                  <input
                    type="number" min="0" step="0.01"
                    value={it.precio_unitario}
                    onChange={e => { setItem(it.key, { precio_unitario: e.target.value }); setErrores(er => ({ ...er, [`${it.key}_precio`]: '' })); }}
                    style={{ ...inputBase, padding: 'var(--esp-2)', fontFamily: 'var(--fuente-mono)', borderColor: errores[`${it.key}_precio`] ? 'var(--rojo-500)' : 'var(--borde-control)', textAlign: 'right' }}
                  />
                </div>

                {/* Descuento por ítem */}
                <input
                  type="number" min="0" step="0.01"
                  value={it.descuento}
                  onChange={e => setItem(it.key, { descuento: e.target.value })}
                  style={{ ...inputBase, padding: 'var(--esp-2)', fontFamily: 'var(--fuente-mono)', textAlign: 'right' }}
                />

                {/* Subtotal */}
                <div style={{
                  padding: 'var(--esp-2)', fontFamily: 'var(--fuente-mono)',
                  fontSize: 'var(--texto-sm)', fontWeight: 600, color: 'var(--ink-primario)',
                  textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                  borderRadius: 'var(--radio-md)', background: 'var(--superficie-canvas)',
                  border: '1px solid var(--borde-sutil)',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                }}>
                  {fmt(sub)}
                </div>

                {/* Quitar */}
                <button
                  onClick={() => items.length > 1 ? quitarItem(it.key) : undefined}
                  disabled={items.length === 1}
                  title="Quitar ítem"
                  style={{
                    width: 28, height: 34, border: '1px solid var(--borde-control)',
                    borderRadius: 'var(--radio-md)', background: 'transparent',
                    color: items.length === 1 ? 'var(--ink-muted)' : '#C53030',
                    cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: items.length === 1 ? 0.4 : 1,
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}

          <button
            onClick={agregarItem}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
              padding: 'var(--esp-2) var(--esp-3)',
              border: '1px dashed var(--borde-control)',
              borderRadius: 'var(--radio-md)',
              background: 'transparent', color: 'var(--ink-secundario)',
              fontSize: 'var(--texto-sm)', cursor: 'pointer', marginTop: 'var(--esp-2)',
              transition: 'color var(--transicion-rapida), border-color var(--transicion-rapida)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--verde-700)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--verde-400)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-secundario)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--borde-control)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar ítem
          </button>

          {/* ── TOTALES ── */}
          <SectionTitle>Totales</SectionTitle>

          <div style={{
            background: 'var(--superficie-canvas)', borderRadius: 'var(--radio-md)',
            border: '1px solid var(--borde-sutil)', padding: 'var(--esp-4)',
          }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--esp-3)' }}>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>Subtotal ítems</span>
              <span style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)', fontVariantNumeric: 'tabular-nums' }}>
                ${fmt(subtotalItems)}
              </span>
            </div>

            {/* Descuento global */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--esp-3)' }}>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>Descuento (−)</span>
              <input
                type="number" min="0" step="0.01"
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
                style={{
                  width: 100, padding: '4px 8px', border: '1px solid var(--borde-control)',
                  borderRadius: 'var(--radio-md)', background: 'var(--superficie-base)',
                  fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)',
                  color: 'var(--ink-primario)', textAlign: 'right', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Impuesto */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--esp-4)', paddingBottom: 'var(--esp-3)', borderBottom: '1px solid var(--borde-sutil)' }}>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-secundario)' }}>Impuesto (+)</span>
              <input
                type="number" min="0" step="0.01"
                value={impuesto}
                onChange={e => setImpuesto(e.target.value)}
                style={{
                  width: 100, padding: '4px 8px', border: '1px solid var(--borde-control)',
                  borderRadius: 'var(--radio-md)', background: 'var(--superficie-base)',
                  fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)',
                  color: 'var(--ink-primario)', textAlign: 'right', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--texto-md)', fontWeight: 700, color: 'var(--ink-primario)' }}>TOTAL</span>
              <span style={{
                fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-xl)',
                fontWeight: 700, color: 'var(--verde-700)', fontVariantNumeric: 'tabular-nums',
              }}>
                ${fmt(totalFinal)}
              </span>
            </div>
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
            opacity: enviando ? 0.7 : 1,
            transition: 'background 0.15s ease',
            display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
          }}>
            {enviando && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {enviando ? 'Creando...' : exito ? 'Creada ✓' : 'Crear factura'}
          </button>
        </div>
      </div>
    </>
  );
}
