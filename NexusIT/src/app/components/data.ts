export type Prioridad = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
export type EstadoTicket = 'Backlog' | 'En Progreso' | 'Revisión de Código' | 'QA' | 'Terminado';
export type CategoriaTicket = 'Hardware' | 'Software' | 'Acceso' | 'Error' | 'Infraestructura';
export type RolUsuario = 'admin' | 'ingeniero';

export interface Usuario {
  id: string;
  nombre: string;
  iniciales: string;
  rol: RolUsuario;
  cargo: string;
  color: string;
  email: string;
}

// ========================================================
// 🚨 CORREOS CORREGIDOS PARA ENCAJAR CON TU BASE DE DATOS
// ========================================================
export const EQUIPO: Usuario[] = [
  { 
    id: '1', 
    nombre: 'Vladimir',  
    iniciales: 'VL', 
    rol: 'admin',    
    cargo: 'Gestor de Proyectos',  
    color: '#3b82f6', 
    email: 'vladimir@empresa.com' // 👈 Sincronizado con MySQL
  },
  { 
    id: '2', 
    nombre: 'Christian', 
    iniciales: 'CH', 
    rol: 'ingeniero', 
    cargo: 'Ing. de Front-End',       
    color: '#8b5cf6', 
    email: 'christian@empresa.com' // 👈 Sincronizado con MySQL
  },
  { 
    id: '3', 
    nombre: 'Braulio',   
    iniciales: 'BR', 
    rol: 'ingeniero', 
    cargo: 'Ing. de Base de Datos',   
    color: '#10b981', 
    email: 'braulio@empresa.com' // 👈 Sincronizado con MySQL
  },
  { 
    id: '4', 
    nombre: 'Fernando',  
    iniciales: 'FE', 
    rol: 'ingeniero', 
    cargo: 'Back-End',        
    color: '#f59e0b', 
    email: 'fernando@empresa.com' // 👈 Sincronizado con MySQL
  },
  { 
    id: '5', 
    nombre: 'Derek',     
    iniciales: 'DK', 
    rol: 'ingeniero', 
    cargo: 'QA',          
    color: '#ef4444', 
    email: 'derek@empresa.com' // 👈 Sincronizado con MySQL
  },
];

export interface RegistroActividad {
  id: string;
  usuario: string;
  iniciales: string;
  accion: string;
  tiempo: string;
  tipo: 'comentario' | 'estado' | 'asignacion' | 'commit';
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoTicket;
  asignado: { nombre: string; iniciales: string; color: string };
  reportador: { nombre: string; iniciales: string };
  etiquetas: string[];
  categoria: CategoriaTicket;
  puntos: number;
  comentarios: number;
  subtareas: { total: number; completadas: number };
  proyecto: string;
  fechaVencimiento: string;
  fechaCreacion: string;
  registros: RegistroActividad[];
}

export interface Proyecto {
  id: string;
  nombre: string;
  lider: string;
  inicio: string;
  fin: string;
  progreso: number;
  color: string;
  hitos: { nombre: string; fecha: string }[];
}

