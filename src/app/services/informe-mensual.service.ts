import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, addDoc, query, where, orderBy, Timestamp, CollectionReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { InformeMensual } from '../models/informe-mensual.model';

@Injectable({
  providedIn: 'root'
})
export class InformeMensualService {

  constructor(private firestore: Firestore) {}

  // Guardar un informe mensual (crea o actualiza)
  async guardarInformeMensual(userId: string, informe: InformeMensual): Promise<void> {
    const docRef = doc(this.firestore, `usuarios/${userId}/informesMensuales/${informe.anio}-${informe.mes}`);
    await setDoc(docRef, informe, { merge: true });
  }

  // Obtener todos los informes mensuales de un usuario
  getInformesMensuales(userId: string): Observable<InformeMensual[]> {
    const informesRef = collection(this.firestore, `usuarios/${userId}/informesMensuales`) as CollectionReference<InformeMensual>;
    const q = query(informesRef, orderBy('anio', 'desc'), orderBy('mes', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // Obtener un informe mensual específico por año y mes
  getInformeMensualPorMes(userId: string, anio: number, mes: number): Observable<InformeMensual | undefined> {
    const docRef = doc(this.firestore, `usuarios/${userId}/informesMensuales/${anio}-${mes}`);
    return docData(docRef, { idField: 'id' }) as Observable<InformeMensual | undefined>;
  }
}
