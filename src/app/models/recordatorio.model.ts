 export interface Recordatorio {
  id?: string;
  userId: string;
  titulo: string;
  descripcion?: string;
  fechaHora: Date;
  categoria: 'academico' | 'personal' | 'trabajo' | 'salud' | 'social' | 'otro';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  completado: boolean;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Configuración de notificaciones
  notificaciones: NotificacionConfig[];

  // Para repetición (opcional)
  repetir?: {
    tipo: 'nunca' | 'diario' | 'semanal' | 'mensual';
    intervalo?: number; // cada X días/semanas/meses
    fechaFin?: Date;
  };

  // Metadatos básicos
  etiquetas?: string[];
  notas?: string;
}

export interface NotificacionConfig {
  id?: string;
  tiempo: string; // '1 día antes', '2 horas antes', etc.
  tiempoEnMinutos: number; // minutos antes del evento
  enviado: boolean;
  fechaEnvio?: Date;
  tipo: 'push';
  mensaje?: string; // mensaje personalizado
}

// Enum para categorías con iconos y colores
export const CATEGORIAS_RECORDATORIO = {
  academico: {
    label: 'Académico',
    icon: 'school-outline',
    color: 'primary',
    emoji: '🎓'
  },
  personal: {
    label: 'Personal',
    icon: 'person-outline',
    color: 'secondary',
    emoji: '👤'
  },
  trabajo: {
    label: 'Trabajo',
    icon: 'briefcase-outline',
    color: 'tertiary',
    emoji: '💼'
  },
  salud: {
    label: 'Salud',
    icon: 'medical-outline',
    color: 'success',
    emoji: '🏥'
  },
  social: {
    label: 'Social',
    icon: 'people-outline',
    color: 'warning',
    emoji: '👥'
  },
  otro: {
    label: 'Otro',
    icon: 'ellipsis-horizontal-outline',
    color: 'medium',
    emoji: '📌'
  }
} as const;

// Enum para prioridades
export const PRIORIDADES_RECORDATORIO = {
  baja: {
    label: 'Baja',
    color: 'medium',
    emoji: '🟢',
    orden: 1
  },
  media: {
    label: 'Media',
    color: 'warning',
    emoji: '🟡',
    orden: 2
  },
  alta: {
    label: 'Alta',
    color: 'danger',
    emoji: '🟠',
    orden: 3
  },
  urgente: {
    label: 'Urgente',
    color: 'danger',
    emoji: '🔴',
    orden: 4
  }
} as const;

// Opciones predefinidas para notificaciones
export const OPCIONES_NOTIFICACION = [
  { label: '5 minutos antes', minutos: 5 },
  { label: '15 minutos antes', minutos: 15 },
  { label: '30 minutos antes', minutos: 30 },
  { label: '1 hora antes', minutos: 60 },
  { label: '2 horas antes', minutos: 120 },
  { label: '1 día antes', minutos: 1440 },
  { label: '1 semana antes', minutos: 10080 }
];

// Helpers para trabajar con fechas
export class RecordatorioHelper {

  static esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  static esMañana(fecha: Date): boolean {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    return fecha.toDateString() === mañana.toDateString();
  }

  static diasHasta(fecha: Date): number {
    const hoy = new Date();
    const diferencia = fecha.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  static formatearTiempoRestante(fecha: Date): string {
    const dias = this.diasHasta(fecha);

    if (dias < 0) return 'Vencido';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    if (dias < 7) return `En ${dias} días`;
    if (dias < 30) return `En ${Math.ceil(dias / 7)} semanas`;
    return `En ${Math.ceil(dias / 30)} meses`;
  }

  static obtenerColorPorTiempo(fecha: Date): string {
    const dias = this.diasHasta(fecha);

    if (dias < 0) return 'medium'; // Vencido
    if (dias === 0) return 'danger'; // Hoy
    if (dias === 1) return 'warning'; // Mañana
    if (dias <= 7) return 'primary'; // Esta semana
    return 'success'; // Más tiempo
  }

  static obtenerIconoPorCategoria(categoria: keyof typeof CATEGORIAS_RECORDATORIO): string {
    return CATEGORIAS_RECORDATORIO[categoria]?.icon || 'calendar-outline';
  }

  static obtenerColorPorPrioridad(prioridad: keyof typeof PRIORIDADES_RECORDATORIO): string {
    return PRIORIDADES_RECORDATORIO[prioridad]?.color || 'medium';
  }
}