export const TICKETS: Ticket[] = [
  {
    id: 'IT-404',
    titulo: 'Permisos de bucket S3 mal configurados en producción',
    descripcion: 'Los buckets S3 de producción tienen políticas IAM demasiado permisivas que permiten lectura pública en activos sensibles. Necesita corrección inmediata antes de la auditoría de seguridad del 20 de junio.\n\n**Pasos para reproducir:**\n1. Navega a la consola S3 → bucket `prod-assets-v2`\n2. Verifica la política del bucket — `"Principal": "*"` en `GetObject`\n3. Confirma con: `aws s3api get-bucket-policy --bucket prod-assets-v2`\n\n**Esperado:** Solo usuarios autenticados con permiso `s3:GetObject`.\n**Actual:** Lectura pública sin autenticación.',
    prioridad: 'Crítico',
    estado: 'En Progreso',
    asignado: { nombre: 'Fernando', iniciales: 'FE', color: '#f59e0b' },
    reportador: { nombre: 'Vladimir', iniciales: 'VL' },
    etiquetas: ['AWS', 'Seguridad', 'Node.js'],
    categoria: 'Infraestructura',
    puntos: 8,
    comentarios: 12,
    subtareas: { total: 4, completadas: 2 },
    proyecto: 'Infraestructura Q3',
    fechaVencimiento: '2026-06-20',
    fechaCreacion: '2026-06-10',
    registros: [
      { id: 'l1', usuario: 'Fernando', iniciales: 'FE', accion: 'Cambió estado a **En Progreso**', tiempo: 'hace 2h', tipo: 'estado' },
      { id: 'l2', usuario: 'Christian', iniciales: 'CH', accion: 'Vinculó commit `fix/s3-bucket-policy` → `a3f91c2`', tiempo: 'hace 3h', tipo: 'commit' },
      { id: 'l3', usuario: 'Vladimir', iniciales: 'VL', accion: 'Revisé las políticas IAM. El principal comodín en prod-assets-v2 es el problema principal. Recomiendo cambiar a ARNs de roles específicos.', tiempo: 'hace 5h', tipo: 'comentario' },
      { id: 'l4', usuario: 'Vladimir', iniciales: 'VL', accion: 'Asignado a **Fernando**', tiempo: 'hace 6h', tipo: 'asignacion' },
    ],
  },
  {
    id: 'IT-401',
    titulo: 'Dashboard React falla en Safari 17 con serialización BigInt',
    descripcion: 'El dashboard de analíticas lanza una excepción no controlada en Safari 17.4+ al cargar datos del gráfico con valores BigInt de la API de telemetría. Chrome y Firefox no se ven afectados.',
    prioridad: 'Alto',
    estado: 'Revisión de Código',
    asignado: { nombre: 'Christian', iniciales: 'CH', color: '#8b5cf6' },
    reportador: { nombre: 'Derek', iniciales: 'DK' },
    etiquetas: ['React', 'Safari', 'Error'],
    categoria: 'Error',
    puntos: 5,
    comentarios: 7,
    subtareas: { total: 2, completadas: 2 },
    proyecto: 'Portal v3.2',
    fechaVencimiento: '2026-06-18',
    fechaCreacion: '2026-06-08',
    registros: [
      { id: 'l1', usuario: 'Christian', iniciales: 'CH', accion: 'Abrió PR #892 para revisión', tiempo: 'hace 1h', tipo: 'commit' },
      { id: 'l2', usuario: 'Derek', iniciales: 'DK', accion: 'Corregido reemplazando BigInt con `Number()` en `useMetrics.ts:114`. Se añadió replacer para JSON.stringify.', tiempo: 'hace 4h', tipo: 'comentario' },
    ],
  },
  {
    id: 'IT-398',
    titulo: 'Configurar clúster Redis para capa de caché de sesiones',
    descripcion: 'Provisionar y configurar un clúster Redis de 3 nodos en AWS ElastiCache para la nueva capa de caché de sesiones. Esto está bloqueando la migración de Auth v2.',
    prioridad: 'Alto',
    estado: 'En Progreso',
    asignado: { nombre: 'Braulio', iniciales: 'BR', color: '#10b981' },
    reportador: { nombre: 'Vladimir', iniciales: 'VL' },
    etiquetas: ['Redis', 'SQL', 'API'],
    categoria: 'Infraestructura',
    puntos: 13,
    comentarios: 4,
    subtareas: { total: 5, completadas: 3 },
    proyecto: 'Migración Auth v2',
    fechaVencimiento: '2026-06-25',
    fechaCreacion: '2026-06-05',
    registros: [
      { id: 'l1', usuario: 'Braulio', iniciales: 'BR', accion: 'Clúster provisionado en staging. Ejecutando benchmarks ahora.', tiempo: 'hace 1d', tipo: 'comentario' },
    ],
  },
  {
    id: 'IT-395',
    titulo: 'Acceso VPN para nuevo equipo de contratistas (5 accesos)',
    descripcion: 'Provisionar asientos Tailscale y políticas de acceso para el nuevo equipo de contratistas UX que inicia el 16 de junio. Solo necesitan acceso a entornos de staging y diseño.',
    prioridad: 'Medio',
    estado: 'QA',
    asignado: { nombre: 'Derek', iniciales: 'DK', color: '#ef4444' },
    reportador: { nombre: 'Vladimir', iniciales: 'VL' },
    etiquetas: ['VPN', 'Acceso'],
    categoria: 'Acceso',
    puntos: 3,
    comentarios: 2,
    subtareas: { total: 3, completadas: 3 },
    proyecto: 'Operaciones IT Q2',
    fechaVencimiento: '2026-06-15',
    fechaCreacion: '2026-06-09',
    registros: [
      { id: 'l1', usuario: 'Derek', iniciales: 'DK', accion: 'Cambió estado a **QA**', tiempo: 'hace 2d', tipo: 'estado' },
    ],
  },
  {
    id: 'IT-390',
    titulo: 'MacBook Pro con throttling térmico — lote piso de ingeniería',
    descripcion: 'Varios MacBook Pro 16" (M3 Max) en el piso de ingeniería están haciendo throttling bajo cargas de compilación sostenidas. Ventiladores al máximo. Posible acumulación de polvo o degradación de pasta térmica.',
    prioridad: 'Medio',
    estado: 'Backlog',
    asignado: { nombre: 'Christian', iniciales: 'CH', color: '#8b5cf6' },
    reportador: { nombre: 'Derek', iniciales: 'DK' },
    etiquetas: ['Hardware'],
    categoria: 'Hardware',
    puntos: 2,
    comentarios: 3,
    subtareas: { total: 1, completadas: 0 },
    proyecto: 'Operaciones IT Q2',
    fechaVencimiento: '2026-07-01',
    fechaCreacion: '2026-06-07',
    registros: [],
  },
  {
    id: 'IT-385',
    titulo: 'Pipeline CI de GitHub Actions con timeout en builds matriciales',
    descripcion: 'Los jobs de build matriciales Node 20/22 superan el límite de 6 horas de GitHub Actions debido a paralelismo de tests no optimizado. Se necesita particionar el suite y añadir caché de node_modules.',
    prioridad: 'Alto',
    estado: 'Backlog',
    asignado: { nombre: 'Fernando', iniciales: 'FE', color: '#f59e0b' },
    reportador: { nombre: 'Christian', iniciales: 'CH' },
    etiquetas: ['CI/CD', 'Node.js', 'API'],
    categoria: 'Software',
    puntos: 8,
    comentarios: 6,
    subtareas: { total: 4, completadas: 0 },
    proyecto: 'DevOps Acelerado',
    fechaVencimiento: '2026-06-30',
    fechaCreacion: '2026-06-04',
    registros: [],
  },
  {
    id: 'IT-380',
    titulo: 'Rotar todas las API keys de producción tras baja del contratista',
    descripcion: 'Tras la salida del contratista externo de API, rotar todas las service API keys a las que tuvo acceso: Stripe, SendGrid, Datadog y Sentry.',
    prioridad: 'Crítico',
    estado: 'Terminado',
    asignado: { nombre: 'Vladimir', iniciales: 'VL', color: '#3b82f6' },
    reportador: { nombre: 'Braulio', iniciales: 'BR' },
    etiquetas: ['Seguridad', 'API'],
    categoria: 'Acceso',
    puntos: 5,
    comentarios: 8,
    subtareas: { total: 4, completadas: 4 },
    proyecto: 'Infraestructura Q3',
    fechaVencimiento: '2026-06-12',
    fechaCreacion: '2026-06-01',
    registros: [
      { id: 'l1', usuario: 'Vladimir', iniciales: 'VL', accion: 'Cambió estado a **Terminado**', tiempo: 'hace 3d', tipo: 'estado' },
    ],
  },
  {
    id: 'IT-375',
    titulo: 'PostgreSQL consulta lenta en tabla usuarios — índice compuesto faltante',
    descripcion: 'Datadog APM muestra latencia p99 de 4.2s en `/api/users/search`. Falta índice compuesto en `(organization_id, status, created_at DESC)`. Añadirlo con CONCURRENTLY para evitar bloqueo de tabla.',
    prioridad: 'Alto',
    estado: 'Terminado',
    asignado: { nombre: 'Braulio', iniciales: 'BR', color: '#10b981' },
    reportador: { nombre: 'Vladimir', iniciales: 'VL' },
    etiquetas: ['SQL', 'PostgreSQL', 'API'],
    categoria: 'Software',
    puntos: 3,
    comentarios: 5,
    subtareas: { total: 2, completadas: 2 },
    proyecto: 'Portal v3.2',
    fechaVencimiento: '2026-06-11',
    fechaCreacion: '2026-06-02',
    registros: [
      { id: 'l1', usuario: 'Braulio', iniciales: 'BR', accion: 'Índice creado exitosamente. Latencia p99 bajó a 180ms.', tiempo: 'hace 4d', tipo: 'comentario' },
    ],
  },
];

