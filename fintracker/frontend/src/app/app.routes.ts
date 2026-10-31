import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: 'app',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'income', loadComponent: () => import('./income/income.component').then(m => m.IncomeComponent) },
      { path: 'expenses', loadComponent: () => import('./expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'budgets', loadComponent: () => import('./budgets/budgets.component').then(m => m.BudgetsComponent) },
      { path: 'goals', loadComponent: () => import('./goals/goals.component').then(m => m.GoalsComponent) },
      { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent), canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];
