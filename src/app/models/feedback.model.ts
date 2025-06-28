export interface Feedback {
  id?: string;
  userId: string;
  tipo: 'sugerencia' | 'problema' | 'elogio' | 'bug' | 'mejora';
  titulo: string;
  descripcion: string;
  puntuacion?: number; // 1-5 estrellas (solo para elogios)
  email?: string;
  fechaCreacion: Date;
}
