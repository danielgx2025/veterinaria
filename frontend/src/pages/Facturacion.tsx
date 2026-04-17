import { useState, useEffect } from 'react';
import NuevaFacturaModal from '../components/NuevaFacturaModal';
import RegistrarPagoModal from '../components/RegistrarPagoModal';

interface Factura {
  id: number;
  numero_factura: string;
  cliente: string;
  fecha_emision: string;
  total: number;
  total_pagado: number;
  estado: 'borrador' | 'pendiente' | 'pagada' | 'parcial' | 'anulada' | 'vencida';
  emitida_por: string;
}

const FACTURAS_EJEMPLO: Factura[] = [
  { id: 1, numero_factura: 'FAC-2026-000001', cliente: 'Martínez, Carlos', fecha_emision: new Date().toISOString(), total: 85.00,  total_pagado: 85.00, estado: 'pagada',   emitida_por: 'Admin' },
  { id: 2, numero_factura: 'FAC-2026-000002', cliente: 'Rodríguez, Ana',   fecha_emision: new Date(Date.now() - 3600000).toISOString(), total: 120.00, total_pagado: 60.00, estado: 'parcial',  emitida_por: 'Admin' },
  { id: 3, numero_factura: 'FAC-2026-000003', cliente: 'Pérez, Luis',      fecha_emision: new Date(Date.now() - 86400000).toISOString(), total: 35.00, total_pagado: 0, estado: 'pendiente', emitida_por: 'Admin' },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  borrador:  { color: '#6E8C7A', bg: '#F2F7F4', label: 'Borrador' },
  pendiente: { color: '#2C5F8A', bg: '#E8F1F8', label: 'Pendiente' },
  pagada:    { color: '#2A7A52', bg: '#EBF5EE', label: 'Pagada' },
  parcial:   { color: '#D4850A', bg: '#FEF3E2', label: 'Parcial' },
  anulada:   { color: '#C53030', bg: '#FEE8E8', label: 'Anulada' },
  vencida:   { color: '#7C3AED', bg: '#F5F3FF', label: 'Vencida' },
};

