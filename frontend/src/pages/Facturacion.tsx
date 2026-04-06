import { useState } from 'react';

interface Factura {
  id: number;
  numero_factura: string;
  cliente: string;
  fecha_emision: string;
  total: number;
  total_pagado: number;
  estado: 'borrador' | 'pendiente' | 'pagada' | 'parcial' | 'anulada';
  emitida_por: string;
}

const FACTURAS_EJEMPLO: Factura[] = [
  { id: 1, numero_factura: 'FAC-2026-000001', cliente: 'Carlos Martínez', fecha_emision: new Date().toISOString(), total: 85.00, total_pagado: 85.00, estado: 'pagada', emitida_por: 'Dra. García' },
  { id: 2, numero_factura: 'FAC-2026-000002', cliente: 'Ana Rodríguez', fecha_emision: new Date(Date.now() - 3600000).toISOString(), total: 120.00, total_pagado: 60.00, estado: 'parcial', emitida_por: 'Dr. López' },
  { id: 3, numero_factura: 'FAC-2026-000003', cliente: 'Luis Pérez', fecha_emision: new Date(Date.now() - 86400000).toISOString(), total: 35.00, total_pagado: 0, estado: 'pendiente', emitida_por: 'Dra. García' },
  { id: 4, numero_factura: 'FAC-2026-000004', cliente: 'María García', fecha_emision: new Date(Date.now() - 2 * 86400000).toISOString(), total: 250.00, total_pagado: 250.00, estado: 'pagada', emitida_por: 'Dr. López' },
  { id: 5, numero_factura: 'FAC-2026-000005', cliente: 'Roberto López', fecha_emision: new Date(Date.now() - 3 * 86400000).toISOString(), total: 45.00, total_pagado: 0, estado: 'pendiente', emitida_por: 'Dra. García' },
];

const ESTADO_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  borrador:  { color: '#6E8C7A', bg: '#F2F7F4', label: 'Borrador' },
  pendiente: { color: '#2C5F8A', bg: '#E8F1F8', label: 'Pendiente' },
  pagada:    { color: '#2A7A52', bg: '#EBF5EE', label: 'Pagada' },
  parcial:   { color: '#D4850A', bg: '#FEF3E2', label: 'Parcial' },
  anulada:   { color: '#C53030', bg: '#FEE8E8', label: 'Anulada' },
};

