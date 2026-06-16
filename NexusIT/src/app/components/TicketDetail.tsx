import { useState, useEffect } from "react";
import {
  X, MessageSquare, GitCommit, ArrowRightLeft, UserCheck,
  Calendar, Layers, Link2, ChevronDown, Tag, Lock,
} from "lucide-react";
import {
  type Ticket, type EstadoTicket, type Prioridad,
  COLORES_PRIORIDAD, COLUMNAS_ESTADO, ESTADO_INGENIERO_PERMITIDO,
  EQUIPO, type Usuario,
} from "./data";
// 1. CORREGIDO: Importación de la constante global API_URL desde la configuración común
import { API_URL } from '../config';

type TicketFrontend = Ticket & { dbId?: number };

interface TicketDetailProps {
  ticket: TicketFrontend;
  onClose: () => void;
  usuario: Usuario;
  onTicketUpdated?: () => void; 
}

const PRIORIDADES: Prioridad[] = ['Crítico', 'Alto', 'Medio', 'Bajo'];

const mapaEstadosInverso: Record<string, string> = {
  'Backlog': 'backlog',
  'En Progreso': 'en_progreso',
  'Revisión de Código': 'revision_codigo',
  'QA': 'qa',
  'Terminado': 'terminado'
};

const mapaPrioridadInverso: Record<string, string> = {
  'Crítico': 'critica',
  'Alto': 'alta',
  'Medio': 'media',
  'Bajo': 'baja'
};

function IconoActividad({ tipo }: { tipo: string }) {
  const iconos: Record<string, React.ElementType> = {
    comentario: MessageSquare,
    estado: ArrowRightLeft,
    asignacion: UserCheck,
    commit: GitCommit,
  };
  const Icon = iconos[tipo] || MessageSquare;
  const colores: Record<string, string> = {
    comentario: 'var(--color-cyber-blue)',
    estado: 'var(--color-purple)',
    asignacion: '#10b981',
    commit: '#f59e0b',
  };
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: `${colores[tipo]}20`, border: `1px solid ${colores[tipo]}40` }}
    >
      <Icon size={11} style={{ color: colores[tipo] }} />
    </div>
  );
}

