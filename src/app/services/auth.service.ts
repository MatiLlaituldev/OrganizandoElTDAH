import { Injectable } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    // El observable que escucha el estado del usuario actual
    this.user$ = user(this.auth);
  }

  // Iniciar sesión
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  //  Crear usuario
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  //  Cerrar sesión
  logout() {
    return signOut(this.auth);
  }

  //  Usuario actual
  getCurrentUser() {
    return this.auth.currentUser;
  }

  //  Recuperar Contraseña
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
