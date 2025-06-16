import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // 👈 PASO 1: IMPORTA EL AUTH GUARD
import { NoAuthGuard } from './guards/no-auth.guard'; // 👈 PASO 2: IMPORTA EL NO-AUTH GUARD

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth', // Por defecto, la app intentará ir a la sección de autenticación.
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [NoAuthGuard] // 🔐 PASO 3: APLICA EL NO-AUTH GUARD
                               // Esto previene que un usuario logueado vea las páginas de login/registro.
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard] // 🔐 PASO 4: APLICA EL AUTH GUARD
                             // Esto protege todas las pestañas y requiere que el usuario esté logueado.
  },
  {
    path: 'wellbeing',
    loadChildren: () => import('./wellbeing/wellbeing.module').then( m => m.WellbeingPageModule),
    canActivate: [AuthGuard] // 🔐 PASO 5: PROTEGE TAMBIÉN ESTA RUTA
  },
  {
    path: 'profile', // Aunque el perfil está en los tabs, si se accede por URL directa, debe estar protegido.
    loadChildren: () => import('./profile/pages/profile/profile.module').then( m => m.ProfilePageModule),
    canActivate: [AuthGuard] // 🔐 PASO 6: PROTEGE TAMBIÉN ESTA RUTA
  },
  {
    path: '**', // Cualquier otra ruta que no coincida...
    redirectTo: 'auth' // ...redirige a la autenticación. El guard correspondiente decidirá qué hacer.
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
