import { Injectable } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { Observable, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

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
  async getCurrentUser(): Promise<User | null> {
    const current = this.auth.currentUser;
    if (current) {
      return current;
    }
    return firstValueFrom(this.user$.pipe(take(1)));
  }

  //  Recuperar Contraseña
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
