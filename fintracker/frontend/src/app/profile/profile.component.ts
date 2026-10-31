import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { FaceCaptureComponent, FaceCaptureResult } from '../shared/face-capture/face-capture.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FaceCaptureComponent],
  template: `
    <div class="page animate-fade-in">
      <!-- Profile Header Banner -->
      <div class="profile-banner">
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80" alt="Corporate Banner" class="banner-img">
        <div class="banner-overlay"></div>
      </div>

      <div class="profile-body">
        <!-- Floating Success Notification -->
        <div class="success-notification" *ngIf="successMessage">
          <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>{{successMessage}}</span>
          </div>
        </div>

        <div class="profile-layout">
          <!-- Profile Card Left -->
          <div class="sidebar-left">
            <div class="card profile-card">
              <div class="avatar-wrapper">
                <div class="profile-avatar">
                  <img *ngIf="profilePicture" [src]="profilePicture" alt="Profile photo">
                  <span *ngIf="!profilePicture">{{(firstName || 'U').charAt(0)}}{{(lastName || '').charAt(0)}}</span>
                </div>
                <span class="online-indicator"></span>
              </div>
              <h2>{{firstName}} {{lastName}}</h2>
              <p class="profile-email">{{email}}</p>
              <span class="profile-role">{{role}}</span>
              <button type="button" class="recapture-link" (click)="showRecapture = !showRecapture">
                <i class="fas fa-camera"></i> {{showRecapture ? 'Close Camera' : 'Recapture Face'}}
              </button>
            </div>
          </div>

          <div class="details-section">
            <!-- Personal Details -->
            <div class="card details-card">
              <h3><i class="fas fa-user-circle"></i> Personal Details</h3>
              <form (ngSubmit)="saveChanges()">
                <div class="details-grid">
                  <div class="form-group">
                    <label class="form-label">First Name</label>
                    <div class="input-icon-wrapper">
                      <i class="fas fa-user input-icon"></i>
                      <input type="text" class="form-control" [(ngModel)]="firstName" name="fn" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <div class="input-icon-wrapper">
                      <i class="fas fa-user-tag input-icon"></i>
                      <input type="text" class="form-control" [(ngModel)]="lastName" name="ln" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <div class="input-icon-wrapper">
                      <i class="fas fa-envelope input-icon"></i>
                      <input type="email" class="form-control" [value]="email" name="em" disabled>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <div class="input-icon-wrapper">
                      <i class="fas fa-phone-alt input-icon"></i>
                      <input type="tel" class="form-control" [class.input-error]="phoneError" [(ngModel)]="phone" name="ph" placeholder="10-digit number" maxlength="10" (input)="onPhoneInput()">
                    </div>
                    <div class="field-error" *ngIf="phoneError">
                      <i class="fas fa-exclamation-triangle"></i> {{phoneError}}
                    </div>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-primary" [disabled]="loading">
                    <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
                    <i class="fas fa-save" *ngIf="!loading"></i> Save Profile Details
                  </button>
                </div>
              </form>
            </div>

            <!-- Change Password -->
            <div class="card details-card">
              <h3><i class="fas fa-shield-alt"></i> Security & Password</h3>
              <div class="security-status">
                <div>
                  <strong>Face Login</strong>
                  <span>{{faceEnabled ? 'Enabled with biometric profile photo' : 'Not enrolled'}}</span>
                </div>
                <span [class]="faceEnabled ? 'badge-completed' : 'badge-pending'">
                  <i [class]="faceEnabled ? 'fas fa-shield-check' : 'fas fa-triangle-exclamation'"></i>
                  {{faceEnabled ? 'Protected' : 'Action Needed'}}
                </span>
              </div>
              <app-face-capture
                *ngIf="showRecapture"
                title="Update Face Login"
                captureLabel="Save New Face"
                hint="Recapturing updates your profile avatar and future face-login descriptor."
                (captured)="saveFaceCapture($event)">
              </app-face-capture>
              <div class="error-msg" *ngIf="pwdError"><i class="fas fa-exclamation-circle"></i> {{pwdError}}</div>
              <div class="success-msg" *ngIf="pwdSuccess"><i class="fas fa-check-circle"></i> {{pwdSuccess}}</div>
              <form (ngSubmit)="changePassword()">
                <div class="details-grid">
                  <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input type="password" class="form-control" [(ngModel)]="currentPwd" name="cp" placeholder="••••••••" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-control" [(ngModel)]="newPwd" name="np" placeholder="Min 8 characters" required>
                  </div>
                  <div class="form-group" style="grid-column: span 2">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" class="form-control" [(ngModel)]="confirmNewPwd" name="cnp" placeholder="Re-type new password" required>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn-secondary" [disabled]="loading">
                    <i class="fas fa-key"></i> Update Security Credentials
                  </button>
                </div>
              </form>
            </div>

            <!-- Account Information -->
            <div class="card details-card">
              <h3><i class="fas fa-info-circle"></i> Account Metadata</h3>
              <div class="info-rows">
                <div class="info-row"><span class="info-label">Account Identification</span><span class="info-value">FT-{{userId}}</span></div>
                <div class="info-row"><span class="info-label">Access Role</span><span class="info-value role-badge">{{role}}</span></div>
                <div class="info-row"><span class="info-label">Base Currency</span><span class="info-value">{{currency}}</span></div>
                <div class="info-row"><span class="info-label">Verification Status</span><span class="badge-completed"><i class="fas fa-shield-check"></i> Account Verified</span></div>
                <div class="info-row"><span class="info-label">Join Date</span><span class="info-value">May 2026</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .profile-banner {
      height: 200px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: -70px;
      position: relative;
      z-index: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      .banner-img { width: 100%; height: 100%; object-fit: cover; }
      .banner-overlay {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(180deg, rgba(26,86,219,0.1) 0%, rgba(26,86,219,0.3) 100%);
      }
    }
    
    .profile-body { position: relative; z-index: 1; padding: 0 16px; }
    
    /* Notification */
    .success-notification {
      position: fixed; top: 24px; right: 24px; z-index: 9999;
      background: #059669; color: #fff; padding: 16px 24px;
      border-radius: 8px; box-shadow: 0 10px 25px rgba(5,150,105,0.3);
      font-weight: 600; font-size: 0.9rem;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      .notification-content { display: flex; align-items: center; gap: 10px; }
      i { font-size: 1.1rem; }
    }
    @keyframes slideIn {
      from { transform: translateX(100%) translateY(-10px); opacity: 0; }
      to { transform: translateX(0) translateY(0); opacity: 1; }
    }

    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
    .sidebar-left { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 24px; }
    
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; }
    
    /* Left Card */
    .profile-card {
      text-align: center; padding: 36px 24px;
      h2 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin-top: 16px; }
      .profile-email { color: #64748b; font-size: 0.85rem; margin: 6px 0 12px; }
      .profile-role {
        display: inline-block; background: #eef2ff; color: #1a56db;
        padding: 6px 16px; border-radius: 99px; font-size: 0.72rem;
        font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      }
    }

    /* Contact Card */
    .contact-card {
      padding: 20px 24px;
      h4 {
        font-size: 0.88rem; font-weight: 700; color: #1e293b; margin: 0 0 16px;
        display: flex; align-items: center; gap: 8px;
        i { color: #1a56db; font-size: 0.95rem; }
      }
    }
    .contact-list { display: flex; flex-direction: column; gap: 0; }
    .contact-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }
    }
    .contact-icon {
      width: 36px; height: 36px; border-radius: 8px; background: #eef2ff;
      display: flex; align-items: center; justify-content: center;
      color: #1a56db; font-size: 0.82rem; flex-shrink: 0;
    }
    .contact-info {
      display: flex; flex-direction: column;
      .contact-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
      .contact-value { font-size: 0.82rem; color: #1e293b; font-weight: 600; margin-top: 2px; word-break: break-all; }
    }

    /* Phone validation error */
    .field-error {
      color: #dc2626; font-size: 0.75rem; font-weight: 600; margin-top: 6px;
      display: flex; align-items: center; gap: 5px;
      i { font-size: 0.7rem; }
    }
    .input-error {
      border-color: #dc2626 !important;
      &:focus { box-shadow: 0 0 0 3px rgba(220,38,38,0.15) !important; }
    }
    
    .avatar-wrapper {
      position: relative; width: 100px; height: 100px; margin: 0 auto;
      .online-indicator {
        position: absolute; bottom: 4px; right: 4px; width: 14px; height: 14px;
        background: #10b981; border: 3px solid #fff; border-radius: 50%;
      }
    }
    
    .profile-avatar {
      width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #1a56db 0%, #3f83f8 100%);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 700; border: 4px solid #fff; box-shadow: 0 10px 28px rgba(37,99,235,0.2);
      overflow:hidden; transition:transform 0.18s ease, box-shadow 0.18s ease;
      img { width:100%; height:100%; object-fit:cover; display:block; }
      &:hover { transform:scale(1.04); box-shadow:0 16px 36px rgba(37,99,235,0.28); }
    }
    .recapture-link {
      margin-top:16px; border:1px solid #dbe4f0; background:#fff; color:#1a56db; border-radius:999px;
      padding:8px 14px; font-size:0.78rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px;
      transition:all 0.18s ease;
      &:hover { background:#eef6ff; transform:translateY(-1px); }
    }
    
    /* Details Cards */
    .details-card {
      padding: 28px; margin-bottom: 24px;
      h3 {
        font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 24px;
        display: flex; align-items: center; gap: 8px;
        i { color: #1a56db; font-size: 1.1rem; }
      }
    }
    
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    .form-group {
      margin-bottom: 0;
      .form-label { font-size: 0.78rem; font-weight: 600; color: #64748b; margin-bottom: 6px; display: block; }
    }
    
    .input-icon-wrapper {
      position: relative;
      .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.88rem; }
      .form-control { padding-left: 38px; }
    }
    
    .form-control {
      width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px;
      font-size: 0.88rem; color: #1e293b; background: #fff; transition: all 0.15s;
      &:focus { border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,0.15); outline: none; }
      &:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
    }
    
    .form-actions { display: flex; justify-content: flex-end; margin-top: 24px; }
    
    .btn-primary {
      background: #1a56db; color: #fff; border: none; border-radius: 8px;
      padding: 11px 22px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
      display: flex; align-items: center; gap: 8px; transition: background 0.15s;
      &:hover { background: #1e429f; }
    }
    .btn-secondary {
      background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 11px 22px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
      display: flex; align-items: center; gap: 8px; transition: all 0.15s;
      &:hover { background: #e5e7eb; color: #111827; }
    }
    
    /* Error & Success Messages */
    .error-msg { background: #fef2f2; color: #dc2626; padding: 12px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .success-msg { background: #ecfdf5; color: #059669; padding: 12px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    
    /* Metadata info rows */
    .info-rows { display: flex; flex-direction: column; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center; padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }
    }
    .info-label { font-size: 0.82rem; color: #64748b; font-weight: 500; }
    .info-value { font-size: 0.85rem; color: #1e293b; font-weight: 600; }
    
    .role-badge { background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-completed { background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .badge-pending { background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:6px; }
    .security-status {
      display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; border-radius:12px;
      background:linear-gradient(135deg, #f8fbff, #eef6ff); border:1px solid #dbeafe; margin-bottom:18px;
      strong { display:block; color:#0f172a; font-size:0.9rem; }
      span { color:#64748b; font-size:0.78rem; }
    }

    @media(max-width: 992px) {
      .profile-layout { grid-template-columns: 1fr; }
      .sidebar-left { position: static; }
    }
    @media(max-width: 480px) {
      .details-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  userId = 0;
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  role = '';
  currency = '';
  profilePicture = '';
  faceEnabled = false;
  showRecapture = false;
  loading = false;
  phoneError = '';
  
  // Notifications
  successMessage = '';
  
  // Password change state
  currentPwd = '';
  newPwd = '';
  confirmNewPwd = '';
  pwdError = '';
  pwdSuccess = '';

  constructor(private authService: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.api.getProfile().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.email = user.email;
        this.phone = user.phoneNumber || '';
        this.role = user.role;
        this.currency = user.currency || 'INR';
        this.profilePicture = user.profilePicture || '';
        this.faceEnabled = !!user.faceEnabled;

        // Synchronize in authService
        this.authService.updateUser(user);
      }
    });
  }

  onPhoneInput() {
    this.phoneError = '';
  }

  saveChanges() {
    this.phoneError = '';
    const trimmedPhone = this.phone.trim();

    if (trimmedPhone.length > 0 && trimmedPhone.length !== 10) {
      this.phoneError = 'Phone number must be exactly 10 digits.';
      return;
    }
    if (trimmedPhone.length > 0 && !/^\d{10}$/.test(trimmedPhone)) {
      this.phoneError = 'Phone number must contain only digits.';
      return;
    }

    this.loading = true;
    this.api.updateProfile({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phoneNumber: trimmedPhone
    }).subscribe({
      next: (user) => {
        this.authService.updateUser(user);
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.phone = user.phoneNumber || '';
        this.successMessage = 'Profile details synchronized and saved successfully!';
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3500);
      },
      error: () => {
        this.loading = false;
        alert('Failed to update profile details.');
      }
    });
  }

  saveFaceCapture(result: FaceCaptureResult) {
    this.loading = true;
    this.api.updateFaceProfile(result).subscribe({
      next: (user) => {
        this.authService.updateUser(user);
        this.profilePicture = user.profilePicture || '';
        this.faceEnabled = !!user.faceEnabled;
        this.showRecapture = false;
        this.successMessage = 'Face login profile updated successfully!';
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3500);
      },
      error: (err) => {
        this.loading = false;
        this.pwdError = err.error?.message || 'Failed to update face login profile.';
      }
    });
  }

  changePassword() {
    this.pwdError = '';
    this.pwdSuccess = '';

    if (!this.currentPwd) {
      this.pwdError = 'Please verify your current password.';
      return;
    }

    if (this.newPwd.length < 8) {
      this.pwdError = 'New password must be at least 8 characters long.';
      return;
    }

    if (this.newPwd !== this.confirmNewPwd) {
      this.pwdError = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.api.changePassword({
      currentPassword: this.currentPwd,
      newPassword: this.newPwd
    }).subscribe({
      next: () => {
        this.pwdSuccess = 'Security credentials updated successfully!';
        this.currentPwd = '';
        this.newPwd = '';
        this.confirmNewPwd = '';
        this.loading = false;
        setTimeout(() => this.pwdSuccess = '', 3500);
      },
      error: (err) => {
        this.pwdError = err.error?.message || 'Failed to update security credentials.';
        this.loading = false;
      }
    });
  }
}
