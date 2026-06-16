import { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid, List, MessageSquare, GitBranch, AlertCircle,
  Clock, User, ChevronDown, AlertTriangle
} from "lucide-react";
import { COLORES_PRIORIDAD, COLUMNAS_ESTADO, ESTADO_INGENIERO_PERMITIDO, type Ticket, type EstadoTicket, type Prioridad, type Usuario } from "./data";

export type TicketFrontend = Ticket & { dbId: number };

interface TicketQueueProps {
  onTicketSelect: (ticket: TicketFrontend) => void;
  usuario: Usuario;
  onCargarTickets?: (fn: () => void) => void;
}

// --- FUNCIONES HELPER ---

const mapearTicketDBaFrontend = (dbTicket: any): TicketFrontend => {
  const mapaEstados: Record<string, EstadoTicket> = {
    'backlog': 'Backlog',
    'en_progreso': 'En Progreso',
    'revision_codigo': 'Revisión de Código',
    'qa': 'QA',
    'terminado': 'Terminado'
  };
  const mapaPrioridades: Record<string, Prioridad> = {
    'critica': 'Crítico',
    'alta': 'Alto',
    'media': 'Medio',
    'baja': 'Bajo'
  };
  const iniciales = dbTicket.asignado_nombre
    ? dbTicket.asignado_nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'NA';
  const fechaVencimiento = dbTicket.fecha_limite ? dbTicket.fecha_limite.split('T')[0] : '';
  return {
    id: dbTicket.codigo || `IT-${dbTicket.id}`,
    dbId: dbTicket.id,
    titulo: dbTicket.titulo,
    estado: mapaEstados[dbTicket.estado] || 'Backlog',
    prioridad: mapaPrioridades[dbTicket.prioridad] || 'Medio',
    asignado: {
      nombre: dbTicket.asignado_nombre || 'Sin Asignar',
      iniciales: iniciales,
      color: '#3b82f6'
    },
    fechaVencimiento: fechaVencimiento,
    etiquetas: ['General'],
    descripcion: dbTicket.descripcion,
    comentarios: 0,
    subtareas: { total: 0, completadas: 0 },
    puntos: 1,
    proyecto: dbTicket.proyecto_nombre || 'Sin Proyecto',
    fechaCreacion: dbTicket.fecha_creacion ? dbTicket.fecha_creacion.split('T')[0] : 'N/A',
    categoria: dbTicket.categoria || 'N/A',
  };
};

// --- COMPONENTES DE UI ---

function PuntoPrioridad({ prioridad }: { prioridad: Prioridad }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: COLORES_PRIORIDAD[prioridad] }}
    />
  );
}