export const PROYECTOS: Proyecto[] = [
  {
    id: 'p1',
    nombre: 'Portal v3.2',
    lider: 'Christian',
    inicio: '2026-05-01',
    fin: '2026-07-15',
    progreso: 62,
    color: '#3b82f6',
    hitos: [
      { nombre: 'Alpha', fecha: '2026-06-01' },
      { nombre: 'Beta', fecha: '2026-07-01' },
    ],
  },
  {
    id: 'p2',
    nombre: 'Migración Auth v2',
    lider: 'Braulio',
    inicio: '2026-05-15',
    fin: '2026-07-30',
    progreso: 38,
    color: '#8b5cf6',
    hitos: [
      { nombre: 'Redis Setup', fecha: '2026-06-25' },
      { nombre: 'Migración Token', fecha: '2026-07-20' },
    ],
  },
  {
    id: 'p3',
    nombre: 'Infraestructura Q3',
    lider: 'Fernando',
    inicio: '2026-06-01',
    fin: '2026-08-31',
    progreso: 25,
    color: '#10b981',
    hitos: [
      { nombre: 'Auditoría', fecha: '2026-06-20' },
      { nombre: 'Preparación SOC2', fecha: '2026-08-01' },
    ],
  },
  {
    id: 'p4',
    nombre: 'DevOps Acelerado',
    lider: 'Fernando',
    inicio: '2026-06-01',
    fin: '2026-07-01',
    progreso: 15,
    color: '#f59e0b',
    hitos: [
      { nombre: 'CI Sharding', fecha: '2026-06-30' },
    ],
  },
];

