import { useState, useEffect } from 'react';
import PacienteCard from '../components/PacienteCard';
import NuevoPacienteModal from '../components/NuevoPacienteModal';

interface Paciente {
  id: number;
  nombre: string;
  especie: string;
  raza?: string;
  dueño: string;
  color_acento?: string;
  foto_url?: string;
  ultima_consulta?: string;
  fallecido: boolean;
}

// Datos de ejemplo
const PACIENTES_EJEMPLO: Paciente[] = [
  { id: 1, nombre: 'Firulais', especie: 'Perro', raza: 'Labrador Retriever', dueño: 'Carlos Martínez', color_acento: '#D4850A', fallecido: false, ultima_consulta: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 2, nombre: 'Mishi', especie: 'Gato', raza: 'Persa', dueño: 'Ana Rodríguez', color_acento: '#6B48B8', fallecido: false, ultima_consulta: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 3, nombre: 'Rocky', especie: 'Perro', raza: 'Rottweiler', dueño: 'Luis Pérez', color_acento: '#D4850A', fallecido: false },
  { id: 4, nombre: 'Piolín', especie: 'Ave', dueño: 'María García', color_acento: '#0891B2', fallecido: false, ultima_consulta: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 5, nombre: 'Luna', especie: 'Gato', raza: 'Siamés', dueño: 'Roberto López', color_acento: '#6B48B8', fallecido: false },
  { id: 6, nombre: 'Toby', especie: 'Perro', raza: 'Beagle', dueño: 'Carmen Soto', color_acento: '#D4850A', fallecido: false, ultima_consulta: new Date().toISOString() },
];

const ESPECIES_FILTRO = ['Todos', 'Perro', 'Gato', 'Ave', 'Conejo', 'Exótico'];

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>(PACIENTES_EJEMPLO);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('Todos');
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const params = new URLSearchParams();
        if (busqueda) params.set('q', busqueda);
        const res = await fetch(`/api/pacientes?${params}`);
        if (res.ok) {
          const datos = await res.json();
          setPacientes(datos.data ?? PACIENTES_EJEMPLO);
        }
      } catch {
        // usar datos de ejemplo
      } finally {
        setCargando(false);
      }
    };
    const timer = setTimeout(cargar, 300);
    return () => clearTimeout(timer);
  }, [busqueda, reloadKey]);

  const pacientesFiltrados = pacientes.filter(p =>
    (filtroEspecie === 'Todos' || p.especie === filtroEspecie) &&
    (p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
     p.dueño.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const recargarPacientes = () => {
    setReloadKey(k => k + 1);
  };

  return (
    <>
    <NuevoPacienteModal
      abierto={modalAbierto}
      onCerrar={() => setModalAbierto(false)}
      onCreado={recargarPacientes}
    />
    <div style={{ maxWidth: 'var(--ancho-contenido-max)', margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--esp-6)',
        flexWrap: 'wrap',
        gap: 'var(--esp-4)',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--fuente-display)',
            fontSize: 'var(--texto-2xl)',
            fontWeight: 400,
            color: 'var(--ink-primario)',
          }}>
            Pacientes
          </h2>
          <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginTop: 2 }}>
            {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? 's' : ''}
            {filtroEspecie !== 'Todos' ? ` · ${filtroEspecie}` : ''}
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
            padding: 'var(--esp-2) var(--esp-4)',
            background: 'var(--verde-600)', color: 'white',
            border: 'none', borderRadius: 'var(--radio-md)',
            fontSize: 'var(--texto-sm)', fontWeight: 'var(--peso-semibold)',
            cursor: 'pointer',
          }}>
          + Nuevo paciente
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 'var(--esp-3)',
        marginBottom: 'var(--esp-5)', flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Búsqueda */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--esp-2)',
          background: 'var(--superficie-base)',
          border: '1px solid var(--borde-control)',
          borderRadius: 'var(--radio-md)',
          padding: 'var(--esp-2) var(--esp-3)',
          minWidth: 240, flex: 1, maxWidth: 360,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, dueño..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 'var(--texto-sm)', color: 'var(--ink-primario)', width: '100%',
            }}
          />
        </div>

        {/* Chips de especie */}
        <div style={{ display: 'flex', gap: 'var(--esp-2)', flexWrap: 'wrap' }}>
          {ESPECIES_FILTRO.map(e => (
            <button
              key={e}
              onClick={() => setFiltroEspecie(e)}
              style={{
                padding: 'var(--esp-1) var(--esp-3)',
                borderRadius: 'var(--radio-full)',
                border: '1px solid',
                borderColor: filtroEspecie === e ? 'var(--verde-600)' : 'var(--borde-control)',
                background: filtroEspecie === e ? 'var(--verde-100)' : 'var(--superficie-base)',
                color: filtroEspecie === e ? 'var(--verde-700)' : 'var(--ink-secundario)',
                fontSize: 'var(--texto-xs)',
                fontWeight: filtroEspecie === e ? 'var(--peso-semibold)' : 'var(--peso-normal)',
                cursor: 'pointer',
                transition: 'all var(--transicion-rapida)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de pacientes */}
      {cargando ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--esp-3)',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 84, borderRadius: 'var(--radio-lg)',
              background: 'var(--neutro-200)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : pacientesFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 'var(--esp-16)',
          color: 'var(--ink-terciario)', fontSize: 'var(--texto-sm)',
        }}>
          No se encontraron pacientes{busqueda ? ` para "${busqueda}"` : ''}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--esp-3)',
        }}>
          {pacientesFiltrados.map(p => (
            <PacienteCard
              key={p.id}
              id={p.id}
              nombre={p.nombre}
              especie={p.especie}
              raza={p.raza}
              dueño={p.dueño}
              colorEspecie={p.color_acento}
              fotoUrl={p.foto_url}
              ultimaConsulta={p.ultima_consulta}
              estado={p.fallecido ? 'fallecido' : 'saludable'}
              onClick={() => { /* abrir detalle */ }}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
