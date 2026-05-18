import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginAdminComponent } from './pages/login-admin/login-admin.component';
import { LoginComponent } from './pages/login/login.component';
import { AbsencesComponent } from './pages/absences/absences.component';
import { PresencesComponent } from './pages/presences/presences.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin-login', component: LoginAdminComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'presences', component: PresencesComponent },
  { path: 'absences', component: AbsencesComponent },
  { path: '**', redirectTo: 'login' },
];
