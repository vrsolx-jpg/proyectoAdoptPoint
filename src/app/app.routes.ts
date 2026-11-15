import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'acceso',
    loadComponent: () => import('./acceso/acceso.page').then( m => m.AccesoPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'paginaprincipal',
    loadComponent: () =>
      import('./paginaprincipal/paginaprincipal.page').then((m) => m.PaginaPrincipalPage)
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./perfil/perfil.page').then((m) => m.PerfilPage)
  },
];
