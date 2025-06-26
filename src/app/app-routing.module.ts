import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

const routes: Routes = [
  // Si un usuario entra a la raíz, lo mandamos a 'tabs'. El AuthGuard decidirá qué hacer.
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
    canActivate: [NoAuthGuard], // Proteger las páginas de login/registro de usuarios ya logueados.
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then((m) => m.TabsPageModule),
    canActivate: [AuthGuard], // Proteger TODA la sección de pestañas. Solo usuarios logueados entran aquí.
  },
  {
    path: 'goal-detail/:id',
    loadChildren: () =>
      import('./goals/pages/goal-detail/goal-detail.module').then(
        (m) => m.GoalDetailPageModule
      ),
  },
  {
    path: 'task-detail/:id',
    loadChildren: () =>
      import('./tasks/pages/task-detail/task-detail.module').then(
        (m) => m.TaskDetailPageModule
      ),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
