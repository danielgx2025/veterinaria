import EstadoSaludRing from './EstadoSaludRing';

interface PacienteCardProps {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  dueño: string;
  colorEspecie?: string;
  fotoUrl?: string;
  ultimaConsulta?: string;
  estado?: 'saludable' | 'en_tratamiento' | 'critico' | 'fallecido';
  onClick?: () => void;
}

const COLOR_ESPECIE_DEFAULT: Record<string, string> = {
  'Perro':   '#D4850A',
  'Gato':    '#6B48B8',
  'Ave':     '#0891B2',
  'Conejo':  '#DB6A8C',
  'Hámster': '#7C6F5B',
  'Reptil':  '#4D7C0F',
  'Pez':     '#0369A1',
  'Exótico': '#C2410C',
};

function EspecieInicial({ nombre, color }: { nombre: string; color: string }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`,
      fontSize: '1.1rem',
      lineHeight: 1,
    }}>
      {nombre === 'Perro' ? '🐕' :
       nombre === 'Gato' ? '🐈' :
       nombre === 'Ave' ? '🐦' :
       nombre === 'Conejo' ? '🐇' :
       nombre === 'Reptil' ? '🦎' : '🐾'}
    </div>
  );
}

export default function PacienteCard({
  nombre, especie, raza, dueño, colorEspecie, fotoUrl,
  ultimaConsulta, estado = 'saludable', onClick,
}: PacienteCardProps) {
  const color = colorEspecie ?? COLOR_ESPECIE_DEFAULT[especie] ?? '#4A9068';

  return (
    <article
      onClick={onClick}
      style={{
        background: 'var(--superficie-base)',
        border: '1px solid var(--borde-sutil)',
        borderRadius: 'var(--radio-lg)',
        padding: 'var(--esp-4)',
        display: 'flex',
        gap: 'var(--esp-3)',
        alignItems: 'flex-start',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color var(--transicion-rapida), box-shadow var(--transicion-rapida)',
        boxShadow: 'var(--sombra-sm)',
      }}
      onMouseEnter={e => {
        if (!onClick) return;
        (e.currentTarget as HTMLElement).style.borderColor = color + '40';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sombra-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--borde-sutil)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sombra-sm)';
      }}
    >
      {/* Anillo de especie + foto */}
      <EstadoSaludRing size={52} colorEspecie={color} estado={estado}>
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <EspecieInicial nombre={especie} color={color} />
        )}
      </EstadoSaludRing>

      {/* Información */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--esp-2)', marginBottom: 'var(--esp-1)' }}>
          <span style={{
            fontSize: 'var(--texto-md)',
            fontWeight: 'var(--peso-semibold)',
            color: 'var(--ink-primario)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {nombre}
          </span>
          {/* Badge de especie */}
          <span style={{
            fontSize: 'var(--texto-xs)',
            fontWeight: 'var(--peso-medio)',
            color: color,
            background: `${color}14`,
            borderRadius: 'var(--radio-full)',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {especie}
          </span>
        </div>

        {raza && (
          <div style={{
            fontSize: 'var(--texto-xs)',
            color: 'var(--ink-terciario)',
            marginBottom: 'var(--esp-1)',
          }}>
            {raza}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--esp-2)',
        }}>
          <span style={{
            fontSize: 'var(--texto-sm)',
            color: 'var(--ink-secundario)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            Dueño: {dueño}
          </span>
          {ultimaConsulta && (
            <span style={{
              fontSize: 'var(--texto-xs)',
              color: 'var(--ink-muted)',
              flexShrink: 0,
            }}>
              {new Date(ultimaConsulta).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short'
              })}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
