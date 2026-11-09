import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { UnirseCodigoComponent } from './features/auth/unirse-codigo.component';
import { MisOrganizacionesComponent } from './features/organizaciones/mis-organizaciones.component';
import { CrearOrganizacionComponent } from './features/organizaciones/crear-organizacion.component';
import { DisenadorMapaComponent } from './features/organizaciones/disenador-mapa.component';
import { MapaConductorComponent } from './features/parqueadero-mapa/mapa-conductor.component';
import { DashboardAdminComponent } from './features/admin-dashboard/dashboard-admin.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'organizaciones', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'unirse', component: UnirseCodigoComponent, canActivate: [authGuard] },
  { path: 'organizaciones', component: MisOrganizacionesComponent, canActivate: [authGuard] },
  {
    path: 'organizaciones/crear',
    component: CrearOrganizacionComponent,
    canActivate: [authGuard, roleGuard(['administrador'])]
  },
  {
    path: 'organizaciones/:id/disenador',
    component: DisenadorMapaComponent,
    canActivate: [authGuard, roleGuard(['administrador'])]
  },
  { path: 'mapa/:id', component: MapaConductorComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: DashboardAdminComponent,
    canActivate: [authGuard, roleGuard(['administrador', 'guardia'])]
  },
  { path: '**', redirectTo: 'organizaciones' }
];
