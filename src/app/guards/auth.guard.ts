import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Determina si una ruta puede ser activada.
   * Se basa en el estado de autenticación del usuario de Firebase.
   * @returns Un Observable que emite `true` si el usuario está logueado, o `false` si no lo está.
   */
  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1), // Toma el primer valor emitido para evitar suscripciones activas.
      map(user => !!user), // Convierte el objeto de usuario (o null) en un booleano. `!!user` es true si user no es null.
      tap(isLoggedIn => {
        // Si el resultado es `false` (no está logueado), se ejecuta este efecto secundario.
        if (!isLoggedIn) {
          console.log('AuthGuard: Acceso denegado. Usuario no autenticado. Redirigiendo a /auth/login...');
          this.router.navigate(['/auth/login']); // Redirige al usuario a la página de inicio de sesión.
        }
      })
    );
  }
}
