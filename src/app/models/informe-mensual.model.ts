export interface InformeMensual {
  userId: string;
  anio: number;
  mes: number;
  tareasCompletadas: number;
  totalTareas: number;         // <-- agrega esto
  porcentajeTareas: number;
  habitosCompletados: number;
  totalHabitos: number;        // <-- agrega esto
  porcentajeHabitos: number;
  metasCompletadas: number;
  totalMetas: number;          // <-- agrega esto
  porcentajeMetas: number;
  promedioAnimo: number;
  promedioEnergia: number;
  fechaCreacion: any;
}
