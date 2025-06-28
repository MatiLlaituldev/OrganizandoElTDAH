import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Feedback } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  constructor(private firestore: Firestore) {}

  // Enviar feedback (solo envío, sin respuesta)
  async enviarFeedback(feedback: Omit<Feedback, 'id' | 'fechaCreacion'>): Promise<void> {
    const feedbackData: Omit<Feedback, 'id'> = {
      ...feedback,
      fechaCreacion: new Date()
    };

    const feedbackRef = collection(this.firestore, 'feedback');
    await addDoc(feedbackRef, feedbackData);
  }
}
