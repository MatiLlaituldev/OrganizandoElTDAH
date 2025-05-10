import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
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
      {
        path: 'goals',
        loadChildren: () => import('../goals/pages/goal-list/goal-list.module').then(m => m.GoalListPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/pages/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/tasks',
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
