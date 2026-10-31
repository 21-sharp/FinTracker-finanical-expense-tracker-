import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  profileMenuOpen = false;
  notifOpen = false;
  notifTimer: any = null;
  hasUnreadSuggestions = true;
  contactExpanded = false;

  suggestions: { icon: string; color: string; text: string }[] = [];

  menuItems = [
    { path: '/app/dashboard', icon: 'fas fa-th-large', label: 'Dashboard' },
    { path: '/app/transactions', icon: 'fas fa-exchange-alt', label: 'Transactions' },
    { path: '/app/income', icon: 'fas fa-arrow-down', label: 'Income' },
    { path: '/app/expenses', icon: 'fas fa-arrow-up', label: 'Expenses' },
    { path: '/app/budgets', icon: 'fas fa-wallet', label: 'Budgets' },
    { path: '/app/goals', icon: 'fas fa-bullseye', label: 'Goals' },
    { path: '/app/settings', icon: 'fas fa-cog', label: 'Settings' },
    { path: '/app/profile', icon: 'fas fa-user', label: 'Profile' },
  ];

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.api.getDashboard().subscribe({
      next: (data: any) => {
        this.suggestions = [];
        const income = data.monthlyIncome || 0;
        const expenses = data.monthlyExpenses || 0;
        const savings = data.monthlySavings || 0;
        const savingsRate = data.savingsRate || 0;

        if (income > 0 && savingsRate < 20) {
          const needed = Math.round(income * 0.2 - savings);
          this.suggestions.push({
            icon: 'fas fa-piggy-bank',
            color: '#059669',
            text: `Save ₹${needed.toLocaleString('en-IN')} more this month to hit a 20% savings goal!`
          });
        }
        if (expenses > income * 0.7) {
          this.suggestions.push({
            icon: 'fas fa-exclamation-triangle',
            color: '#f59e0b',
            text: 'Your expenses exceed 70% of income. Consider reducing discretionary spending.'
          });
        }
        if (income > 0 && savings > 0 && savingsRate >= 20) {
          this.suggestions.push({
            icon: 'fas fa-trophy',
            color: '#8b5cf6',
            text: `Great work! You\'re saving ${savingsRate.toFixed(0)}% of your income. Keep it up!`
          });
        }
      },
      error: () => {
        this.suggestions = [];
      }
    });
  }

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  logout() { this.authService.logout(); }

  getAvatarSrc(): string {
    return this.authService.getUser()?.profilePicture || '';
  }

  getInitials(): string {
    const user = this.authService.getUser();
    return `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || ''}`;
  }

  toggleNotifications() {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) {
      this.hasUnreadSuggestions = false;
      if (this.notifTimer) clearTimeout(this.notifTimer);
      this.notifTimer = setTimeout(() => {
        this.notifOpen = false;
      }, 8000);
    } else {
      if (this.notifTimer) {
        clearTimeout(this.notifTimer);
        this.notifTimer = null;
      }
    }
  }
}
