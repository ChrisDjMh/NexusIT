import { useState, useEffect } from "react";
// 1. CORREGIDO: Importación correcta de la API_URL desde la carpeta de configuración superior
import { API_URL } from '../config';

const INICIO_TIMELINE = new Date('2026-05-01');
const FIN_TIMELINE = new Date('2026-09-01');
const TOTAL_DIAS = (FIN_TIMELINE.getTime() - INICIO_TIMELINE.getTime()) / 86400000;

function offsetDias(fechaStr: string) {
  const d = new Date(fechaStr);
  return Math.max(0, (d.getTime() - INICIO_TIMELINE.getTime()) / 86400000);
}

function pct(offset: number) {
  return (offset / TOTAL_DIAS) * 100;
}

const MESES = ['Mayo', 'Jun', 'Jul', 'Ago'];
const OFFSETS_MESES = [0, 31, 61, 92];

const PESO_ESTADO: Record<string, number> = {
  'backlog': 0,
  'en_progreso': 25,
  'revision_codigo': 50,
  'qa': 75,
  'terminado': 100
};

export function Roadmap() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [equipo, setEquipo] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const contarTicketsActivos = (nombre: string) => {
    return tickets.filter(t => t.asignado_nombre === nombre && t.estado !== 'terminado').length;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 2. CORREGIDO: URLs estáticas sustituidas por la variable centralizada `${API_URL}`
        const [resProyectos, resEquipo, resTickets] = await Promise.all([
          fetch(`${API_URL}/proyectos`),
          fetch(`${API_URL}/usuarios`),
          fetch(`${API_URL}/tickets`)
        ]);

        const dataProyectos = await resProyectos.json();
        const dataEquipo = await resEquipo.json();
        const dataTickets = await resTickets.json();

        console.log("=== DATOS DESDE EL BACKEND ===");
        console.log("Proyectos brutos:", dataProyectos);

        const proyectosMapeados = dataProyectos.map((p: any) => {
          const ticketsDelProyecto = dataTickets.filter((t: any) => t.proyecto_id === p.id);
          
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
            ...p,
            color: p.color || '#3b82f6',
            hitos: p.hitos || [], 
            fecha_inicio: p.fecha_inicio || '2026-05-01', 
            fecha_fin: p.fecha_fin || '2026-08-31',
            progreso: progresoCalculado 
          };
        });

        const equipoMapeado = dataEquipo.map((u: any) => ({
          ...u,
          iniciales: u.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          color: u.color || '#8b5cf6',
          cargo: u.puesto
        }));

        setProyectos(proyectosMapeados);
        setEquipo(equipoMapeado);
        setTickets(dataTickets);
      } catch (error) {
        console.error("Error cargando el roadmap:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const offsetHoy = offsetDias(new Date().toISOString().split('T')[0]); 

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center p-5 text-sm text-gray-500">
        Cargando cronograma y equipo...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-5 space-y-6">
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Cronograma de Proyectos</h3>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Mayo – Agosto 2026</p>
          </div>
          <span
            className="px-2 py-0.5 rounded"
            style={{ fontSize: 10, background: 'rgba(59,130,246,0.12)', color: 'var(--color-cyber-blue)', fontWeight: 500 }}
          >
            Q2–Q3
          </span>
        </div>

        <div className="px-5 pb-5 pt-3">
          <div className="flex mb-4 relative" style={{ marginLeft: 168 }}>
            {MESES.map((m, i) => (
              <div
                key={m}
                className="absolute"
                style={{
                  left: `${pct(OFFSETS_MESES[i])}%`,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {m}
              </div>
            ))}
            <div style={{ height: 20 }} />
          </div>

          <div className="flex flex-col gap-3">
            {proyectos.map(p => (
              <div key={p.id} className="flex items-center gap-4">
                <div style={{ width: 168, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }} className="truncate">
                    {p.nombre}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Líder: {p.lider || 'Sin Asignar'}</div>
                </div>

                <div className="flex-1 relative" style={{ height: 28 }}>
                  {OFFSETS_MESES.map((mo, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l"
                      style={{ left: `${pct(mo)}%`, borderColor: 'var(--border)' }}
                    />
                  ))}

                  <div
                    className="absolute top-0 bottom-0 border-l-2 z-10"
                    style={{ left: `${pct(offsetHoy)}%`, borderColor: '#ef4444', opacity: 0.7 }}
                  >
                    <div
                      className="absolute -top-1 -translate-x-1/2 px-1 rounded"
                      style={{ fontSize: 9, background: '#ef4444', color: '#fff', whiteSpace: 'nowrap' }}
                    >
                      Hoy
                    </div>
                  </div>

                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${pct(offsetDias(p.fecha_inicio))}%`,
                      right: `${100 - pct(offsetDias(p.fecha_fin))}%`,
                      background: `${p.color}18`,
                    }}
                  />

                  <div
                    className="absolute inset-y-1 rounded-full"
                    style={{
                      left: `${pct(offsetDias(p.fecha_inicio))}%`,
                      width: `${(pct(offsetDias(p.fecha_fin)) - pct(offsetDias(p.fecha_inicio))) * p.progreso / 100}%`,
                      background: p.color,
                      opacity: 0.85,
                    }}
                  />

                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-2"
                    style={{ fontSize: 9, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}
                  >
                    {p.progreso}%
                  </div>

                  {p.hitos.map((h: any) => (
                    <div
                      key={h.nombre}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                      style={{ left: `${pct(offsetDias(h.fecha))}%`, zIndex: 20 }}
                    >
                      <div className="w-3 h-3 rotate-45 border-2" style={{ background: p.color, borderColor: p.color }} />
                      <div
                        className="absolute -top-6 -translate-x-1/2 left-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded whitespace-nowrap z-30"
                        style={{ background: 'var(--popover)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--foreground)' }}
                      >
                        {h.nombre}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Carga del Equipo</h3>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Tickets activos por ingeniero</p>
        </div>
        <div className="p-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {equipo.map(dev => {
            const cantidad = contarTicketsActivos(dev.nombre);
            const maxCarga = 4;
            const porcentaje = Math.min((cantidad / maxCarga) * 100, 100);
            const sobrecargado = cantidad >= maxCarga;
            return (
              <div key={dev.id} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: dev.color, fontSize: 10, color: '#fff', fontWeight: 700 }}
                >
                  {dev.iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--foreground)' }}>{dev.nombre}</span>
                    <span style={{ fontSize: 10, color: sobrecargado ? '#ef4444' : 'var(--muted-foreground)' }}>
                      {cantidad}/{maxCarga}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${porcentaje}%`, background: sobrecargado ? '#ef4444' : dev.color }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{dev.cargo}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}