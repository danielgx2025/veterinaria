/**
 * MetricaStrip — Tira de diagnóstico con número prominente + sparkline inline.
 * Reemplaza el default "icono-izquierda + número grande + label pequeño"
 * con una tira horizontal que evoca un resultado de laboratorio.
 */

interface SparklinePoint {
  valor: number;
}

interface MetricaStripProps {
  etiqueta: string;
  valor: string | number;
  unidad?: string;
  variacion?: number;        // % de cambio vs período anterior
  datos?: SparklinePoint[];  // últimos N puntos para sparkline
  color?: string;
  estado?: 'normal' | 'alerta' | 'critico' | 'exito';
  subcampo?: string;
}

function Sparkline({ datos, color }: { datos: SparklinePoint[]; color: string }) {
  if (!datos.length) return null;

  const max = Math.max(...datos.map(d => d.valor));
  const min = Math.min(...datos.map(d => d.valor));
  const range = max - min || 1;
  const ancho = 60;
  const alto = 24;
  const paso = ancho / (datos.length - 1 || 1);

  const puntos = datos.map((d, i) => {
    const x = i * paso;
    const y = alto - ((d.valor - min) / range) * (alto - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      style={{ flexShrink: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Punto final destacado */}
      {datos.length > 0 && (() => {
        const last = datos[datos.length - 1];
        const x = (datos.length - 1) * paso;
        const y = alto - ((last.valor - min) / range) * (alto - 4) - 2;
        return <circle cx={x} cy={y} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}

const COLORES_ESTADO = {
  normal:  'var(--verde-600)',
  alerta:  'var(--ambar-500)',
  critico: 'var(--rojo-500, #C53030)',
  exito:   'var(--verde-600)',
};

const BG_ESTADO = {
  normal:  'var(--superficie-base)',
  alerta:  'var(--ambar-100)',
  critico: 'var(--rojo-100)',
  exito:   'var(--superficie-exito)',
};

export default function MetricaStrip({
  etiqueta,
  valor,
  unidad,
  variacion,
  datos = [],
  color,
  estado = 'normal',
  subcampo,
}: MetricaStripProps) {
  const colorActivo = color ?? COLORES_ESTADO[estado];
  const bg = BG_ESTADO[estado];
  const subida = variacion !== undefined && variacion > 0;
  const bajada = variacion !== undefined && variacion < 0;

  return (
    <div style={{
      background: bg,
      border: '1px solid var(--borde-sutil)',
      borderLeft: `3px solid ${colorActivo}`,
      borderRadius: 'var(--radio-md)',
      padding: 'var(--esp-4)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--esp-4)',
      minHeight: 72,
    }}>
      {/* Datos principales */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--texto-xs)',
          fontWeight: 'var(--peso-semibold)',
          color: 'var(--ink-terciario)',
          letterSpacing: 'var(--tracking-muy-amplio)',
          textTransform: 'uppercase',
          marginBottom: 'var(--esp-1)',
        }}>
          {etiqueta}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--esp-2)' }}>
          <span style={{
            fontFamily: 'var(--fuente-mono)',
            fontSize: 'var(--texto-3xl)',
            fontWeight: 'var(--peso-bold)',
            color: 'var(--ink-primario)',
            letterSpacing: 'var(--tracking-apretado)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {typeof valor === 'number' ? valor.toLocaleString('es-ES') : valor}
          </span>
          {unidad && (
            <span style={{
              fontSize: 'var(--texto-sm)',
              color: 'var(--ink-terciario)',
              fontWeight: 'var(--peso-normal)',
            }}>
              {unidad}
            </span>
          )}
        </div>

        {/* Variación vs período anterior */}
        {variacion !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--esp-1)',
            marginTop: 'var(--esp-1)',
          }}>
            <span style={{
              fontSize: 'var(--texto-xs)',
              fontWeight: 'var(--peso-medio)',
              color: subida ? 'var(--verde-600)' :
                     bajada ? 'var(--rojo-500, #C53030)' :
                     'var(--ink-terciario)',
            }}>
              {subida ? '↑' : bajada ? '↓' : '→'}
              {' '}{Math.abs(variacion).toFixed(1)}%
            </span>
            <span style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-muted)' }}>
              vs mes anterior
            </span>
          </div>
        )}

        {subcampo && (
          <div style={{
            fontSize: 'var(--texto-xs)',
            color: 'var(--ink-terciario)',
            marginTop: 'var(--esp-1)',
          }}>
            {subcampo}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {datos.length > 1 && (
        <Sparkline datos={datos} color={colorActivo} />
      )}
    </div>
  );
}
