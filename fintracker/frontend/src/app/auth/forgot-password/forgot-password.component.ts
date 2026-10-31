import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-image-section">
        <div class="image-content">
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80" alt="Security">
          <h2>Account Security</h2>
          <p>We'll help you reset your password securely. Just enter your registered email address.</p>
        </div>
      </div>
      <div class="auth-form-section">
        <div class="auth-card">
          <div class="auth-logo">
            <i class="fas fa-chart-line"></i> FinTrack
          </div>
          <div class="auth-heading">
            <h2>Reset Password</h2>
            <p>Enter your email address and we'll send you a reset link</p>
          </div>
          <div class="success-msg" *ngIf="sent"><i class="fas fa-check-circle"></i> Password reset link has been sent to your email.</div>
          <div class="error-msg" *ngIf="error"><i class="fas fa-exclamation-circle"></i> {{error}}</div>
          <form (ngSubmit)="onSubmit()" *ngIf="!sent">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" class="form-control" placeholder="name@gmail.com" required>
            </div>
            <button type="submit" class="btn-submit" [disabled]="loading">
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              <span *ngIf="!loading"><i class="fas fa-paper-plane"></i> Send Reset Link</span>
            </button>
          </form>
          <p class="auth-footer"><a routerLink="/login"><i class="fas fa-arrow-left"></i> Back to Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss']
})
export class ForgotPasswordComponent {
  email = ''; sent = false; loading = false; error = '';
  constructor(private auth: AuthService) {}
  onSubmit() {
    this.loading = true; this.error = '';
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading = false; this.sent = true; },
      error: (e) => { this.loading = false; this.error = e.error?.message || 'Failed to send reset link.'; }
    });
  }
}