export const BURNDOWN_SPRINT = [
  { dia: '1 Jun', ideal: 34, real: 34 },
  { dia: '3 Jun', ideal: 30, real: 32 },
  { dia: '5 Jun', ideal: 26, real: 29 },
  { dia: '7 Jun', ideal: 22, real: 27 },
  { dia: '9 Jun', ideal: 18, real: 22 },
  { dia: '11 Jun', ideal: 14, real: 19 },
  { dia: '13 Jun', ideal: 10, real: 14 },
  { dia: '15 Jun', ideal: 6, real: null },
  { dia: '17 Jun', ideal: 2, real: null },
];

export const VOLUMEN_CATEGORIA = [
  { nombre: 'Error', valor: 28, color: '#ef4444' },
  { nombre: 'Software', valor: 22, color: '#3b82f6' },
  { nombre: 'Infraestructura', valor: 18, color: '#8b5cf6' },
  { nombre: 'Acceso', valor: 15, color: '#f59e0b' },
  { nombre: 'Hardware', valor: 9, color: '#10b981' },
];

export const TENDENCIA_RESOLUCION = [
  { semana: 'S21', tmpr: 4.2 },
  { semana: 'S22', tmpr: 3.8 },
  { semana: 'S23', tmpr: 5.1 },
  { semana: 'S24', tmpr: 3.2 },
  { semana: 'S25', tmpr: 2.9 },
];

export const COLORES_PRIORIDAD: Record<Prioridad, string> = {
  'Crítico': '#ef4444',
  'Alto': '#f97316',
  'Medio': '#f59e0b',
  'Bajo': '#6b7280',
};

export const COLUMNAS_ESTADO: EstadoTicket[] = ['Backlog', 'En Progreso', 'Revisión de Código', 'QA', 'Terminado'];

export const ESTADO_INGENIERO_PERMITIDO: Record<EstadoTicket, EstadoTicket[]> = {
  'Backlog': ['En Progreso'],
  'En Progreso': ['Backlog', 'Revisión de Código'],
  'Revisión de Código': ['QA', 'En Progreso'],
  'QA': ['Terminado', 'Revisión de Código'],
  'Terminado': [],
};