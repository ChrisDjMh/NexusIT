import { useState, useEffect } from "react";
import { CheckCircle2, Flame, Zap, ArrowRight, AlertTriangle } from "lucide-react";
import { type Usuario } from "./data";

type TicketFrontend = any; 

interface DashboardProps {
  onTicketSelect: (ticket: TicketFrontend) => void;
  onNavegar: (vista: string) => void;
  usuario: Usuario;
}

// 1. DICCIONARIO DE PORCENTAJES SEGÚN EL ESTADO DE LOS TICKETS
const PESO_ESTADO: Record<string, number> = {
  'backlog': 0,
  'en_progreso': 25,
  'revision_codigo': 50,
  'qa': 75,
  'terminado': 100
};

export function Dashboard({ onTicketSelect, onNavegar, usuario }: DashboardProps) {
  const [tickets, setTickets] = useState<TicketFrontend[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resTickets, resProyectos] = await Promise.all([
          fetch('http://localhost:5000/api/tickets'),
          fetch('http://localhost:5000/api/proyectos')
        ]);

        const dbTickets = await resTickets.json();
        const dbProyectos = await resProyectos.json();

        // Helpers de mapeo para los tickets
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

        const ticketsMapeados = dbTickets.map((t: any) => {
          const iniciales = t.asignado_nombre 
            ? t.asignado_nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            : 'NA';

          return {
            id: t.codigo || `IT-${t.id}`,
            dbId: t.id,
            titulo: t.titulo,
            descripcion: t.descripcion, // Se incluye la descripción corregida de base de datos
            estado: mapaEstados[t.estado] || 'Backlog',
            prioridad: mapaPrioridades[t.prioridad] || 'Medio',
            fechaVencimiento: t.fecha_limite ? t.fecha_limite.split('T')[0] : '',
            proyecto_id: t.proyecto_id, // Necesario para agrupar en el cálculo de abajo
            asignado: {
              nombre: t.asignado_nombre || 'Sin Asignar',
              iniciales: iniciales,
              color: colorPorIniciales(iniciales)
            },
            registros: [], 
            subtareas: { total: 0, completadas: 0 } 
          };
        });

        // 2. CÁLCULO DINÁMICO DE PROGRESO DE PROYECTOS PARA EL DASHBOARD
        const proyectosMapeados = dbProyectos.map((p: any) => {
          // Buscamos los tickets mapeados que corresponden a las fases de este proyecto
          const ticketsDelProyecto = dbTickets.filter((t: any) => t.proyecto_id === p.id);
          
          let progresoCalculado = 0;

          if (ticketsDelProyecto.length > 0) {
            const sumaProgreso = ticketsDelProyecto.reduce((acc: number, t: any) => {
              return acc + (PESO_ESTADO[t.estado] || 0);
            }, 0);
            progresoCalculado = Math.round(sumaProgreso / ticketsDelProyecto.length);
          } else {
            progresoCalculado = p.progreso || 0; 
          }

          return {
            id: p.id,
            nombre: p.nombre,
            lider: p.lider || 'Sin Asignar',
            fin: p.fecha_fin ? p.fecha_fin.split('T')[0] : 'N/A',
            progreso: progresoCalculado, // <-- El progreso ahora se actualiza solo aquí también
            color: p.color || '#3b82f6'
          };
        });

        setTickets(ticketsMapeados);
        setProyectos(proyectosMapeados);
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const hoy = new Date().toISOString().split('T')[0];

  // --- CÁLCULO DE KPIs ---
  const criticos = tickets.filter(t => t.prioridad === 'Crítico' && t.estado !== 'Terminado');
  const enProgreso = tickets.filter(t => t.estado === 'En Progreso');
  const resueltos = tickets.filter(t => t.estado === 'Terminado');
  const vencidos = tickets.filter(t => t.fechaVencimiento && t.fechaVencimiento < hoy && t.estado !== 'Terminado');

  const ticketsAltosPriority = tickets.filter(
    t => (t.prioridad === 'Crítico' || t.prioridad === 'Alto') && t.estado !== 'Terminado'
  );

  const actividadReciente = tickets.flatMap(t =>
    t.registros.map((r: any) => ({ ...r, ticketId: t.id, ticket: t }))
  ).slice(0, 6);

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center p-5" style={{ color: 'var(--muted-foreground)' }}>
        Cargando resumen del equipo...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Tarjetas KPI */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <TarjetaKPI
          icon={Flame}
          etiqueta="Crítico Abierto"
          valor={criticos.length}
          detalle="Requiere atención inmediata"
          color="#ef4444"
        />
        <TarjetaKPI
          icon={Zap}
          etiqueta="En Progreso"
          valor={enProgreso.length}
          detalle="Activos este sprint"
          color="var(--color-cyber-blue)"
        />
        <TarjetaKPI
          icon={CheckCircle2}
          etiqueta="Resueltos"
          valor={resueltos.length}
          detalle="Total completados"
          color="#10b981"
        />
        <TarjetaKPI
          icon={AlertTriangle}
          etiqueta="Vencidos"
          valor={vencidos.length}
          detalle="Pasaron la fecha límite"
          color="#f59e0b"
        />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        {/* Prioridad Crítica y Alta */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-5 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
              Prioridad Crítica y Alta
            </h3>
            <button
              onClick={() => onNavegar('tickets')}
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ fontSize: 11, color: 'var(--color-cyber-blue)' }}
            >
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          <div>
            {ticketsAltosPriority.slice(0, 5).map((t, i, arr) => (
              <button
                key={t.id}
                onClick={() => onTicketSelect(t)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--muted)] transition-colors text-left"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: t.prioridad === 'Crítico' ? '#ef4444' : '#f97316' }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, color: 'var(--foreground)' }} className="truncate">{t.titulo}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="mono" style={{ fontSize: 10, color: 'var(--color-cyber-blue)' }}>{t.id}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{t.estado}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Vence: {t.fechaVencimiento || 'N/A'}</span>
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.asignado.color, fontSize: 9, color: '#fff', fontWeight: 700 }}
                  title={t.asignado.nombre}
                >
                  {t.asignado.iniciales}
                </div>
              </button>
            ))}
            {ticketsAltosPriority.length === 0 && (
              <div className="p-5 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                No hay tickets críticos o altos activos.
              </div>
            )}
          </div>
        </div>

        {/* Proyectos activos */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-5 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
              Proyectos Activos
            </h3>
            <button
              onClick={() => onNavegar('cronograma')}
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ fontSize: 11, color: 'var(--color-cyber-blue)' }}
            >
              Cronograma <ArrowRight size={11} />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {proyectos.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{p.nombre}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{p.progreso}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${p.progreso}%`, background: p.color }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{p.lider}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Fin: {p.fin}</span>
                </div>
              </div>
            ))}
            {proyectos.length === 0 && (
              <div className="text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                No hay proyectos registrados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Actividad Reciente</h3>
        </div>
        <div>
          {actividadReciente.map((log, i, arr) => (
            <button
              key={log.id}
              onClick={() => onTicketSelect(log.ticket)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--muted)] transition-colors text-left"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: colorPorIniciales(log.iniciales), fontSize: 9, color: '#fff', fontWeight: 700 }}
              >
                {log.iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: 12, color: 'var(--foreground)' }}>
                  <span style={{ fontWeight: 600 }}>{log.usuario}</span>
                  {' '}
                  {accionEtiqueta(log.tipo)}
                  {' · '}
                  <span className="mono" style={{ color: 'var(--color-cyber-blue)', fontSize: 11 }}>{log.ticketId}</span>
                </span>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }} className="truncate">
                  {log.accion.replace(/\*\*/g, '')}
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0 }}>{log.tiempo}</span>
            </button>
          ))}
          {actividadReciente.length === 0 && (
            <div className="p-5 text-center" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              No hay actividad reciente registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaKPI({
  icon: Icon, etiqueta, valor, detalle, color,
}: {
  icon: React.ElementType;
  etiqueta: string;
  valor: number;
  detalle: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>{valor}</div>
        <div style={{ fontSize: 12, color: 'var(--foreground)', marginTop: 4 }}>{etiqueta}</div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{detalle}</div>
      </div>
    </div>
  );
}

function colorPorIniciales(iniciales: string) {
  const mapa: Record<string, string> = {
    VL: '#3b82f6', CH: '#8b5cf6', BR: '#10b981', FE: '#f59e0b', DK: '#ef4444',
  };
  return mapa[iniciales] || '#6b7280';
}

function accionEtiqueta(tipo: string) {
  const mapa: Record<string, string> = {
    comentario: 'comentó en',
    estado: 'cambió el estado de',
    asignacion: 'fue asignado a',
    commit: 'vinculó un commit a',
  };
  return mapa[tipo] || 'actualizó';
}