export default function Facturacion() {
  const [facturas] = useState<Factura[]>(FACTURAS_EJEMPLO);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const facturasFiltradas = facturas.filter(
    f => filtroEstado === 'todos' || f.estado === filtroEstado
  );

  const totalPendiente = facturas
    .filter(f => f.estado === 'pendiente' || f.estado === 'parcial')
    .reduce((sum, f) => sum + (f.total - f.total_pagado), 0);

  const totalCobradoHoy = facturas
    .filter(f => new Date(f.fecha_emision).toDateString() === new Date().toDateString())
    .reduce((sum, f) => sum + f.total_pagado, 0);

  return (
    <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--esp-6)', flexWrap: 'wrap', gap: 'var(--esp-4)',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--fuente-display)',
            fontSize: 'var(--texto-2xl)', fontWeight: 400,
            color: 'var(--ink-primario)',
          }}>
            Facturación
          </h2>
          <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
            {facturas.length} facturas · Pendiente cobro:{' '}
            <strong style={{ color: 'var(--ink-primario)' }}>
              ${totalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </strong>
          </p>
        </div>
        <button style={{
          padding: 'var(--esp-2) var(--esp-4)',
          background: 'var(--verde-600)', color: 'white',
          border: 'none', borderRadius: 'var(--radio-md)',
          fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
          cursor: 'pointer',
        }}>
          + Nueva factura
        </button>
      </div>

      {/* Resumen rápido */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--esp-3)', marginBottom: 'var(--esp-6)',
      }}>
        {[
          { label: 'Cobrado hoy', valor: `$${totalCobradoHoy.toFixed(2)}`, color: 'var(--verde-600)' },
          { label: 'Por cobrar', valor: `$${totalPendiente.toFixed(2)}`, color: 'var(--ambar-500)' },
          { label: 'Total facturas', valor: facturas.length, color: 'var(--azul-500)' },
          { label: 'Pagadas', valor: facturas.filter(f => f.estado === 'pagada').length, color: 'var(--verde-600)' },
        ].map(({ label, valor, color }) => (
          <div key={label} style={{
            background: 'var(--superficie-base)',
            border: '1px solid var(--borde-sutil)',
            borderRadius: 'var(--radio-md)',
            padding: 'var(--esp-4)',
          }}>
            <div style={{
              fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)',
              letterSpacing: 'var(--tracking-muy-amplio)', textTransform: 'uppercase',
              marginBottom: 'var(--esp-1)',
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: 'var(--fuente-mono)',
              fontSize: 'var(--texto-2xl)', fontWeight: 'var(--peso-bold)',
              color, fontVariantNumeric: 'tabular-nums',
            }}>
              {valor}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 'var(--esp-2)', marginBottom: 'var(--esp-4)', flexWrap: 'wrap' }}>
        {['todos', 'pendiente', 'parcial', 'pagada', 'anulada'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            style={{
              padding: 'var(--esp-1) var(--esp-3)',
              borderRadius: 'var(--radio-full)',
              border: '1px solid',
              borderColor: filtroEstado === e ? 'var(--verde-600)' : 'var(--borde-control)',
              background: filtroEstado === e ? 'var(--verde-100)' : 'var(--superficie-base)',
              color: filtroEstado === e ? 'var(--verde-700)' : 'var(--ink-secundario)',
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

      {/* Tabla de facturas */}
      <div style={{
        background: 'var(--superficie-base)',
        border: '1px solid var(--borde-sutil)',
        borderRadius: 'var(--radio-xl)',
        overflow: 'hidden',
      }}>
        {/* Cabecera tabla */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 140px 100px 100px 100px',
          padding: 'var(--esp-3) var(--esp-4)',
          borderBottom: '1px solid var(--borde-sutil)',
          background: 'var(--neutro-50)',
        }}>
          {['Número', 'Cliente', 'Fecha', 'Total', 'Pagado', 'Estado'].map(h => (
            <span key={h} style={{
              fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-semibold)',
              color: 'var(--ink-terciario)',
              letterSpacing: 'var(--tracking-muy-amplio)', textTransform: 'uppercase',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Filas */}
        {facturasFiltradas.map((f, i) => {
          const ec = ESTADO_CONFIG[f.estado];
          return (
            <div key={f.id} style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 140px 100px 100px 100px',
              padding: 'var(--esp-3) var(--esp-4)',
              borderBottom: i < facturasFiltradas.length - 1 ? '1px solid var(--borde-sutil)' : 'none',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background var(--transicion-rapida)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutro-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                fontFamily: 'var(--fuente-mono)',
                fontSize: 'var(--texto-xs)', color: 'var(--verde-600)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {f.numero_factura}
              </span>
              <span style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)' }}>
                {f.cliente}
              </span>
              <span style={{
                fontFamily: 'var(--fuente-mono)',
                fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {new Date(f.fecha_emision).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
              <span style={{
                fontFamily: 'var(--fuente-mono)',
                fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
                color: 'var(--ink-primario)', fontVariantNumeric: 'tabular-nums',
              }}>
                ${f.total.toFixed(2)}
              </span>
              <span style={{
                fontFamily: 'var(--fuente-mono)',
                fontSize: 'var(--texto-sm)', color: 'var(--verde-600)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                ${f.total_pagado.toFixed(2)}
              </span>
              <span style={{
                fontSize: 'var(--texto-xs)', fontWeight: 'var(--peso-medio)',
                color: ec.color, background: ec.bg,
                borderRadius: 'var(--radio-full)', padding: '3px 10px',
                display: 'inline-block', textAlign: 'center',
              }}>
                {ec.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