export default function Facturacion() {
  const [facturas,     setFacturas]     = useState<Factura[]>(FACTURAS_EJEMPLO);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando,     setCargando]     = useState(false);
  const [reloadKey,    setReloadKey]    = useState(0);
  const [anulando,     setAnulando]     = useState<number | null>(null);

  const [modalNueva,   setModalNueva]   = useState(false);
  const [pagoTarget,   setPagoTarget]   = useState<Factura | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const token = localStorage.getItem('token');
        const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams({ limit: '100' });
        if (filtroEstado !== 'todos') params.set('estado', filtroEstado);
        const res = await fetch(`/api/facturas?${params}`, { headers: h });
        if (res.ok) {
          const datos = await res.json();
          setFacturas(Array.isArray(datos) ? datos : FACTURAS_EJEMPLO);
        }
      } catch {
        // usar datos de ejemplo
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [filtroEstado, reloadKey]);

  const anular = async (f: Factura) => {
    if (!confirm(`¿Anular la factura ${f.numero_factura}? Esta acción no se puede deshacer.`)) return;
    setAnulando(f.id);
    try {
      const token = localStorage.getItem('token');
      const h: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/facturas/${f.id}/anular`, { method: 'PATCH', headers: h });
      setReloadKey(k => k + 1);
    } catch { /* silencioso */ } finally {
      setAnulando(null);
    }
  };

  const facturasFiltradas = filtroEstado === 'todos'
    ? facturas
    : facturas.filter(f => f.estado === filtroEstado);

  const totalPendiente = facturas
    .filter(f => f.estado === 'pendiente' || f.estado === 'parcial')
    .reduce((sum, f) => sum + (f.total - f.total_pagado), 0);

  const totalCobradoHoy = facturas
    .filter(f => new Date(f.fecha_emision).toDateString() === new Date().toDateString())
    .reduce((sum, f) => sum + Number(f.total_pagado), 0);

  const fmt = (n: number) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2 });

  const puedeRegistrarPago = (f: Factura) => f.estado === 'pendiente' || f.estado === 'parcial' || f.estado === 'borrador';
  const puedeAnular        = (f: Factura) => f.estado !== 'anulada' && f.estado !== 'pagada';

  return (
    <>
      <NuevaFacturaModal
        abierto={modalNueva}
        onCerrar={() => setModalNueva(false)}
        onCreada={() => setReloadKey(k => k + 1)}
      />
      <RegistrarPagoModal
        abierto={!!pagoTarget}
        onCerrar={() => setPagoTarget(null)}
        onRegistrado={() => { setReloadKey(k => k + 1); }}
        facturaId={pagoTarget?.id ?? null}
        numeroFactura={pagoTarget?.numero_factura ?? ''}
        totalFactura={Number(pagoTarget?.total ?? 0)}
        totalPagado={Number(pagoTarget?.total_pagado ?? 0)}
      />

      <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>

        {/* Cabecera */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--esp-6)', flexWrap: 'wrap', gap: 'var(--esp-4)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'var(--fuente-display)', fontSize: 'var(--texto-2xl)', fontWeight: 400, color: 'var(--ink-primario)' }}>
              Facturación
            </h2>
            <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
              {facturas.length} factura{facturas.length !== 1 ? 's' : ''} · Saldo pendiente:{' '}
              <strong style={{ color: 'var(--ink-primario)', fontFamily: 'var(--fuente-mono)' }}>
                ${fmt(totalPendiente)}
              </strong>
            </p>
          </div>
          <button
            onClick={() => setModalNueva(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
              padding: 'var(--esp-2) var(--esp-4)',
              background: 'var(--verde-600)', color: 'white',
              border: 'none', borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
              cursor: 'pointer',
            }}
          >
            + Nueva factura
          </button>
        </div>

        {/* Métricas */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--esp-3)', marginBottom: 'var(--esp-6)',
        }}>
          {[
            { label: 'Cobrado hoy',    valor: `$${fmt(totalCobradoHoy)}`, color: 'var(--verde-600)' },
            { label: 'Por cobrar',     valor: `$${fmt(totalPendiente)}`,  color: 'var(--ambar-500,#F59E0B)' },
            { label: 'Total facturas', valor: facturas.length,             color: 'var(--azul-500,#3B82F6)' },
            { label: 'Pagadas',        valor: facturas.filter(f => f.estado === 'pagada').length, color: 'var(--verde-600)' },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{
              background: 'var(--superficie-base)', border: '1px solid var(--borde-sutil)',
              borderRadius: 'var(--radio-md)', padding: 'var(--esp-4)',
            }}>
              <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', letterSpacing: 'var(--tracking-muy-amplio)', textTransform: 'uppercase', marginBottom: 'var(--esp-1)' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-2xl)', fontWeight: 'var(--peso-bold)', color, fontVariantNumeric: 'tabular-nums' }}>
                {valor}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros de estado */}
        <div style={{ display: 'flex', gap: 'var(--esp-2)', marginBottom: 'var(--esp-4)', flexWrap: 'wrap' }}>
          {['todos', 'pendiente', 'parcial', 'pagada', 'borrador', 'anulada'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              style={{
                padding: 'var(--esp-1) var(--esp-3)',
                borderRadius: 'var(--radio-full)', border: '1px solid',
                borderColor:  filtroEstado === e ? 'var(--verde-600)' : 'var(--borde-control)',
                background:   filtroEstado === e ? 'var(--verde-100)' : 'var(--superficie-base)',
                color:        filtroEstado === e ? 'var(--verde-700)' : 'var(--ink-secundario)',
                fontSize: 'var(--texto-xs)',
                fontWeight: filtroEstado === e ? 'var(--peso-semibold)' : 'var(--peso-normal)',
                cursor: 'pointer', textTransform: 'capitalize',
                transition: 'all var(--transicion-rapida)',
              }}
            >
              {e === 'todos' ? 'Todas' : (ESTADO_CONFIG[e]?.label ?? e)}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{
          background: 'var(--superficie-base)', border: '1px solid var(--borde-sutil)',
          borderRadius: 'var(--radio-xl)', overflow: 'hidden',
        }}>
          {/* Header tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr 120px 100px 100px 110px 110px',
            padding: 'var(--esp-3) var(--esp-4)',
            borderBottom: '1px solid var(--borde-sutil)',
            background: 'var(--superficie-canvas)',
          }}>
            {['Número', 'Cliente', 'Fecha', 'Total', 'Pagado', 'Estado', ''].map(h => (
              <span key={h} style={{ fontSize: 'var(--texto-xs)', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: 'var(--tracking-muy-amplio)', textTransform: 'uppercase' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Filas */}
          {cargando ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '150px 1fr 120px 100px 100px 110px 110px',
                padding: 'var(--esp-3) var(--esp-4)',
                borderBottom: i < 4 ? '1px solid var(--borde-sutil)' : 'none',
                gap: 'var(--esp-3)',
              }}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} style={{
                    height: 14, borderRadius: 4,
                    background: 'var(--neutro-200)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    width: j === 6 ? '80%' : '60%',
                  }} />
                ))}
              </div>
            ))
          ) : facturasFiltradas.length === 0 ? (
            <div style={{ padding: 'var(--esp-16)', textAlign: 'center', color: 'var(--ink-terciario)', fontSize: 'var(--texto-sm)' }}>
              No hay facturas{filtroEstado !== 'todos' ? ` con estado "${ESTADO_CONFIG[filtroEstado]?.label ?? filtroEstado}"` : ''}
            </div>
          ) : (
            facturasFiltradas.map((f, i) => {
              const ec = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.pendiente;
              return (
                <div
                  key={f.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 120px 100px 100px 110px 110px',
                    padding: 'var(--esp-3) var(--esp-4)',
                    borderBottom: i < facturasFiltradas.length - 1 ? '1px solid var(--borde-sutil)' : 'none',
                    alignItems: 'center',
                    transition: 'background var(--transicion-rapida)',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--superficie-canvas)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <span style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-xs)', color: 'var(--verde-600)', fontVariantNumeric: 'tabular-nums' }}>
                    {f.numero_factura}
                  </span>
                  <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.cliente}
                  </span>
                  <span style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(f.fecha_emision).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)', fontWeight: 600, color: 'var(--ink-primario)', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmt(Number(f.total))}
                  </span>
                  <span style={{ fontFamily: 'var(--fuente-mono)', fontSize: 'var(--texto-sm)', color: 'var(--verde-600)', fontVariantNumeric: 'tabular-nums' }}>
                    ${fmt(Number(f.total_pagado))}
                  </span>
                  <span style={{ fontSize: 'var(--texto-xs)', fontWeight: 500, color: ec.color, background: ec.bg, borderRadius: 'var(--radio-full)', padding: '3px 10px', display: 'inline-block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {ec.label}
                  </span>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 'var(--esp-2)', justifyContent: 'flex-end' }}>
                    {puedeRegistrarPago(f) && (
                      <button
                        onClick={() => setPagoTarget(f)}
                        title="Registrar pago"
                        style={{
                          padding: '4px 8px', border: '1px solid var(--verde-600)',
                          borderRadius: 'var(--radio-md)', background: 'transparent',
                          color: 'var(--verde-700)', fontSize: 'var(--texto-xs)',
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Pagar
                      </button>
                    )}
                    {puedeAnular(f) && (
                      <button
                        onClick={() => anular(f)}
                        disabled={anulando === f.id}
                        title="Anular factura"
                        style={{
                          width: 28, height: 28, border: '1px solid var(--borde-control)',
                          borderRadius: 'var(--radio-md)', background: 'transparent',
                          color: anulando === f.id ? 'var(--ink-muted)' : '#C53030',
                          cursor: anulando === f.id ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: anulando === f.id ? 0.5 : 1,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
