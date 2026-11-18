import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/tabs/tab1', pathMatch: 'full' },
  {
    path: 'tabs/tab1',
    loadComponent: () => import('./paginas/bienvenida/bienvenida.page').then((m) => m.BienvenidaPage)
  },
  { path: 'tabs/acceso', redirectTo: '/acceso', pathMatch: 'full' },
  {
    path: 'acceso',
    loadComponent: () => import('./paginas/acceso/acceso.page').then((m) => m.AccesoPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./paginas/registro/registro.page').then((m) => m.RegistroPage)
  },
  {
    path: 'terminos',
    loadComponent: () => import('./paginas/terminos/terminos.page').then((m) => m.TerminosPage)
  },
  {
    path: 'paginaprincipal',
    loadComponent: () => import('./paginas/paginaprincipal/paginaprincipal.page').then((m) => m.PaginaPrincipalPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./paginas/perfil/perfil.page').then((m) => m.PerfilPage)
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./paginas/ajustes/ajustes.page').then((m) => m.AjustesPage)
  },
  {
    path: 'creditos-fotos',
    loadComponent: () => import('./paginas/creditos/creditos.page').then((m) => m.CreditosPage)
  },
  {
    path: 'publicar',
    loadComponent: () => import('./paginas/publicar/publicar.page').then((m) => m.PublicarPage)
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./paginas/notificaciones/notificaciones.page').then((m) => m.NotificacionesPage)
  }
];
