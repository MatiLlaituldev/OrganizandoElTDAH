import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Determina si una ruta puede ser activada.
   * Está diseñado para rutas que solo deben ser accesibles para usuarios NO autenticados (ej. login, register).
   * @returns Un Observable que emite `true` si el usuario NO está logueado, o `false` si sí lo está.
   */
  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      take(1),
      map(user => !user), // La lógica es inversa: devuelve `true` si NO hay usuario.
      tap(isNotLoggedIn => {
        // Si el resultado es `false` (el usuario sí está logueado), se ejecuta este efecto.
        if (!isNotLoggedIn) {
          console.log('NoAuthGuard: Acceso denegado. Usuario ya autenticado. Redirigiendo a /tabs/tasks...');
          this.router.navigate(['/tabs/tasks']); // Redirige al usuario al área principal de la app.
        }
      })
    );
  }
}
