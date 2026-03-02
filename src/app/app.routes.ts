import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'share/:shareToken',
    loadComponent: () =>
      import('./features/share/pages/shared-project/shared-project.page').then(
        (m) => m.SharedProjectPage
      ),
  },
  { path: '**', redirectTo: '/admin' },
];
