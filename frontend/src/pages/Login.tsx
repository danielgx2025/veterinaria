import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Ingresa tu correo y contraseña.'); return; }
    setCargando(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Credenciales incorrectas.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/dashboard', { replace: true });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--borde-control)',
    borderRadius: 'var(--radio-md)',
    background: 'var(--superficie-base)',
    color: 'var(--ink-primario)',
    fontSize: 'var(--texto-sm)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transicion-rapida)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--superficie-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--esp-6)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--superficie-base)',
        border: '1px solid var(--borde-sutil)',
        borderRadius: 'var(--radio-xl)',
        padding: 'var(--esp-8)',
        boxShadow: 'var(--sombra-md)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--esp-3)', marginBottom: 'var(--esp-8)' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 'var(--radio-md)',
            background: 'var(--verde-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--fuente-display)',
              fontWeight: 'var(--peso-semibold)',
              fontSize: 'var(--texto-xl)',
              color: 'var(--ink-primario)',
              lineHeight: 1.1,
            }}>
              VetSystem
            </div>
            <div style={{ fontSize: 'var(--texto-xs)', color: 'var(--ink-terciario)', letterSpacing: 'var(--tracking-amplio)' }}>
              CLÍNICA VETERINARIA
            </div>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--fuente-display)',
          fontSize: 'var(--texto-2xl)',
          fontWeight: 400,
          color: 'var(--ink-primario)',
          marginBottom: 4,
        }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 'var(--texto-sm)', color: 'var(--ink-terciario)', marginBottom: 'var(--esp-6)' }}>
          Ingresa tus credenciales para continuar
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--esp-4)' }}>
          <div>
            <label style={{
              display: 'block', fontSize: 'var(--texto-xs)',
              fontWeight: 'var(--peso-medio)', color: 'var(--ink-terciario)',
              marginBottom: 'var(--esp-1)',
            }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@veterinaria.com"
              autoComplete="email"
              autoFocus
              style={inp}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 'var(--texto-xs)',
              fontWeight: 'var(--peso-medio)', color: 'var(--ink-terciario)',
              marginBottom: 'var(--esp-1)',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inp}
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--esp-3)', borderRadius: 'var(--radio-md)',
              background: '#FEE8E8', color: '#C53030',
              fontSize: 'var(--texto-sm)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: 'var(--esp-3)',
              background: cargando ? 'var(--verde-400)' : 'var(--verde-600)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radio-md)',
              fontSize: 'var(--texto-sm)',
              fontWeight: 'var(--peso-semibold)',
              cursor: cargando ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--esp-2)',
              marginTop: 'var(--esp-2)',
              transition: 'background var(--transicion-rapida)',
            }}
          >
            {cargando && (
              <style>{`@keyframes spinLogin { to { transform: rotate(360deg) } }`}</style>
            )}
            {cargando && (
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spinLogin 0.6s linear infinite',
              }} />
            )}
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
