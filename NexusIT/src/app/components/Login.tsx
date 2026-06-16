import { useState } from "react";
import { Zap, Eye, EyeOff, Shield, Code2, Database, Server, TestTube } from "lucide-react";
import { EQUIPO, type Usuario } from "./data";

interface LoginProps {
  onLogin: (datos: { email: string; contrasena: string }) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const ICONOS_ROL: Record<string, React.ElementType> = {
  'vlad': Shield,
  'chris': Code2,
  'braul': Database,
  'fern': Server,
  'derek': TestTube,
};

export function Login({ onLogin, darkMode, onToggleDark }: LoginProps) {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue estúpidamente
    if (!usuarioSeleccionado) { setError('Selecciona un usuario.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    
    setCargando(true);
    
    // Simula una breve carga estética antes de mandar los datos a App.tsx
    setTimeout(() => {
      setCargando(false);
      onLogin({
        email: usuarioSeleccionado.email,
        contrasena: password
      });
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4,
        }}
      />

      {/* Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
        style={{ width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />

      {/* Dark mode toggle */}
      <button
        type="button"
        onClick={onToggleDark}
        className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', fontSize: 12, color: 'var(--muted-foreground)' }}
      >
        <span style={{ fontSize: 14 }}>{darkMode ? '☀️' : '🌙'}</span>
        {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
      </button>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', textAlign: 'center' }}>
            NexusIT
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4, textAlign: 'center' }}>
            Sistema de Gestión de Tickets · Inicia sesión para continuar
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 shadow-2xl"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 16 }}>
            Selecciona tu usuario
          </h2>

          {/* User grid */}
          <div className="grid grid-cols-5 gap-2 mb-5">
            {EQUIPO.map(u => {
              const activo = usuarioSeleccionado?.id === u.id;
              return (
                <button
                  type="button" // 👈 CRÍTICO: Evita que este botón active accidentalmente el submit del formulario
                  key={u.id}
                  onClick={() => { setUsuarioSeleccionado(u); setError(''); }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                  style={{
                    background: activo ? `${u.color}18` : 'var(--muted)',
                    borderColor: activo ? u.color : 'var(--border)',
                    boxShadow: activo ? `0 0 0 1px ${u.color}` : 'none',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: activo ? u.color : 'var(--border)' }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: activo ? '#fff' : 'var(--muted-foreground)' }}>
                      {u.iniciales}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: activo ? 600 : 400, color: activo ? u.color : 'var(--muted-foreground)', lineHeight: 1.2, textAlign: 'center' }}>
                    {u.nombre}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected user info */}
          {usuarioSeleccionado && (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border mb-4"
              style={{ background: `${usuarioSeleccionado.color}10`, borderColor: `${usuarioSeleccionado.color}40` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: usuarioSeleccionado.color }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{usuarioSeleccionado.iniciales}</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{usuarioSeleccionado.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {usuarioSeleccionado.cargo} · {usuarioSeleccionado.rol === 'admin' ? '🔑 Administrador' : '👤 Ingeniero'}
                </div>
              </div>
              <span
                className="ml-auto px-2 py-0.5 rounded-full"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: usuarioSeleccionado.rol === 'admin' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                  color: usuarioSeleccionado.rol === 'admin' ? '#3b82f6' : '#8b5cf6',
                }}
              >
                {usuarioSeleccionado.rol === 'admin' ? 'Admin' : 'Ingeniero'}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Ingresa tu contraseña…"
                  className="w-full rounded-lg border px-3 py-2.5 pr-10"
                  style={{
                    background: 'var(--muted)',
                    borderColor: error ? '#ef4444' : 'var(--border)',
                    fontSize: 13,
                    color: 'var(--foreground)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button" // 👈 Aseguramos que sea solo un botón de acción visual
                  onClick={() => setMostrarPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {mostrarPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
                Demo: Usa la contraseña asignada en la Base de Datos.
              </p>
            </div>

            {error && (
              <p className="px-3 py-2 rounded-lg" style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                {error}
              </p>
            )}

            <button
              type="submit" // 👈 Único botón de submit en todo el componente
              disabled={cargando}
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? 'Iniciando sesión…' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', marginTop: 16 }}>
          NexusIT v2.4 · © 2026 Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}