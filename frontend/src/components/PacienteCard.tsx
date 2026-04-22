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
  onEditar?: () => void;
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
  ultimaConsulta, estado = 'saludable', onClick, onEditar,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-2)', flexShrink: 0 }}>
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
          {onEditar && (
            <button
              onClick={e => { e.stopPropagation(); onEditar(); }}
              title="Editar paciente"
              style={{
                width: 26, height: 26,
                border: '1px solid var(--borde-control)',
                borderRadius: 'var(--radio-md)',
                background: 'var(--superficie-base)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink-secundario)',
                padding: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                (e.currentTarget as HTMLButtonElement).style.color = color;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--borde-control)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-secundario)';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          </div>
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
