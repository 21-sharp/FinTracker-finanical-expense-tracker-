import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface LoginHistory {
  id: number;
  email: string;
  loginTime: string;
  logoutTime: string | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div class="admin-sidebar">
        <div class="brand">
          <i class="fas fa-shield-alt"></i> Admin Panel
        </div>
        <ul class="nav-links">
          <li class="active"><i class="fas fa-users"></i> User Logins</li>
        </ul>
        <button class="logout-btn" (click)="onLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <div class="admin-main">
        <div class="header-banner">
          <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80" alt="Admin Dashboard Banner">
          <div class="banner-overlay">
            <h1>System Access Control</h1>
            <p>Monitor user activity and website access in real-time.</p>
          </div>
        </div>

        <div class="content-wrapper">
          <!-- STATS FOR LOGINS -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                <i class="fas fa-sign-in-alt"></i>
              </div>
              <div class="stat-info">
                <h3>Total Logins</h3>
                <p>{{ logins.length }}</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-info">
                <h3>Active Users</h3>
                <p>{{ activeUsers }}</p>
              </div>
            </div>
          </div>

          <!-- TABLE FOR LOGINS -->
          <div class="table-container">
            <div class="table-header">
              <h2>Recent Website Access (Latest First)</h2>
              <button class="refresh-btn" (click)="loadLogins()"><i class="fas fa-sync-alt" [class.fa-spin]="loadingLogins"></i> Refresh</button>
            </div>
            
            <div class="error-msg" *ngIf="error">{{ error }}</div>
            
            <table *ngIf="!loadingLogins && logins.length > 0">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>User Access Details</th>
                  <th>Login Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of logins; let i = index">
                  <td style="font-weight:600; color:#64748b;">{{ i + 1 }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ log.email.charAt(0).toUpperCase() }}</div>
                      <div>
                        <span style="font-weight:700; color:#0f172a; display:block;">{{ log.email }}</span>
                        <span style="font-size:0.8rem; color:#64748b;">System User</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="time-badge in"><i class="fas fa-clock"></i> {{ getLoginAge(log.loginTime) }}</span></td>
                  <td>
                    <span class="status-indicator" [class.active]="!log.logoutTime" [class.offline]="log.logoutTime"></span>
                    <span [style.color]="!log.logoutTime ? '#10b981' : '#64748b'" style="font-weight:600;">
                       {{ getStatusText(log) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="empty-state" *ngIf="!loadingLogins && logins.length === 0 && !error">
              <i class="fas fa-users"></i> No login records yet.
            </div>
            <div class="loading-state" *ngIf="loadingLogins">
              <i class="fas fa-circle-notch fa-spin"></i> Loading access logs...
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f8fafc;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    
    .admin-container {
      display: flex;
      min-height: 100vh;
    }
    
    .admin-sidebar {
      width: 260px;
      background: #0f172a;
      color: #fff;
      display: flex;
      flex-direction: column;
      padding: 24px;
    }
    
    .brand {
      font-size: 1.5rem;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .nav-links {
      list-style: none;
      padding: 0;
      margin: 0;
      flex: 1;
    }
    
    .nav-links li {
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.95rem;
      color: #94a3b8;
      transition: all 0.2s;
    }
    
    .nav-links li.active {
      background: #38bdf8;
      color: #0f172a;
      font-weight: 600;
    }
    
    .logout-btn {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .logout-btn:hover {
      background: #ef4444;
      color: #fff;
    }
    
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    
    .header-banner {
      position: relative;
      height: 240px;
      width: 100%;
      overflow: hidden;
    }
    
    .header-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .banner-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to right, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 40px;
      color: #fff;
    }
    
    .banner-overlay h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 10px 0;
    }
    
    .banner-overlay p {
      font-size: 1.1rem;
      color: #cbd5e1;
      margin: 0;
    }
    
    .content-wrapper {
      padding: 30px 40px;
      position: relative;
      z-index: 10;
    }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .stat-info h3 {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .stat-info p {
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    
    .table-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      padding: 24px;
    }
    
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .table-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }
    
    .refresh-btn {
      background: #f1f5f9;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      color: #475569;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    
    .refresh-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    th {
      text-align: left;
      padding: 16px;
      border-bottom: 2px solid #f1f5f9;
      color: #64748b;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 0.95rem;
      vertical-align: middle;
    }
    
    tbody tr:hover td {
      background-color: #f8fafc;
    }
    
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: bold;
    }
    
    .time-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    
    .time-badge.in {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }
    
    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    .status-indicator.active { background-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
    .status-indicator.offline { background-color: #94a3b8; }
    
    .loading-state {
      padding: 40px;
      text-align: center;
      color: #64748b;
      font-size: 1.1rem;
    }
    
    .error-msg {
      padding: 16px;
      background: #fef2f2;
      color: #ef4444;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .empty-state {
      padding: 32px;
      text-align: center;
      color: #64748b;
      i { font-size: 1.5rem; margin-bottom: 8px; display: block; }
    }
  `]
})
export class AdminComponent implements OnInit {
  logins: LoginHistory[] = [];
  loadingLogins = false;
  error = '';
  private readonly apiBase = 'http://localhost:8080/api/auth/admin';

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadLogins();
  }

  get activeUsers() {
    return this.logins.filter(l => !l.logoutTime).length;
  }

  loadLogins() {
    this.loadingLogins = true;
    this.error = '';

    this.http.get<LoginHistory[]>(`${this.apiBase}/logins`).subscribe({
      next: (data) => {
        // Sort descending by loginTime (newest first)
        const sorted = (data || []).sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
        // Deduplicate: keep only the latest login per user email
        const seen = new Set<string>();
        this.logins = sorted.filter(l => {
          if (seen.has(l.email)) return false;
          seen.add(l.email);
          return true;
        });
        this.loadingLogins = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to load access history. Sign in as admin and ensure the backend is running.';
        this.loadingLogins = false;
        console.error(e);
      }
    });
  }

  getStatusText(log: LoginHistory): string {
    return log.logoutTime ? 'offline' : 'online now';
  }

  getLoginAge(loginTime: string): string {
    if (!loginTime) return '';
    const diffMs = new Date().getTime() - new Date(loginTime).getTime();
    if (diffMs < 0) {
      return 'user logged 1 sec ago';
    }
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return `user logged ${diffSecs} ${diffSecs === 1 ? 'sec' : 'secs'} ago`;
    } else if (diffMins < 60) {
      return `user logged ${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffHours < 24) {
      return `user logged ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `user logged ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  }

  onLogout() {
    this.auth.logout();
  }
}