export function TicketDetail({ ticket, onClose, usuario, onTicketUpdated }: TicketDetailProps) {
  const [estado, setEstado] = useState<EstadoTicket>(ticket.estado);
  const [prioridad, setPrioridad] = useState<Prioridad>(ticket.prioridad);
  const [asignado, setAsignado] = useState(ticket.asignado.nombre);
  const [comentario, setComentario] = useState('');
  const [registros, setRegistros] = useState(ticket.registros || []);

  useEffect(() => {
    setEstado(ticket.estado);
    setPrioridad(ticket.prioridad);
    setAsignado(ticket.asignado.nombre);
    setRegistros(ticket.registros || []);
    setComentario(''); 
  }, [ticket]);

  const esAdmin = usuario.rol === 'admin';
  const esAsignado = ticket.asignado.nombre === usuario.nombre;
  const puedeEditar = esAdmin || esAsignado;

  const estadosDisponibles: EstadoTicket[] = esAdmin
    ? COLUMNAS_ESTADO
    : [estado, ...(ESTADO_INGENIERO_PERMITIDO[estado] || [])].filter(
        (v, i, arr) => arr.indexOf(v) === i  
      );

  const progresoPct = ticket.subtareas?.total > 0
    ? Math.round((ticket.subtareas.completadas / ticket.subtareas.total) * 100)
    : 0;

  // --- FUNCIONES API ---

  const cambiarEstadoBD = async (nuevoEstado: string) => {
    const estadoFront = nuevoEstado as EstadoTicket;
    setEstado(estadoFront); 

    if (!ticket.dbId) return; 

    try {
      // 2. CORREGIDO: Se reemplazó la URL fija por `${API_URL}`
      await fetch(`${API_URL}/tickets/${ticket.dbId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_estado: mapaEstadosInverso[estadoFront] })
      });
      if (onTicketUpdated) onTicketUpdated();
    } catch (error) {
      console.error("Error al guardar estado:", error);
    }
  };

  const cambiarPrioridadBD = async (nuevaPrioridad: string) => {
    const prioridadFront = nuevaPrioridad as Prioridad;
    setPrioridad(prioridadFront); 

    if (!ticket.dbId) return;

    try {
      // 3. CORREGIDO: Se reemplazó la URL fija por `${API_URL}`
      await fetch(`${API_URL}/tickets/${ticket.dbId}/prioridad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva_prioridad: mapaPrioridadInverso[prioridadFront] })
      });
      if (onTicketUpdated) onTicketUpdated(); 
    } catch (error) {
      console.error("Error al guardar prioridad:", error);
    }
  };

  const cambiarAsignadoBD = async (nuevoAsignado: string) => {
    setAsignado(nuevoAsignado);

    if (!ticket.dbId) return;

    const usuarioSeleccionado = EQUIPO.find(u => u.nombre === nuevoAsignado);
    
    console.log('Buscando:', nuevoAsignado);
    console.log('EQUIPO:', EQUIPO);
    console.log('Encontrado:', usuarioSeleccionado);

    if (!usuarioSeleccionado) {
      console.error(`Usuario "${nuevoAsignado}" no encontrado en EQUIPO`);
      return;
    }

    try {
      // 4. CORREGIDO: Se reemplazó la URL fija por `${API_URL}`
      const res = await fetch(`${API_URL}/tickets/${ticket.dbId}/asignado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevo_asignado_id: Number(usuarioSeleccionado.id) })
      });
      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      if (onTicketUpdated) onTicketUpdated();
    } catch (error) {
      console.error("Error al guardar asignado:", error);
    }
  };

  const agregarComentario = () => {
    if (!comentario.trim()) return;
    
    setRegistros(prev => [{
      id: Date.now().toString(),
      usuario: usuario.nombre,
      iniciales: usuario.iniciales,
      accion: comentario,
      tiempo: 'ahora mismo',
      tipo: 'comentario' as const,
    }, ...prev]);
    
    setComentario('');
  };

  return (
    <div className="flex flex-col h-full border-l" style={{ background: 'var(--card)', borderColor: 'var(--border)', width: '100%' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="mono px-2 py-0.5 rounded"
            style={{ fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.12)', color: 'var(--color-cyber-blue)' }}
          >
            {ticket.id}
          </span>
          <span
            className="px-2 py-0.5 rounded"
            style={{
              fontSize: 10,
              background: `${COLORES_PRIORIDAD[prioridad]}18`,
              color: COLORES_PRIORIDAD[prioridad],
              fontWeight: 600,
            }}
          >
            {prioridad}
          </span>
          {puedeEditar ? (
            <SelectorMeta
              value={estado}
              options={estadosDisponibles}
              onChange={cambiarEstadoBD}
            />
          ) : (
            <span>{estado}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 hover:bg-[var(--muted)] transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Izquierda */}
        <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-1 overflow-y-auto p-5">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4, marginBottom: 16 }}>
              {ticket.titulo}
            </h2>

            {/* Descripción */}
            <div
              className="rounded-lg p-4 mb-5"
              style={{ background: 'var(--muted)', fontSize: 12, color: 'var(--foreground)', lineHeight: 1.7 }}
            >
              {(ticket.descripcion || "Sin descripción").split('\n').map((linea, i) => {
                if (linea.startsWith('**') && linea.endsWith('**')) {
                  // 5. CORREGIDO: Expresión regular arreglada a /\*\*/g para evitar fallos de compilación
                  return <p key={i} style={{ fontWeight: 700, marginTop: 8 }}>{linea.replace(/\*\*/g, '')}</p>;
                }
                if (/^\d\. /.test(linea)) {
                  return <p key={i} style={{ paddingLeft: 12 }}>{linea}</p>;
                }
                return <p key={i} style={{ marginTop: linea === '' ? 8 : 0 }}>{linea || ' '}</p>;
              })}
            </div>

            {/* Subtareas */}
            {ticket.subtareas?.total > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>Subtareas</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {ticket.subtareas.completadas} / {ticket.subtareas.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progresoPct}%`, background: 'var(--color-cyber-blue)' }} />
                </div>
              </div>
            )}

            {/* Actividad */}
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>
                Actividad
              </h3>

              <div className="flex gap-2.5 mb-4">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: usuario.color || '#3b82f6', fontSize: 9, color: '#fff', fontWeight: 700 }}
                >
                  {usuario.iniciales}
                </div>
                <div className="flex-1">
                  <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    placeholder="Añadir un comentario…"
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 resize-none"
                    style={{
                      background: 'var(--muted)',
                      borderColor: 'var(--border)',
                      fontSize: 12,
                      color: 'var(--foreground)',
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--color-cyber-blue)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  {comentario && (
                    <button
                      onClick={agregarComentario}
                      className="mt-1.5 px-3 py-1 rounded transition-colors"
                      style={{ background: 'var(--color-cyber-blue)', color: '#fff', fontSize: 11, fontWeight: 500 }}
                    >
                      Comentar
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {registros.map(log => (
                  <div key={log.id} className="flex gap-2.5">
                    <IconoActividad tipo={log.tipo} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{log.usuario}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{log.tiempo}</span>
                      </div>
                      <p
                        style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2, lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{
                          __html: log.accion
                            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--foreground)">$1</strong>')
                            .replace(/`(.*?)`/g, '<code class="mono" style="background:var(--muted);padding:1px 4px;border-radius:3px;font-size:10px;color:var(--color-cyber-blue)">$1</code>'),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Derecha */}
        <div className="overflow-y-auto p-5 flex-shrink-0" style={{ width: 204 }}>
          <h3
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}
          >
            Detalles
          </h3>

          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>Estado</span>
            {puedeEditar ? (
              <SelectorMeta
                value={estado}
                options={estadosDisponibles}
                onChange={cambiarEstadoBD}
              />
            ) : (
              <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{estado}</span>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>Prioridad</span>
            {esAdmin ? (
              <SelectorMeta
                value={prioridad}
                options={PRIORIDADES}
                onChange={cambiarPrioridadBD}
                colorMap={COLORES_PRIORIDAD as Record<string, string>}
              />
            ) : (
              <span style={{ fontSize: 11, color: COLORES_PRIORIDAD[prioridad], fontWeight: 600 }}>{prioridad}</span>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>Asignado</span>
            {esAdmin ? (
              <SelectorMeta
                value={asignado}
                options={EQUIPO.map(u => u.nombre)}
                onChange={cambiarAsignadoBD}
              />
            ) : (
              <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{asignado}</span>
            )}
          </div>

          <FilaMeta icon={Layers} etiqueta="Puntos" valor={`${ticket.puntos || 0} SP`} />
          <FilaMeta icon={Tag} etiqueta="Categoría" valor={ticket.categoria || 'N/A'} />
          <FilaMeta icon={Link2} etiqueta="Proyecto" valor={ticket.proyecto || 'N/A'} truncar />
          <FilaMeta icon={Calendar} etiqueta="Vencimiento" valor={ticket.fechaVencimiento || 'N/A'} mono />
          <FilaMeta icon={Calendar} etiqueta="Creado" valor={ticket.fechaCreacion || 'N/A'} mono />

          <div className="pt-3">
            <h3
              style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}
            >
              Etiquetas
            </h3>
            <div className="flex flex-wrap gap-1">
              {(ticket.etiquetas || []).map(t => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded border"
                  style={{ fontSize: 10, color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div
            className="mt-4 p-3 rounded-lg"
            style={{ background: esAdmin ? 'rgba(59,130,246,0.08)' : 'rgba(107,114,128,0.08)', borderRadius: 8 }}
          >
            <p style={{ fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              {esAdmin
                ? '🔑 Tienes acceso completo como Administrador.'
                : esAsignado
                  ? '✏️ Puedes cambiar estado y comentar.'
                  : '👁️ Solo puedes ver y comentar.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectorMeta({
  value, options, onChange, colorMap,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-2 pr-5 py-0.5 rounded border cursor-pointer"
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: colorMap ? (colorMap[value] || 'var(--foreground)') : 'var(--foreground)',
          background: 'var(--muted)',
          borderColor: 'var(--border)',
          maxWidth: 120,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={9} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
    </div>
  );
}

function FilaMeta({
  icon: Icon, etiqueta, valor, truncar, mono,
}: {
  icon: React.ElementType;
  etiqueta: string;
  valor: string;
  truncar?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>{etiqueta}</span>
      <span
        className={`${truncar ? 'max-w-[90px] truncate' : ''} ${mono ? 'mono' : ''}`}
        style={{ fontSize: 11, color: 'var(--foreground)', textAlign: 'right' }}
        title={valor}
      >
        {valor}
      </span>
    </div>
  );
}