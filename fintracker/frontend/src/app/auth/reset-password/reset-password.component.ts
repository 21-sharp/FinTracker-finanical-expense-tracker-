import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-image-section">
        <div class="image-content">
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80" alt="Security">
          <h2>Account Security</h2>
          <p>Complete your password reset using the secure OTP sent to your email.</p>
        </div>
      </div>
      <div class="auth-form-section">
        <div class="auth-card">
          <div class="auth-logo">
            <i class="fas fa-shield-alt"></i> FinTrack
          </div>
          <div class="auth-heading">
            <h2>Set New Password</h2>
            <p>Enter the OTP from your email and your new password</p>
          </div>
          <div class="success-msg" *ngIf="success"><i class="fas fa-check-circle"></i> Password updated! Redirecting...</div>
          <div class="error-msg" *ngIf="error"><i class="fas fa-exclamation-circle"></i> {{error}}</div>
          <form (ngSubmit)="onSubmit()" *ngIf="!success">
            <div class="form-group">
              <label>OTP</label>
              <input type="text" [(ngModel)]="token" name="token" class="form-control" placeholder="Enter OTP" required>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPassword" class="form-control" placeholder="At least 8 characters" required>
              <button type="button" class="pw-toggle" (click)="showPw=!showPw"><i [class]="showPw ? 'fas fa-eye-slash' : 'fas fa-eye'"></i></button>
            </div>
            <button type="submit" class="btn-submit" [disabled]="loading">
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              <span *ngIf="!loading"><i class="fas fa-lock"></i> Update Password</span>
            </button>
          </form>
          <p class="auth-footer"><a routerLink="/login"><i class="fas fa-arrow-left"></i> Back to Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss']
})
export class ResetPasswordComponent {
  token = ''; newPassword = ''; showPw = false;
  loading = false; error = ''; success = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.token || !this.newPassword || this.newPassword.length < 8) {
      this.error = 'Please enter the OTP and a password of at least 8 characters.';
      return;
    }
    this.loading = true; this.error = '';
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Invalid or expired OTP.';
      }
    });
  }
}
