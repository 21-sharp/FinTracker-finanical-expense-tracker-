import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { FaceCaptureComponent, FaceCaptureResult } from '../shared/face-capture/face-capture.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, FaceCaptureComponent],
  template: `
    <div class="page">
      <div class="page-header"><div><h1>Settings</h1><p>Manage your application preferences</p></div></div>

      <div class="success-msg" *ngIf="successMsg"><i class="fas fa-check-circle"></i> {{successMsg}}</div>
      <div class="error-msg" *ngIf="errorMsg"><i class="fas fa-exclamation-circle"></i> {{errorMsg}}</div>

      <div class="settings-grid">
        <!-- Profile Settings -->
        <div class="card setting-card">
          <h3><i class="fas fa-user"></i> Profile Settings</h3>
          <div class="settings-avatar-row">
            <div class="settings-avatar">
              <img *ngIf="profile.profilePicture" [src]="profile.profilePicture" alt="Profile avatar">
              <span *ngIf="!profile.profilePicture">{{(profile.firstName || 'U').charAt(0)}}{{(profile.lastName || '').charAt(0)}}</span>
            </div>
            <div>
              <strong>Account Photo</strong>
              <p>{{profile.faceEnabled ? 'Face login active' : 'Face login not enrolled'}}</p>
              <button type="button" class="btn-mini" (click)="showFaceRecapture = !showFaceRecapture">
                <i class="fas fa-camera"></i> Recapture
              </button>
            </div>
          </div>
          <app-face-capture
            *ngIf="showFaceRecapture"
            title="Recapture Face"
            captureLabel="Update Face"
            [compact]="true"
            (captured)="saveFace($event)">
          </app-face-capture>
          <div class="field-warning" *ngIf="profileWarning"><i class="fas fa-triangle-exclamation"></i> {{profileWarning}}</div>
          <div class="form-group"><label class="form-label">First Name</label><input type="text" [(ngModel)]="profile.firstName" class="form-control"></div>
          <div class="form-group"><label class="form-label">Last Name</label><input type="text" [(ngModel)]="profile.lastName" class="form-control"></div>
          <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" [value]="profile.email" disabled></div>
          <div class="form-group"><label class="form-label">Phone</label><input type="tel" [(ngModel)]="profile.phoneNumber" class="form-control"></div>
          <button class="btn-primary" (click)="saveProfile()" [disabled]="loading"><i class="fas fa-save"></i> Save Changes</button>
        </div>

        <!-- Password Update -->
        <div class="card setting-card">
          <h3><i class="fas fa-lock"></i> Password Update</h3>
          <div class="field-warning" *ngIf="passwordWarning"><i class="fas fa-triangle-exclamation"></i> {{passwordWarning}}</div>
          <div class="form-group"><label class="form-label">Current Password</label><input type="password" [(ngModel)]="pwForm.currentPassword" class="form-control" placeholder="Enter current password"></div>
          <div class="form-group"><label class="form-label">New Password</label><input type="password" [(ngModel)]="pwForm.newPassword" class="form-control" placeholder="Enter new password (min 8 chars)"></div>
          <div class="form-group"><label class="form-label">Confirm New Password</label><input type="password" [(ngModel)]="pwForm.confirmPassword" class="form-control" placeholder="Re-enter new password"></div>
          <button class="btn-primary" (click)="updatePassword()" [disabled]="loading"><i class="fas fa-key"></i> Update Password</button>
        </div>

        <!-- Notifications (Mock/Client-side only) -->
        <div class="card setting-card">
          <h3><i class="fas fa-bell"></i> Notification Settings</h3>
          <div class="setting-item"><div><strong>Budget Alerts</strong><p>Get notified when approaching budget limits</p></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
          <div class="setting-item"><div><strong>Goal Reminders</strong><p>Weekly goal progress updates</p></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
          <div class="setting-item"><div><strong>Bill Reminders</strong><p>Upcoming bill due date notifications</p></div><label class="switch"><input type="checkbox"><span class="slider"></span></label></div>
          <div class="setting-item"><div><strong>Transaction Alerts</strong><p>Real-time transaction notifications</p></div><label class="switch"><input type="checkbox" checked><span class="slider"></span></label></div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
    .settings-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
    .setting-card { padding:24px;
      h3 { font-size:0.95rem; font-weight:700; color:#1e293b; margin-bottom:20px; i { margin-right:8px; color:#1a56db; } } }
    .settings-avatar-row { display:flex; align-items:center; gap:14px; padding:14px; border-radius:14px; background:linear-gradient(135deg,#f8fbff,#eef6ff); border:1px solid #dbeafe; margin-bottom:18px;
      strong{display:block;color:#0f172a;font-size:0.9rem;} p{margin:2px 0 8px;color:#64748b;font-size:0.76rem;} }
    .settings-avatar { width:64px; height:64px; border-radius:50%; overflow:hidden; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:1.25rem; background:linear-gradient(135deg,#0ea5e9,#2563eb); border:3px solid #fff; box-shadow:0 10px 24px rgba(37,99,235,0.2);
      img{width:100%;height:100%;object-fit:cover;display:block;} }
    .btn-mini { border:1px solid #bfdbfe; background:#fff; color:#1d4ed8; border-radius:999px; padding:6px 10px; font-size:0.74rem; font-weight:800; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
    .setting-item { display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid #f1f5f9;
      &:last-child { border-bottom:none; }
      strong { font-size:0.88rem; display:block; color:#1e293b; }
      p { font-size:0.75rem; color:#94a3b8; margin:2px 0 0; } }
    .field-warning { display:flex; align-items:center; gap:8px; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:10px 12px; font-size:0.82rem; font-weight:700; margin-bottom:14px; }
    .switch { position:relative; width:44px; height:24px; flex-shrink:0;
      input { opacity:0; width:0; height:0;
        &:checked + .slider { background:#1a56db; }
        &:checked + .slider::before { transform:translateX(20px); } }
      .slider { position:absolute; inset:0; background:#e2e8f0; border-radius:24px; cursor:pointer; transition:0.2s;
        &::before { content:''; position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; left:3px; bottom:3px; transition:0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.1); } } }
    .success-msg { background:#ecfdf5; color:#059669; padding:12px 16px; border-radius:8px; border:1px solid #a7f3d0; margin-bottom:20px; font-size:0.85rem; font-weight:600; }
    .error-msg { background:#fef2f2; color:#dc2626; padding:12px 16px; border-radius:8px; border:1px solid #fecaca; margin-bottom:20px; font-size:0.85rem; font-weight:600; }
    @media(max-width:768px) { .settings-grid{grid-template-columns:1fr;} }
  `]
})
export class SettingsComponent implements OnInit {
  profile: any = { firstName: '', lastName: '', email: '', phoneNumber: '', currency: 'INR' };
  pwForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  loading = false;
  successMsg = '';
  errorMsg = '';
  profileWarning = '';
  passwordWarning = '';
  showFaceRecapture = false;

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.getProfile().subscribe({
      next: (data) => { this.profile = data; },
      error: (err) => { this.errorMsg = 'Failed to load profile details.'; }
    });
  }

  saveFace(result: FaceCaptureResult) {
    this.loading = true;
    this.api.updateFaceProfile(result).subscribe({
      next: (data) => {
        this.profile = data;
        this.authService.updateUser(data);
        this.showFaceRecapture = false;
        this.successMsg = 'Face login and account photo updated successfully!';
        this.loading = false;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to update face profile.';
        this.loading = false;
      }
    });
  }

  saveProfile() {
    this.profileWarning = '';
    if (!this.profile.firstName?.trim() || !this.profile.lastName?.trim() || !this.profile.phoneNumber?.trim()) {
      this.profileWarning = 'Please fill all profile fields before saving.';
      return;
    }
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.api.updateProfile(this.profile).subscribe({
      next: (data) => {
        this.profile = data;
        this.successMsg = 'Profile updated successfully!';
        this.loading = false;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to update profile.';
        this.loading = false;
        setTimeout(() => this.errorMsg = '', 4000);
      }
    });
  }

  updatePassword() {
    this.passwordWarning = '';
    if (!this.pwForm.currentPassword || !this.pwForm.newPassword || !this.pwForm.confirmPassword) {
      this.passwordWarning = 'Please fill all password fields.';
      return;
    }
    if (this.pwForm.newPassword !== this.pwForm.confirmPassword) {
      this.passwordWarning = 'New passwords do not match.';
      return;
    }
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.api.changePassword(this.pwForm).subscribe({
      next: () => {
        this.successMsg = 'Password updated successfully!';
        this.pwForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.loading = false;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to update password.';
        this.loading = false;
        setTimeout(() => this.errorMsg = '', 4000);
      }
    });
  }
}
