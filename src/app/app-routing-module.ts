import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [publicGuard],
    children: [
      { path: 'login',            loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register',         loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'recuperar-senha',  loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'sessions',
    canActivate: [authGuard],
    children: [
      { path: 'new', loadComponent: () => import('./features/sessions/session-create/session-create.component').then(m => m.SessionCreateComponent) },
      { path: ':id', loadComponent: () => import('./features/sessions/session-room/session-room.component').then(m => m.SessionRoomComponent) },
    ],
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
