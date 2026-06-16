import { useState, useEffect } from "react";
import { Search, Sun, Moon, X, Loader2 } from "lucide-react";
import { type Usuario } from "./data";

// Cambiamos el tipo para que acepte el objeto completo del ticket
interface TopBarProps {
  titulo: string;
  subtitulo?: string;
  darkMode: boolean;
  onToggleDark: () => void;
  onTicketSelect: (ticket: any) => void; // 👈 Ahora recibe un objeto 'any' en lugar de un 'string'
  usuario: Usuario;
}

// Mapas de traducción para el frontend
const mapaEstados: Record<string, string> = {
  'backlog': 'Backlog',
  'en_progreso': 'En Progreso',
  'revision_codigo': 'Revisión de Código',
  'qa': 'QA',
  'terminado': 'Terminado'
};

const mapaPrioridades: Record<string, string> = {
  'critica': 'Crítico',
  'alta': 'Alto',
  'media': 'Medio',
  'baja': 'Bajo'
};

function colorPorIniciales(iniciales: string) {
  const mapa: Record<string, string> = {
    VL: '#3b82f6', CH: '#8b5cf6', BR: '#10b981', FE: '#f59e0b', DK: '#ef4444',
  };
  return mapa[iniciales] || '#6b7280';
}

export function TopBar({ titulo, subtitulo, darkMode, onToggleDark, onTicketSelect, usuario }: TopBarProps) {
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [consulta, setConsulta] = useState('');
  
  const [ticketsDB, setTicketsDB] = useState<any[]>([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  useEffect(() => {
    if (busquedaAbierta) {
      setCargandoBusqueda(true);
      fetch('http://localhost:5000/api/tickets')
        .then(res => res.json())
        .then(data => {
          // Mapeamos los datos de MySQL al formato del Frontend antes de guardarlos
          const ticketsMapeados = data.map((t: any) => {
            const iniciales = t.asignado_nombre 
              ? t.asignado_nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
              : 'NA';

            return {
              id: t.codigo || `IT-${t.id}`,
              dbId: t.id,
              titulo: t.titulo,
              descripcion: t.descripcion,
              estado: mapaEstados[t.estado] || 'Backlog',
              prioridad: mapaPrioridades[t.prioridad] || 'Medio',
              asignado: {
                nombre: t.asignado_nombre || 'Sin Asignar',
                iniciales: iniciales,
                color: colorPorIniciales(iniciales)
              },
              fechaVencimiento: t.fecha_limite ? t.fecha_limite.split('T')[0] : '',
              etiquetas: ['General'],
              comentarios: 0,
              subtareas: { total: 0, completadas: 0 },
              puntos: 1,
              proyecto: t.proyecto_nombre || 'Sin Proyecto',
              fechaCreacion: t.fecha_creacion ? t.fecha_creacion.split('T')[0] : 'N/A',
              categoria: t.categoria || 'N/A',
            };
          });

          setTicketsDB(ticketsMapeados);
          setCargandoBusqueda(false);
        })
        .catch(err => {
          console.error("Error cargando tickets para búsqueda:", err);
          setCargandoBusqueda(false);
        });
    } else {
      setConsulta('');
    }
  }, [busquedaAbierta]);

  const resultados = consulta.length > 1
    ? ticketsDB.filter(t => {
        return t.titulo.toLowerCase().includes(consulta.toLowerCase()) ||
               t.id.toLowerCase().includes(consulta.toLowerCase());
      }).slice(0, 5)
    : [];

  return (
    <header
      className="flex items-center gap-3 px-5 border-b flex-shrink-0 relative"
      style={{ height: 52, background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-baseline gap-2 min-w-0 mr-4">
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
          {titulo}
        </h1>
        {subtitulo && (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{subtitulo}</span>
        )}
      </div>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setBusquedaAbierta(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded border transition-colors hover:bg-[var(--muted)]"
          style={{ borderColor: 'var(--border)', background: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)' }}
        >
          <Search size={13} />
          <span className="hidden sm:inline">Buscar tickets…</span>
          <kbd
            className="hidden sm:inline px-1 rounded"
            style={{ fontSize: 10, background: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            ⌘K
          </kbd>
        </button>

        {busquedaAbierta && (
          <div
            className="absolute right-0 top-10 w-80 rounded-lg border shadow-2xl z-50 overflow-hidden"
            style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
              <input
                autoFocus
                value={consulta}
                onChange={e => setConsulta(e.target.value)}
                placeholder="Buscar tickets..."
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 13, color: 'var(--foreground)' }}
              />
              {cargandoBusqueda && <Loader2 size={13} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />}
              {consulta && !cargandoBusqueda && (
                <button onClick={() => setConsulta('')} style={{ color: 'var(--muted-foreground)' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            
            {resultados.length > 0 ? (
              <div className="py-1">
                {resultados.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { 
                      // 👈 AQUÍ ESTÁ LA MAGIA: Enviamos el objeto 't' completo al padre
                      onTicketSelect(t); 
                      setBusquedaAbierta(false); 
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--muted)] transition-colors text-left"
                  >
                    <span className="mono" style={{ fontSize: 11, color: 'var(--color-cyber-blue)', fontWeight: 500 }}>
                      {t.id}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--foreground)' }} className="truncate">
                      {t.titulo}
                    </span>
                  </button>
                ))}
              </div>
            ) : consulta.length > 1 ? (
              <div className="px-3 py-4 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                {cargandoBusqueda ? "Buscando..." : `Sin resultados para "${consulta}"`}
              </div>
            ) : (
              <div className="px-3 py-3" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                Escribe para buscar tickets…
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onToggleDark}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 ml-2"
        style={{ background: 'var(--muted)', borderColor: 'var(--border)', fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}
        title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      >
        {darkMode ? <Sun size={13} /> : <Moon size={13} />}
        <span className="hidden md:inline">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
      </button>

      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border flex-shrink-0"
        style={{ background: `${usuario.color}12`, borderColor: `${usuario.color}30` }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: usuario.color, fontSize: 8, color: '#fff', fontWeight: 700 }}
        >
          {usuario.iniciales}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: usuario.color }}>
          {usuario.nombre}
        </span>
        <span
          className="px-1 rounded"
          style={{ fontSize: 9, background: `${usuario.color}25`, color: usuario.color, fontWeight: 600 }}
        >
          {usuario.rol === 'admin' ? 'Admin' : 'Ing'}
        </span>
      </div>
    </header>
  );
}