function BadgeEstado({ estado }: { estado: EstadoTicket }) {
  const colores: Record<EstadoTicket, { bg: string; text: string }> = {
    'Backlog': { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
    'En Progreso': { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
    'Revisión de Código': { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
    'QA': { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    'Terminado': { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  };
  const c = colores[estado];
  return (
    <span
      className="px-1.5 py-0.5 rounded"
      style={{ fontSize: 10, background: c.bg, color: c.text, fontWeight: 500 }}
    >
      {estado}
    </span>
  );
}

function EtiquetaChip({ label }: { label: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded border"
      style={{ fontSize: 10, color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
    >
      {label}
    </span>
  );
}

function TarjetaKanban({ ticket, onClick, usuario, onCambiarEstado }: {
  ticket: TicketFrontend;
  onClick: () => void;
  usuario: Usuario;
  onCambiarEstado?: (id: string, estado: EstadoTicket) => void;
}) {
  const esAsignado = ticket.asignado.nombre === usuario.nombre;
  const puedeModificar = usuario.rol === 'admin' || esAsignado;
  
  const estadosPermitidos = puedeModificar
    ? COLUMNAS_ESTADO.filter(e => e !== ticket.estado)
    : [];

  // 👈 LÓGICA DE VENCIMIENTO
  const hoy = new Date().toISOString().split('T')[0];
  const esVencido = ticket.fechaVencimiento && ticket.fechaVencimiento < hoy && ticket.estado !== 'Terminado';

  return (
    <div
      className="rounded-lg border p-3 cursor-pointer transition-all hover:shadow-lg group"
      style={{ 
        background: 'var(--card)', 
        borderColor: esVencido ? '#ef444450' : 'var(--border)' // Borde rojizo si está vencido
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="mono" style={{ fontSize: 10, color: 'var(--color-cyber-blue)', fontWeight: 500 }}>
            {ticket.id}
          </span>
          {/* 👈 ETIQUETA ROJA DE VENCIDO */}
          {esVencido && (
            <span 
              className="px-1.5 py-[1px] rounded flex items-center gap-1" 
              style={{ fontSize: 9, background: '#ef444415', color: '#ef4444', fontWeight: 600, border: '1px solid #ef444430' }}
            >
              <AlertTriangle size={8} /> Vencido
            </span>
          )}
        </div>
        <PuntoPrioridad prioridad={ticket.prioridad} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.5, marginBottom: 8 }} className="line-clamp-2">
        {ticket.titulo}
      </p>
      <div className="flex flex-wrap gap-1 mb-2.5">
        {ticket.etiquetas.slice(0, 2).map(t => <EtiquetaChip key={t} label={t} />)}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <div className="flex items-center gap-1">
            <MessageSquare size={10} />
            <span style={{ fontSize: 10 }}>{ticket.comentarios}</span>
          </div>
          {ticket.subtareas.total > 0 && (
            <div className="flex items-center gap-1">
              <GitBranch size={10} />
              <span style={{ fontSize: 10 }}>{ticket.subtareas.completadas}/{ticket.subtareas.total}</span>
            </div>
          )}
        </div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: ticket.asignado.color, fontSize: 9, color: '#fff', fontWeight: 700 }}
          title={ticket.asignado.nombre}
        >
          {ticket.asignado.iniciales}
        </div>
      </div>
      {puedeModificar && estadosPermitidos.length > 0 && onCambiarEstado && (
        <div
          className="mt-2 pt-2 border-t"
          style={{ borderColor: 'var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          <select
            className="w-full appearance-none px-2 py-1 rounded border cursor-pointer text-center"
            style={{
              background: 'var(--muted)',
              borderColor: 'var(--border)',
              fontSize: 10,
              color: 'var(--muted-foreground)',
              outline: 'none',
            }}
            value=""
            onChange={e => {
              if (e.target.value) onCambiarEstado(ticket.id, e.target.value as EstadoTicket);
            }}
          >
            <option value="">Mover a…</option>
            {estadosPermitidos.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function FilaTabla({ ticket, onClick }: { ticket: TicketFrontend; onClick: () => void }) {
  // 👈 LÓGICA DE VENCIMIENTO PARA LA TABLA
  const hoy = new Date().toISOString().split('T')[0];
  const esVencido = ticket.fechaVencimiento && ticket.fechaVencimiento < hoy && ticket.estado !== 'Terminado';

  return (
    <tr
      onClick={onClick}
      className="border-b cursor-pointer hover:bg-[var(--muted)] transition-colors"
      style={{ 
        borderColor: 'var(--border)',
        background: esVencido ? '#ef444405' : 'transparent' // Fondo super ligero rojo si está vencido
      }}
    >
      <td className="px-3 py-2.5">
        <span className="mono" style={{ fontSize: 11, color: 'var(--color-cyber-blue)', fontWeight: 500 }}>
          {ticket.id}
        </span>
      </td>
      <td className="px-3 py-2.5 max-w-[260px]">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: 'var(--foreground)' }} className="line-clamp-1">{ticket.titulo}</span>
          {esVencido && <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} title="Ticket vencido" />}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <PuntoPrioridad prioridad={ticket.prioridad} />
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{ticket.prioridad}</span>
        </div>
      </td>
      <td className="px-3 py-2.5"><BadgeEstado estado={ticket.estado} /></td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: ticket.asignado.color, fontSize: 8, color: '#fff', fontWeight: 700 }}
          >
            {ticket.asignado.iniciales}
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{ticket.asignado.nombre}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex gap-1 flex-wrap">
          {ticket.etiquetas.slice(0, 2).map(t => <EtiquetaChip key={t} label={t} />)}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span 
          style={{ 
            fontSize: 11, 
            color: esVencido ? '#ef4444' : 'var(--muted-foreground)', 
            fontWeight: esVencido ? 600 : 400 
          }} 
          className="mono"
        >
          {ticket.fechaVencimiento || 'N/A'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span
          className="inline-block w-5 h-5 rounded flex items-center justify-center"
          style={{ background: 'var(--muted)', fontSize: 10, color: 'var(--foreground)', fontWeight: 600 }}
        >
          {ticket.puntos}
        </span>
      </td>
    </tr>
  );
}

function PildoraFiltro({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded border transition-colors"
      style={{
        background: activo ? 'rgba(59,130,246,0.1)' : 'var(--muted)',
        borderColor: activo ? 'var(--color-cyber-blue)' : 'var(--border)',
        color: activo ? 'var(--color-cyber-blue)' : 'var(--muted-foreground)',
        fontSize: 11,
      }}
    >
      {children}
    </button>
  );
}

function PuntoColumna({ estado }: { estado: EstadoTicket }) {
  const colores: Record<EstadoTicket, string> = {
    'Backlog': '#6b7280',
    'En Progreso': '#3b82f6',
    'Revisión de Código': '#8b5cf6',
    'QA': '#f59e0b',
    'Terminado': '#10b981',
  };
  return <span className="w-2 h-2 rounded-full" style={{ background: colores[estado] }} />;
}

function VistaKanban({ tickets, onTicketSelect, usuario, onCambiarEstado }: {
  tickets: TicketFrontend[];
  onTicketSelect: (t: TicketFrontend) => void;
  usuario: Usuario;
  onCambiarEstado?: (id: string, estado: EstadoTicket) => void;
}) {
  return (
    <div className="flex gap-4 p-4 h-full" style={{ minWidth: 'max-content' }}>
      {COLUMNAS_ESTADO.map(col => {
        const colTickets = tickets.filter(t => t.estado === col);
        return (
          <div key={col} className="flex flex-col" style={{ width: 248, flexShrink: 0 }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <PuntoColumna estado={col} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{col}</span>
              </div>
              <span
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ fontSize: 10, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {colTickets.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
              {colTickets.map(t => (
                <TarjetaKanban
                  key={t.id}
                  ticket={t}
                  onClick={() => onTicketSelect(t)}
                  usuario={usuario}
                  onCambiarEstado={onCambiarEstado}
                />
              ))}
              {colTickets.length === 0 && (
                <div
                  className="flex items-center justify-center h-14 rounded-lg border border-dashed"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', fontSize: 11 }}
                >
                  Sin tickets
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VistaTabla({ tickets, onTicketSelect }: { tickets: TicketFrontend[]; onTicketSelect: (t: TicketFrontend) => void }) {
  return (
    <div className="overflow-auto h-full">
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="border-b sticky top-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {['ID', 'Título', 'Prioridad', 'Estado', 'Asignado', 'Etiquetas', 'Vencimiento', 'Pts'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <FilaTabla key={t.id} ticket={t} onClick={() => onTicketSelect(t)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export function TicketQueue({ onTicketSelect, usuario, onCargarTickets }: TicketQueueProps) {
  const [vista, setVista] = useState<'kanban' | 'tabla'>('kanban');
  const [filtroAsignadoAMi, setFiltroAsignadoAMi] = useState(false);
  const [filtroVencidos, setFiltroVencidos] = useState(false);
  const [filtroAltaPrioridad, setFiltroAltaPrioridad] = useState(false);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [tickets, setTickets] = useState<TicketFrontend[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarTickets = useCallback(async () => {
    try {
      setCargando(true);
      const res = await fetch('http://localhost:5000/api/tickets');
      if (!res.ok) throw new Error('Error en la red');
      const data = await res.json();
      setTickets(data.map(mapearTicketDBaFrontend));
    } catch (error) {
      console.error("Error al cargar tickets:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  useEffect(() => {
    if (onCargarTickets) onCargarTickets(cargarTickets);
  }, [onCargarTickets, cargarTickets]);

  const handleCambiarEstado = async (ticketIdFront: string, nuevoEstadoFront: EstadoTicket) => {
    const mapaEstadosInverso: Record<string, string> = {
      'Backlog': 'backlog',
      'En Progreso': 'en_progreso',
      'Revisión de Código': 'revision_codigo',
      'QA': 'qa',
      'Terminado': 'terminado'
    };
    const ticket = tickets.find(t => t.id === ticketIdFront);
    if (!ticket) return;
    try {
      setTickets(prev => prev.map(t =>
        t.id === ticketIdFront ? { ...t, estado: nuevoEstadoFront } : t
      ));
      await fetch(`http://localhost:5000/api/tickets/${ticket.dbId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_estado: mapaEstadosInverso[nuevoEstadoFront] })
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      cargarTickets();
    }
  };

  const hoy = new Date().toISOString().split('T')[0];
  let filtrados = tickets;
  if (filtroAltaPrioridad) filtrados = filtrados.filter(t => t.prioridad === 'Crítico' || t.prioridad === 'Alto');
  if (filtroVencidos) filtrados = filtrados.filter(t => t.fechaVencimiento && t.fechaVencimiento < hoy && t.estado !== 'Terminado');
  if (filtroAsignadoAMi) filtrados = filtrados.filter(t => t.asignado.nombre === usuario.nombre);
  if (filtroProyecto) filtrados = filtrados.filter(t => t.proyecto === filtroProyecto);

  const proyectos = [...new Set(tickets.map(t => t.proyecto))].filter(Boolean); // Filter Boolean previene vacíos

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Cargando tablero...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b flex-shrink-0 gap-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <PildoraFiltro activo={filtroAsignadoAMi} onClick={() => setFiltroAsignadoAMi(v => !v)}>
            <User size={11} /> Asignados a mí
          </PildoraFiltro>
          <PildoraFiltro activo={filtroVencidos} onClick={() => setFiltroVencidos(v => !v)}>
            <Clock size={11} /> Vencidos
          </PildoraFiltro>
          <PildoraFiltro activo={filtroAltaPrioridad} onClick={() => setFiltroAltaPrioridad(v => !v)}>
            <AlertCircle size={11} /> Alta Prioridad
          </PildoraFiltro>
          <div className="relative">
            <select
              value={filtroProyecto}
              onChange={e => setFiltroProyecto(e.target.value)}
              className="appearance-none flex items-center gap-1 px-2 py-1 rounded border cursor-pointer"
              style={{
                background: filtroProyecto ? 'rgba(59,130,246,0.1)' : 'var(--muted)',
                borderColor: filtroProyecto ? 'var(--color-cyber-blue)' : 'var(--border)',
                color: filtroProyecto ? 'var(--color-cyber-blue)' : 'var(--muted-foreground)',
                fontSize: 11,
                paddingRight: 20,
              }}
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
          </div>
        </div>
        <div
          className="flex items-center rounded border p-0.5 flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}
        >
          <button
            onClick={() => setVista('kanban')}
            className="px-2 py-1 rounded transition-colors flex items-center gap-1"
            style={{ background: vista === 'kanban' ? 'var(--card)' : 'transparent', color: vista === 'kanban' ? 'var(--foreground)' : 'var(--muted-foreground)', fontSize: 11 }}
          >
            <LayoutGrid size={12} /> Tablero
          </button>
          <button
            onClick={() => setVista('tabla')}
            className="px-2 py-1 rounded transition-colors flex items-center gap-1"
            style={{ background: vista === 'tabla' ? 'var(--card)' : 'transparent', color: vista === 'tabla' ? 'var(--foreground)' : 'var(--muted-foreground)', fontSize: 11 }}
          >
            <List size={12} /> Lista
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {vista === 'kanban' ? (
          <VistaKanban
            tickets={filtrados}
            onTicketSelect={onTicketSelect}
            usuario={usuario}
            onCambiarEstado={handleCambiarEstado}
          />
        ) : (
          <VistaTabla
            tickets={filtrados}
            onTicketSelect={onTicketSelect}
          />
        )}
      </div>
    </div>
  );
}