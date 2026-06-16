import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { Sidebar, type VistaNav } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { TicketQueue } from "./components/TicketQueue";
import { TicketDetail } from "./components/TicketDetail";
import { Roadmap } from "./components/Roadmap";
import { QuickCreate } from "./components/QuickCreate";
import { type Ticket, type EstadoTicket, type Usuario } from "./components/data";

const TITULOS_VISTA: Record<VistaNav, { titulo: string; subtitulo?: string }> = {
  inicio:        { titulo: 'Inicio',             subtitulo: 'Sprint 14 · 1–17 Jun' },
  tickets:       { titulo: 'Cola de Tickets',    subtitulo: '8 tickets · 2 críticos' },
  cronograma:    { titulo: 'Cronograma',          subtitulo: 'Q2–Q3 2026' },
  sprint:        { titulo: 'Tablero de Sprint',  subtitulo: 'Sprint 14' },
  configuracion: { titulo: 'Configuración',      subtitulo: 'Espacio de trabajo y preferencias' },
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<VistaNav>('inicio');
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [quickCreateAbierto, setQuickCreateAbierto] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [recargarTickets, setRecargarTickets] = useState<(() => void) | null>(null);

  // Control del modo oscuro en el HTML
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Inicialización de temas y recuperación de sesión
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const usuarioPersistido = localStorage.getItem('usuario');
    if (usuarioPersistido) {
      try {
        setUsuario(JSON.parse(usuarioPersistido));
      } catch (e) {
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  // CARGA DINÁMICA: Traer tickets cuando el usuario inicie sesión
  useEffect(() => {
    if (!usuario) return;

    const cargarTickets = async () => {
      try {
        const respuesta = await fetch('http://localhost:5000/api/tickets');
        const datos = await respuesta.json();
        if (Array.isArray(datos)) {
          setTickets(datos);
        } else if (datos.success && Array.isArray(datos.tickets)) {
          setTickets(datos.tickets);
        }
      } catch (error) {
        console.error("Error cargando los tickets desde el backend:", error);
      }
    };

    cargarTickets();
  }, [usuario]);

  // Manejo del Login asíncrono con manejo de errores robusto
  const handleLogin = async (datosLogin: { email: string; contrasena: string }) => {
    try {
      const respuesta = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: datosLogin.email,
          contrasena: datosLogin.contrasena
        })
      });
      
      if (!respuesta.ok) {
        throw new Error(`Error en el servidor: ${respuesta.status}`);
      }

      const datos = await respuesta.json();
      
      if (datos.success && datos.usuario) {
        // Mapeamos de forma segura verificando nulos o indefinidos
        const usuarioLogueado: Usuario = {
          id: datos.usuario.id || "0",
          nombre: datos.usuario.nombre || "Usuario",
          email: datos.usuario.email || datosLogin.email,
          rol: datos.usuario.rol === 'admin' ? 'admin' : 'ingeniero',
          cargo: datos.usuario.puesto || 'Ingeniero de Software',
          iniciales: (datos.usuario.nombre || "US").substring(0, 2).toUpperCase(),
          color: datos.usuario.rol === 'admin' ? '#3b82f6' : '#8b5cf6'
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));
        setUsuario(usuarioLogueado);
        setVistaActiva('inicio');
      } else {
        alert(datos.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error("Error conectando al backend:", error);
      alert("Error de conexión con el backend (puerto 5000). Revisa la consola del navegador (F12) para más detalles.");
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    setTicketSeleccionado(null);
    setTickets([]);
    setVistaActiva('inicio');
  };

  const handleTicketSelect = (ticketOrId: Ticket | string) => {
    if (typeof ticketOrId === 'string') {
      const encontrado = tickets.find(t => t.id === ticketOrId);
      if (encontrado) setTicketSeleccionado(encontrado);
    } else {
      setTicketSeleccionado(ticketOrId);
    }
    setVistaActiva('tickets');
  };

  const handleCambiarEstado = (ticketId: string, nuevoEstado: EstadoTicket) => {
    setTickets(prev =>
      prev.map(t => t.id === ticketId ? { ...t, estado: nuevoEstado } : t)
    );
    if (ticketSeleccionado?.id === ticketId) {
      setTicketSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
    }
  };

  if (!usuario) {
    return (
      <Login
        onLogin={handleLogin}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
      />
    );
  }

  const { titulo, subtitulo } = TITULOS_VISTA[vistaActiva] || { titulo: 'NexusIT' };
 
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar
        vistaActiva={vistaActiva}
        onNavegar={v => { setVistaActiva(v); setTicketSeleccionado(null); }}
        onCrearTicket={() => setQuickCreateAbierto(true)}
        colapsado={sidebarColapsado}
        onToggle={() => setSidebarColapsado(v => !v)}
        usuario={usuario}
        onCerrarSesion={handleCerrarSesion}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          titulo={titulo}
          subtitulo={subtitulo}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(v => !v)}
          onTicketSelect={handleTicketSelect}
          usuario={usuario}
        />

        {ticketSeleccionado && vistaActiva === 'tickets' && (
          <div
            className="flex items-center gap-1.5 px-5 py-2 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', fontSize: 12 }}
          >
            <button
              onClick={() => setTicketSeleccionado(null)}
              style={{ color: 'var(--muted-foreground)' }}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Cola de Tickets
            </button>
            <span style={{ color: 'var(--muted-foreground)' }}>/</span>
            <span className="mono" style={{ color: 'var(--color-cyber-blue)', fontWeight: 600 }}>
              {ticketSeleccionado.id}
            </span>
            <span style={{ color: 'var(--muted-foreground)' }}>·</span>
            <span className="truncate" style={{ color: 'var(--foreground)', maxWidth: 300 }}>
              {ticketSeleccionado.titulo}
            </span>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {vistaActiva === 'inicio' && (
              <Dashboard
                onTicketSelect={handleTicketSelect}
                onNavegar={(v) => setVistaActiva(v as VistaNav)}
                usuario={usuario}
              />
            )}
            {(vistaActiva === 'tickets' || vistaActiva === 'sprint') && (
              <TicketQueue
                onTicketSelect={handleTicketSelect}
                usuario={usuario}
                onCambiarEstado={handleCambiarEstado}
                onCargarTickets={(fn) => setRecargarTickets(() => fn)}
              />
            )}
            {vistaActiva === 'cronograma' && <Roadmap />}
            {vistaActiva === 'configuracion' && <ConfiguracionVista usuario={usuario} />}
          </div>

          {ticketSeleccionado && (
            <div
              className="flex-shrink-0 border-l overflow-hidden"
              style={{ width: 580, borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <TicketDetail
                ticket={ticketSeleccionado}
                onTicketUpdated={() => recargarTickets?.()}
                onClose={() => setTicketSeleccionado(null)}
                usuario={usuario}
              />
            </div>
          )}
        </div>
      </div>

      {usuario.rol === 'admin' && (
        <QuickCreate
          abierto={quickCreateAbierto}
          onCerrar={() => setQuickCreateAbierto(false)}
          usuario={usuario}               // <-- agrega esto
          onTicketCreado={recargarTickets ?? undefined}  // para que recargue el tablero
        />
      )}
    </div>
  );
}

function ConfiguracionVista({ usuario }: { usuario: Usuario }) {
  const esAdmin = usuario.rol === 'admin';
  const [proyectos, setProyectos] = useState<{ id: number; nombre: string; progreso: number; color: string }[]>([]);
  const [cargando, setCargando] = useState(true);

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Alertas de tickets críticos': true,
    'Ticket asignado a mí': true,
    'Resumen semanal de sprint': false,
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/proyectos/detalle')
      .then(r => r.json())
      .then(data => { setProyectos(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-5 max-w-2xl">
      {/* Tarjeta de perfil */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl border mb-5"
        style={{ background: `${usuario.color}0d`, borderColor: `${usuario.color}30` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: usuario.color, fontSize: 13, color: '#fff', fontWeight: 700 }}
        >
          {usuario.iniciales}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{usuario.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{usuario.cargo}</div>
        </div>
        <span
          className="ml-auto px-2.5 py-1 rounded-full"
          style={{
            fontSize: 11, fontWeight: 600,
            background: esAdmin ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
            color: esAdmin ? '#3b82f6' : '#8b5cf6',
          }}
        >
          {esAdmin ? '🔑 Administrador' : '👤 Ingeniero'}
        </span>
      </div>

      {!esAdmin && (
        <div className="px-4 py-3 rounded-lg border mb-5" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
          <p style={{ fontSize: 12, color: '#f59e0b' }}>
            ⚠️ Como ingeniero, solo puedes cambiar el estado de tickets asignados a ti y añadir comentarios.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Perfil */}
        <SeccionConfig titulo="Perfil">
          <FilaConfig etiqueta="Nombre" valor={usuario.nombre} />
          <FilaConfig etiqueta="Cargo" valor={usuario.cargo} />
          <FilaConfig etiqueta="Correo" valor={usuario.email} />
          <FilaConfig etiqueta="Rol" valor={esAdmin ? 'Administrador' : 'Ingeniero'} />
        </SeccionConfig>

        {/* Proyectos — solo admin */}
        {esAdmin && (
          <SeccionConfig titulo="Proyectos activos">
            {cargando ? (
              <div className="px-5 py-3" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Cargando...</div>
            ) : proyectos.length === 0 ? (
              <div className="px-5 py-3" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Sin proyectos</div>
            ) : (
              proyectos.map((p, i, arr) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{p.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.progreso}%`, background: p.color }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', minWidth: 32, textAlign: 'right' }}>
                      {p.progreso}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </SeccionConfig>
        )}

        {/* Notificaciones */}
        <SeccionConfig titulo="Notificaciones">
          {Object.entries(toggles).map(([etiqueta, valor], i, arr) => (
            <div
              key={etiqueta}
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{etiqueta}</span>
              <button
                onClick={() => setToggles(prev => ({ ...prev, [etiqueta]: !prev[etiqueta] }))}
                className="w-9 h-5 rounded-full relative transition-colors"
                style={{ background: valor ? 'var(--color-cyber-blue)' : 'var(--muted)' }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{ background: '#fff', left: valor ? '18px' : '2px' }}
                />
              </button>
            </div>
          ))}
        </SeccionConfig>
      </div>
    </div>
  );
}

function SeccionConfig({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {titulo}
        </h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function FilaConfig({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{etiqueta}</span>
      <span style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>{valor}</span>
    </div>
  );
}