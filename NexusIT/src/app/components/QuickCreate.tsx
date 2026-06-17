import { useState, useEffect } from "react";
import { X, Plus, FolderPlus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { type Usuario } from "./data";
import { API_URL } from '../config';

interface QuickCreateProps {
  abierto: boolean;
  onCerrar: () => void;
  usuario: Usuario;
  onTicketCreado?: () => void;
}

const CATEGORIAS = ['Error', 'Software', 'Hardware', 'Acceso', 'Infraestructura'];
const PRIORIDADES = ['Crítico', 'Alto', 'Medio', 'Bajo'];

const mapaAsignado: Record<string, number> = {
  'Vladimir': 1, 'Christian': 2, 'Braulio': 3, 'Fernando': 4, 'Derek': 5,
};

const mapaPrioridad: Record<string, string> = {
  'Crítico': 'critica', 'Alto': 'alta', 'Medio': 'media', 'Bajo': 'baja',
};

export function QuickCreate({ abierto, onCerrar, usuario, onTicketCreado }: QuickCreateProps) {
  const [titulo, setTitulo] = useState('');
  const [prioridad, setPrioridad] = useState('Medio');
  const [categoria, setCategoria] = useState('Error');
  const [asignado, setAsignado] = useState('Sin asignar');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [proyectos, setProyectos] = useState<{ id: number; nombre: string }[]>([]);
  const [proyectoId, setProyectoId] = useState<number | null>(null);
  const [proyecto, setProyecto] = useState('');
  const [creandoProyecto, setCreandoProyecto] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState('');

  // Fechas: Hoy y un mes en el futuro
  const hoy = new Date().toISOString().split('T')[0];
  const unMesDespues = new Date();
  unMesDespues.setMonth(unMesDespues.getMonth() + 1);
  const maxFecha = unMesDespues.toISOString().split('T')[0];

  useEffect(() => {
    if (!abierto) return;
    fetch(`${API_URL}/proyectos`)
      .then(r => r.json())
      .then(data => {
        setProyectos(data); 
        if (data.length > 0) {
          setProyecto(data[0].nombre);
          setProyectoId(data[0].id);
        }
      })
      .catch(err => console.error('Error cargando proyectos:', err));
  }, [abierto]);

  const handleAgregarProyecto = async () => {
    const nombre = nuevoProyecto.trim();
    if (!nombre || proyectos.find(p => p.nombre === nombre)) {
      setCreandoProyecto(false);
      setNuevoProyecto('');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/proyectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, lider_id: Number(usuario.id) || 1 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const nuevo = { id: data.id, nombre }; 
      setProyectos(prev => [...prev, nuevo]);
      setProyecto(nombre);
      setProyectoId(data.id); 
      setNuevoProyecto('');
      setCreandoProyecto(false);
    } catch (error) {
      console.error('Error creando proyecto:', error);
      alert('No se pudo crear el proyecto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = `IT-${Date.now().toString().slice(-4)}`;

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          titulo,
          descripcion,
          prioridad: mapaPrioridad[prioridad],
          categoria,                  
          asignado_a: asignado === 'Sin asignar' ? null : (mapaAsignado[asignado] ?? null),
          creado_por: Number(usuario.id) || null,
          fecha_limite: fechaLimite || null,   
          proyecto_id: proyectoId,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTitulo('');
      setDescripcion('');
      setPrioridad('Medio');
      setCategoria('Error');
      setFechaLimite('');
      setProyecto(proyectos[0]?.nombre || '');
      setProyectoId(proyectos[0]?.id ?? null);
      setAsignado('Sin asignar');
      onCerrar();
      if (onTicketCreado) onTicketCreado();
    } catch (error) {
      console.error('Error creando ticket:', error);
      alert('No se pudo crear el ticket. Revisa la consola.');
    }
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={v => !v && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed z-50 rounded-xl border shadow-2xl"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 520, maxHeight: '85vh',
            background: 'var(--card)', borderColor: 'var(--border)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <Dialog.Title style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
              Crear Ticket
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded p-1.5 hover:bg-[var(--muted)] transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={14} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
            <div className="p-5 flex flex-col gap-4">

              {/* LÍMITE DE 30 CARACTERES EN EL TÍTULO */}
              <input
                autoFocus
                required
                maxLength={30}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Título del ticket… (máx. 30)"
                className="w-full rounded-lg border px-3 py-2.5"
                style={{
                  background: 'var(--muted)', borderColor: 'var(--border)',
                  fontSize: 14, fontWeight: 500, color: 'var(--foreground)', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-cyber-blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />

              {/* LÍMITE DE 150 CARACTERES EN LA DESCRIPCIÓN */}
              <textarea
                maxLength={150}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Descripción del problema… (máx. 150)"
                rows={3}
                className="w-full rounded-lg border px-3 py-2.5 resize-none"
                style={{
                  background: 'var(--muted)', borderColor: 'var(--border)',
                  fontSize: 13, color: 'var(--foreground)', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-cyber-blue)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Campo label="Prioridad">
                  <Selector value={prioridad} onChange={setPrioridad} opciones={PRIORIDADES} />
                </Campo>
                <Campo label="Categoría">
                  <Selector value={categoria} onChange={setCategoria} opciones={CATEGORIAS} />
                </Campo>

                <Campo label="Proyecto">
                  {creandoProyecto ? (
                    <div className="flex gap-1.5">
                      {/* LÍMITE DE 30 CARACTERES EN EL NUEVO PROYECTO */}
                      <input
                        autoFocus
                        maxLength={30}
                        value={nuevoProyecto}
                        onChange={e => setNuevoProyecto(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAgregarProyecto(); }
                          if (e.key === 'Escape') { setCreandoProyecto(false); setNuevoProyecto(''); }
                        }}
                        onBlur={handleAgregarProyecto}
                        placeholder="Nombre… (máx. 30)"
                        className="flex-1 rounded-lg border px-2 py-1.5"
                        style={{
                          background: 'var(--muted)', borderColor: 'var(--color-cyber-blue)',
                          fontSize: 12, color: 'var(--foreground)', outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); handleAgregarProyecto(); }}
                        className="px-2 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: 'var(--color-cyber-blue)', color: '#fff', fontSize: 11 }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault();
                          setCreandoProyecto(false);
                          setNuevoProyecto('');
                        }}
                        className="px-2 py-1.5 rounded-lg"
                        style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)', fontSize: 11, border: '1px solid' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <Selector
                        value={proyecto}
                        onChange={v => {
                          setProyecto(v);
                          const encontrado = proyectos.find(p => p.nombre === v);
                          setProyectoId(encontrado?.id ?? null);
                        }}
                        opciones={proyectos.map(p => p.nombre)}
                      />
                      <button
                        type="button"
                        onClick={() => setCreandoProyecto(true)}
                        title="Nuevo proyecto"
                        className="px-2 rounded-lg border transition-colors hover:bg-[var(--muted)]"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', flexShrink: 0 }}
                      >
                        <FolderPlus size={13} />
                      </button>
                    </div>
                  )}
                </Campo>

                <Campo label="Asignar a">
                  <Selector
                    value={asignado}
                    onChange={setAsignado}
                    opciones={['Sin asignar', 'Vladimir', 'Christian', 'Braulio', 'Fernando', 'Derek']}
                  />
                </Campo>

                <Campo label="Vencimiento">
                  {/* RANGO DE VENCIMIENTO: MÍNIMO HOY, MÁXIMO 1 MES */}
                  <input
                    type="date"
                    min={hoy}
                    max={maxFecha}
                    value={fechaLimite}
                    onChange={e => setFechaLimite(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 cursor-pointer"
                    style={{
                      background: 'var(--muted)', borderColor: 'var(--border)',
                      fontSize: 12, color: 'var(--foreground)', outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                </Campo>
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-3 px-5 py-4 border-t flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 rounded border transition-colors hover:bg-[var(--muted)]"
                style={{ fontSize: 13, borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600 }}
              >
                <Plus size={14} />
                Crear Ticket
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Selector({ value, onChange, opciones }: { value: string; onChange: (v: string) => void; opciones: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border px-3 py-2 cursor-pointer appearance-none"
      style={{ background: 'var(--muted)', borderColor: 'var(--border)', fontSize: 12, color: 'var(--foreground)', outline: 'none' }}
    >
      {opciones.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}