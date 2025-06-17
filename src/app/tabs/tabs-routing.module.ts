import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    // El path ahora es vacío ('') porque 'tabs' ya fue definido en app-routing.module.ts
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tasks',
        loadChildren: () => import('../tasks/pages/task-list/task-list.module').then(m => m.TaskListPageModule)
      },
      {
        path: 'goals',
        loadChildren: () => import('../goals/pages/goal-list/goal-list.module').then(m => m.GoalListPageModule)
      },
      {
        path: 'habits',
        loadChildren: () => import('../habits/pages/habit-list/habit-list.module').then(m => m.HabitListPageModule)
      },
      {
        path: 'wellbeing',
        loadChildren: () => import('../wellbeing/wellbeing.module').then(m => m.WellbeingPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/pages/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'gestion-etiquetas',
        loadChildren: () => import('../profile/pages/gestion-etiquetas/gestion-etiquetas.module').then(m => m.GestionEtiquetasPageModule)
      },
      // La redirección por defecto ahora es a 'tasks' (sin la barra inicial)
      {
        path: '',
        redirectTo: 'tasks',
        pathMatch: 'full'
      }
    ]
  }
  // Se elimina la redirección global de aquí, ya que se maneja en app-routing
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
