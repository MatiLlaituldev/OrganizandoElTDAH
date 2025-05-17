import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '', // Esta es la ruta base para las pestañas, usualmente accedida como '/tabs' desde app-routing
    component: TabsPage,
    children: [
      {
        path: 'tasks',
        loadChildren: () => import('../tasks/pages/task-list/task-list.module').then(m => m.TaskListPageModule)
      },
      {
        path: 'habits',
        loadChildren: () => import('../habits/pages/habit-list/habit-list.module').then(m => m.HabitListPageModule)
      },
      // --- Nueva Ruta para Bienestar ---
      {
        path: 'wellbeing', // Este 'path' debe coincidir con el atributo 'tab' del ion-tab-button que añadirás
        loadChildren: () => import('../wellbeing/wellbeing.module').then(m => m.WellbeingPageModule) // Asegúrate que la ruta a tu nuevo módulo sea correcta
      },
      // --- Fin Nueva Ruta ---
      {
        path: 'goals',
        loadChildren: () => import('../goals/pages/goal-list/goal-list.module').then(m => m.GoalListPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/pages/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: '', // Si el usuario navega a '/tabs' sin una sub-ruta específica
        redirectTo: '/tabs/tasks', // Redirige a la pestaña de tareas por defecto
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
