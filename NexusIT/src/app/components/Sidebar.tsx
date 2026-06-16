import { useState } from "react";
import {
  LayoutDashboard, Ticket, Map, Kanban, Settings,
  Plus, ChevronLeft, ChevronRight, Zap, ChevronsUpDown, LogOut, Circle,
} from "lucide-react";
import { type Usuario } from "./data";

export type VistaNav = 'inicio' | 'tickets' | 'cronograma' | 'sprint' | 'configuracion';

interface SidebarProps {
  vistaActiva: VistaNav;
  onNavegar: (vista: VistaNav) => void;
  onCrearTicket: () => void;
  colapsado: boolean;
  onToggle: () => void;
  usuario: Usuario;
  onCerrarSesion: () => void;
}

const NAV_ITEMS: { id: VistaNav; label: string; icon: React.ElementType; seccion: 'general' | 'gestion' }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard, seccion: 'general' },
  { id: 'tickets', label: 'Cola de Tickets', icon: Ticket, seccion: 'general' },
  { id: 'cronograma', label: 'Cronograma', icon: Map, seccion: 'gestion' },
];
const ESPACIOS = ['Acme Corp IT', 'Ingeniería de Plataforma'];

export function Sidebar({ vistaActiva, onNavegar, onCrearTicket, colapsado, onToggle, usuario, onCerrarSesion }: SidebarProps) {
  const [espacioOpen, setEspacioOpen] = useState(false);
  const [espacioActivo, setEspacioActivo] = useState(ESPACIOS[0]);

  const itemsGenerales = NAV_ITEMS.filter(i => i.seccion === 'general'); // Ya no necesitas el filtro extra
  const itemsGestion = NAV_ITEMS.filter(i => i.seccion === 'gestion');

  return (
    <aside
      className="flex flex-col h-full border-r transition-all duration-200"
      style={{
        width: colapsado ? 56 : 224,
        background: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
        flexShrink: 0,
      }}
    >
      {/* Logo + colapsar */}
      <div
        className="flex items-center justify-between px-3 border-b"
        style={{ height: 52, borderColor: 'var(--sidebar-border)' }}
      >
        {!colapsado ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                <Zap size={13} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--sidebar-foreground)' }}>NexusIT</span>
            </div>
            <button
              onClick={onToggle}
              className="rounded p-1 hover:bg-[var(--sidebar-accent)] transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <div
            className="w-7 h-7 rounded flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            <Zap size={13} color="#fff" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto py-3 gap-1">
        {/* Selector de espacio */}
        {!colapsado && (
          <div className="px-2 mb-1 relative">
            <button
              onClick={() => setEspacioOpen(v => !v)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-[var(--sidebar-accent)] transition-colors"
              style={{ fontSize: 11, color: 'var(--sidebar-foreground)' }}
            >
              <Circle size={7} style={{ color: 'var(--color-cyber-blue)', fill: 'var(--color-cyber-blue)', flexShrink: 0 }} />
              <span className="flex-1 truncate" style={{ fontWeight: 500 }}>{espacioActivo}</span>
              <ChevronsUpDown size={11} style={{ color: 'var(--muted-foreground)' }} />
            </button>
            {espacioOpen && (
              <div
                className="absolute left-2 right-2 top-10 rounded border shadow-lg z-50 py-1"
                style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}
              >
                {ESPACIOS.map(ws => (
                  <button
                    key={ws}
                    onClick={() => { setEspacioActivo(ws); setEspacioOpen(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--sidebar-accent)] transition-colors"
                    style={{ fontSize: 11, color: 'var(--sidebar-foreground)' }}
                  >
                    {ws}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botón crear ticket */}
        <div className="px-2 mb-2">
          {usuario.rol === 'admin' ? (
            <button
              onClick={onCrearTicket}
              className="flex items-center gap-2 rounded px-2 py-1.5 w-full transition-opacity hover:opacity-85"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                justifyContent: colapsado ? 'center' : 'flex-start',
              }}
            >
              <Plus size={13} />
              {!colapsado && <span>+ Crear Ticket</span>}
            </button>
          ) : (
            <div
              className="flex items-center gap-2 rounded px-2 py-1.5 w-full cursor-not-allowed"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                fontSize: 11,
                fontWeight: 500,
                justifyContent: colapsado ? 'center' : 'flex-start',
                opacity: 0.5,
              }}
              title="Solo el administrador puede crear tickets"
            >
              <Plus size={13} />
              {!colapsado && <span>+ Crear Ticket</span>}
            </div>
          )}
        </div>

        {/* General */}
        <SeccionNav label="General" colapsado={colapsado}>
          {itemsGenerales.map(item => (
            <ItemNav
              key={item.id}
              item={item}
              activo={vistaActiva === item.id}
              colapsado={colapsado}
              onClick={() => onNavegar(item.id)}
            />
          ))}
        </SeccionNav>

        {/* Gestión de Proyectos */}
        <SeccionNav label="Gestión" colapsado={colapsado}>
          {itemsGestion.map(item => (
            <ItemNav
              key={item.id}
              item={item}
              activo={vistaActiva === item.id}
              colapsado={colapsado}
              onClick={() => onNavegar(item.id)}
            />
          ))}
        </SeccionNav>
      </div>

      {/* Footer: configuración + usuario */}
      <div className="border-t py-2" style={{ borderColor: 'var(--sidebar-border)' }}>
        
        <div
          className="flex items-center gap-2 mx-1 px-2 py-2 mt-1 rounded group cursor-pointer hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: usuario.color, fontSize: 9, color: '#fff', fontWeight: 700 }}
          >
            {usuario.iniciales}
          </div>
          {!colapsado && (
            <>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sidebar-foreground)' }} className="truncate">
                  {usuario.nombre}
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted-foreground)' }} className="truncate">
                  {usuario.cargo}
                </div>
              </div>
              <button
                onClick={onCerrarSesion}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--muted)]"
                style={{ color: 'var(--muted-foreground)' }}
                title="Cerrar sesión"
              >
                <LogOut size={11} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expandir cuando colapsado */}
      {colapsado && (
        <button
          onClick={onToggle}
          className="mx-auto mb-2 rounded p-1 hover:bg-[var(--sidebar-accent)] transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronRight size={14} />
        </button>
      )}
    </aside>
  );
}

function SeccionNav({ label, colapsado, children }: { label: string; colapsado: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      {!colapsado && (
        <div
          className="px-3 mb-1"
          style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function ItemNav({
  item, activo, colapsado, onClick,
}: {
  item: { id: string; label: string; icon: React.ElementType };
  activo: boolean;
  colapsado: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={colapsado ? item.label : undefined}
      className="flex items-center gap-2.5 rounded transition-colors"
      style={{
        width: colapsado ? 40 : 'calc(100% - 8px)',
        margin: colapsado ? '0 auto' : '0 4px',
        padding: '6px 8px',
        background: activo ? 'var(--sidebar-accent)' : 'transparent',
        color: activo ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)',
        fontWeight: activo ? 600 : 400,
        fontSize: 12,
        justifyContent: colapsado ? 'center' : 'flex-start',
      }}
    >
      <Icon size={14} style={{ flexShrink: 0, color: activo ? 'var(--color-cyber-blue)' : 'inherit' }} />
      {!colapsado && <span className="truncate">{item.label}</span>}
    </button>
  );
}
