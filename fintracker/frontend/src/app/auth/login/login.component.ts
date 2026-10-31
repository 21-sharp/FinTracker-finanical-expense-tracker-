import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FaceCaptureComponent, FaceCaptureResult } from '../../shared/face-capture/face-capture.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaceCaptureComponent],
  template: `
    <div class="auth-page">
      <div class="auth-image-section">
        <div class="image-content">
          <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80" alt="Financial Management">
          <h2>Enterprise Financial Management</h2>
          <p>Manage your organization's finances with precision. Track transactions, budgets, and goals all in one secure platform.</p>
        </div>
      </div>
      <div class="auth-form-section">
        <div class="auth-card">
          <div class="auth-logo">
            <i class="fas fa-chart-line"></i> FinTrack
          </div>
          <div class="auth-heading">
            <h2>Enterprise Financial Management</h2>
            <p>Manage your organization's finances with precision. Track transactions, budgets, and goals all in one secure platform.</p>
          </div>
          <div class="error-msg" *ngIf="error"><i class="fas fa-exclamation-circle"></i> {{error}}</div>
          <div class="login-tabs">
            <button type="button" [class.active]="loginMode === 'face'" (click)="loginMode='face'"><i class="fas fa-face-smile"></i> Face Login</button>
            <button type="button" [class.active]="loginMode === 'password'" (click)="loginMode='password'"><i class="fas fa-key"></i> Password</button>
          </div>

          <div *ngIf="loginMode === 'face'" class="face-login-panel">
            <app-face-capture
              title="Face Recognition Login"
              captureLabel="Authenticate"
              hint="Camera matching happens against your encrypted account session and stored face descriptor."
              (captured)="onFaceCaptured($event)">
            </app-face-capture>
            <button type="button" class="btn-submit" [disabled]="loading || faceEmbedding.length !== 128" (click)="onFaceLogin()">
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              <span *ngIf="!loading"><i class="fas fa-shield-halved"></i> Login with Face Recognition</span>
            </button>
          </div>

          <form (ngSubmit)="onLogin()" *ngIf="loginMode === 'password'">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" class="form-control" placeholder="enter email" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" name="password" class="form-control" placeholder="Enter your password" required>
              <button type="button" class="pw-toggle" (click)="showPw=!showPw"><i [class]="showPw ? 'fas fa-eye-slash' : 'fas fa-eye'"></i></button>
            </div>
            <div class="form-row">
              <label class="checkbox-label"><input type="checkbox" [(ngModel)]="remember" name="remember"> Remember me</label>
              <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
            </div>
            <button type="submit" class="btn-submit" [disabled]="loading">
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>
          <p class="auth-footer">Don't have an account? <a routerLink="/register">Create Account</a></p>
        </div>

      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
  styles: [`
    .login-tabs {
      display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px;
      background:#f1f5f9; border:1px solid #e2e8f0; padding:5px; border-radius:12px;
    }
    .login-tabs button {
      border:none; background:transparent; color:#64748b; border-radius:9px; padding:10px 8px;
      font-size:0.8rem; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px;
      transition:all 0.18s ease;
    }
    .login-tabs button.active {
      background:linear-gradient(135deg, #0ea5e9, #2563eb); color:#fff; box-shadow:0 10px 20px rgba(37,99,235,0.18);
    }
    .face-login-panel { animation: fadeUp 0.28s ease; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  `]
})
export class LoginComponent {
  email = ''; password = ''; remember = false; showPw = false;
  loading = false; error = '';
  loginMode: 'face' | 'password' = 'face';
  faceEmbedding: number[] = [];

  constructor(private auth: AuthService, private router: Router) {}

  onFaceCaptured(result: FaceCaptureResult) {
    this.faceEmbedding = result.faceEmbedding;
    this.error = '';
  }

  onFaceLogin() {
    if (this.faceEmbedding.length !== 128) {
      this.error = 'Please capture a clear face before signing in.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.faceLogin(this.faceEmbedding).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(this.auth.isAdmin() ? ['/admin'] : ['/app/dashboard']);
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Face authentication failed. Use password login if needed.';
      }
    });
  }

  onLogin() {
    this.loading = true; this.error = '';

    if (!this.email || !this.email.trim()) {
      this.error = 'Please enter your email address.';
      this.loading = false;
      return;
    }

    const emailNorm = this.email.trim().toLowerCase();
    const isAdminAccount = emailNorm === 'admin@gmail.com';
    const isEmailValid = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailNorm);

    if (!isAdminAccount && !isEmailValid) {
      this.error = 'Please enter a valid Gmail address (ending in @gmail.com).';
      this.loading = false;
      return;
    }

    if (!isAdminAccount && (!this.password || this.password.length < 8)) {
      this.error = 'Password must be at least 8 characters.';
      this.loading = false;
      return;
    }

    this.auth.login(emailNorm, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(this.auth.isAdmin() ? ['/admin'] : ['/app/dashboard']);
      },
      error: (e) => { this.loading = false; this.error = e.error?.message || 'Invalid credentials. Please try again.'; }
    });
  }
}
