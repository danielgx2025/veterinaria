/**
 * SIGNATURE ELEMENT del sistema VetSystem:
 * Anillo SVG de estado de salud que rodea la foto del paciente.
 * El color del anillo refleja la especie del animal.
 * El grosor varía según el estado de salud.
 */

interface EstadoSaludRingProps {
  size?: number;
  colorEspecie: string;
  estado?: 'saludable' | 'en_tratamiento' | 'critico' | 'fallecido';
  children?: React.ReactNode;
}

const ESTADOS = {
  saludable:       { dash: '100%', gap: 0,    opacidad: 1,    etiqueta: 'Saludable' },
  en_tratamiento:  { dash: '70%',  gap: '30%', opacidad: 0.85, etiqueta: 'En tratamiento' },
  critico:         { dash: '40%',  gap: '60%', opacidad: 1,    etiqueta: 'Crítico' },
  fallecido:       { dash: '100%', gap: 0,     opacidad: 0.3,  etiqueta: 'Fallecido' },
};

export default function EstadoSaludRing({
  size = 48,
  colorEspecie,
  estado = 'saludable',
  children,
}: EstadoSaludRingProps) {
  const radio = (size - 4) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const config = ESTADOS[estado];
  const dashArray = `${parseFloat(String(config.dash)) / 100 * circunferencia} ${parseFloat(String(config.gap)) / 100 * circunferencia}`;

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      title={config.etiqueta}
    >
      {/* Anillo SVG de estado */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Track de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke={colorEspecie}
          strokeWidth="2.5"
          opacity="0.12"
        />
        {/* Anillo de estado */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke={colorEspecie}
          strokeWidth={estado === 'critico' ? '3' : '2.5'}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          opacity={config.opacidad}
          style={{
            transition: 'stroke-dasharray 0.6s ease, opacity 0.3s ease',
          }}
        />
      </svg>

      {/* Contenido interior (foto o inicial) */}
      <div style={{
        position: 'absolute',
        top: 4, left: 4,
        width: size - 8,
        height: size - 8,
        borderRadius: 'var(--radio-full)',
        overflow: 'hidden',
        background: 'var(--neutro-200, #E5EEE9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}
