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
import { API_URL } from './config';

// 1. CORREGIDO: Declaramos el tipo extendido para que coincida con el backend y las otras vistas
type TicketFrontend = Ticket & { dbId?: number };

const TITULOS_VISTA: Record<Exclude<VistaNav, 'configuracion'>, { titulo: string; subtitulo?: string }> = {
  inicio:     { titulo: 'Inicio',             subtitulo: 'Sprint 14 · 1–17 Jun' },
  tickets:    { titulo: 'Cola de Tickets',    subtitulo: '8 tickets · 2 críticos' },
  cronograma: { titulo: 'Cronograma',          subtitulo: 'Q2–Q3 2026' },
  sprint:     { titulo: 'Tablero de Sprint',  subtitulo: 'Sprint 14' },
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<VistaNav>('inicio');
  
  // 2. CORREGIDO: Cambiamos el tipo del estado para aceptar el formato extendido de la base de datos
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketFrontend | null>(null);
  
  const [quickCreateAbierto, setQuickCreateAbierto] = useState(false);
  const [tickets, setTickets] = useState<TicketFrontend[]>([]);
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
        const respuesta = await fetch(`${API_URL}/tickets`);
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

  // Manejo del Login asíncrono
  const handleLogin = async (datosLogin: { email: string; contrasena: string }) => {
  try {
    const respuesta = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: datosLogin.email,
        contrasena: datosLogin.contrasena
      })
    });
    
    // 🔍 SI LAS CREDENCIALES ESTÁN MAL: Leemos la respuesta del backend
    if (respuesta.status === 401) {
      const datosError = await respuesta.json();
      alert(`NexusIT: ${datosError.message || 'Credenciales incorrectas'}. Revisa el correo seleccionado o la contraseña.`);
      return; // Detiene el flujo de forma segura
    }

    if (!respuesta.ok) {
      throw new Error(`Error en el servidor: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    
    if (datos.success && datos.usuario) {
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
    alert("Error de comunicación física con el backend. Revisa la consola del navegador.");
  }
};
  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
    setTicketSeleccionado(null);
    setTickets([]);
    setVistaActiva('inicio');
  };

  // 3. CORREGIDO: Adaptamos la firma para aceptar tanto el objeto extendido como strings de ID mas limpiamente
  const handleTicketSelect = (ticketOrId: TicketFrontend | string) => {
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

  const { titulo, subtitulo } = TITULOS_VISTA[vistaActiva as Exclude<VistaNav, 'configuracion'>] || { titulo: 'NexusIT' };
 
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
          usuario={usuario}
          onTicketCreado={recargarTickets ?? undefined}
        />
      )}
    </div>
  );
}