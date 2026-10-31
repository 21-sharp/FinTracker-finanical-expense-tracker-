import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { FaceCaptureComponent, FaceCaptureResult } from '../../shared/face-capture/face-capture.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaceCaptureComponent],
  template: `
    <div class="auth-page">
      <div class="auth-image-section">
        <div class="image-content">
          <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" alt="Business Success Banner">
          <h2>Join FinTrack Today</h2>
          <p>Create your account and start managing your finances professionally. Trusted by organizations worldwide.</p>
        </div>
      </div>
      <div class="auth-form-section">
        <div class="auth-card">
          <div class="auth-logo">
            <i class="fas fa-chart-line"></i> FinTrack
          </div>

          <!-- STEP 1: REGISTRATION FORM -->
          <div *ngIf="step === 'register'" class="step-container">
            <div class="auth-heading">
              <h2>Join FinTrack Today</h2>
              <p>Create your account and start managing your finances professionally. Trusted by organizations worldwide.</p>
            </div>
            <div class="error-msg" *ngIf="error"><i class="fas fa-exclamation-circle"></i> {{error}}</div>
            <form (ngSubmit)="onRegister()" autocomplete="off">
              <div class="name-row">
                <div class="form-group"><label>First Name</label><input type="text" [(ngModel)]="firstName" name="fn" class="form-control" placeholder="Enter first name" autocomplete="off" required></div>
                <div class="form-group"><label>Last Name</label><input type="text" [(ngModel)]="lastName" name="ln" class="form-control" placeholder="Enter last name" autocomplete="off" required></div>
              </div>
              <div class="form-group"><label>Email Address</label><input type="email" [(ngModel)]="email" name="email" class="form-control" placeholder="name@gmail.com" autocomplete="off" required></div>
              <div class="form-group"><label>Phone Number</label><input type="tel" [(ngModel)]="phone" name="phone" class="form-control" placeholder="10-digit number" autocomplete="off"></div>
              <div class="form-group">
                <label>Password</label>
                <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" name="pw" class="form-control" placeholder="Min 8 characters" autocomplete="new-password" required minlength="8">
                <button type="button" class="pw-toggle" (click)="showPw=!showPw"><i [class]="showPw ? 'fas fa-eye-slash' : 'fas fa-eye'"></i></button>
              </div>
              <div class="form-group">
                <label>Confirm Password</label>
                <input [type]="showCpw ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="cpw" class="form-control" placeholder="Re-enter password" autocomplete="new-password" required>
                <button type="button" class="pw-toggle" (click)="showCpw=!showCpw"><i [class]="showCpw ? 'fas fa-eye-slash' : 'fas fa-eye'"></i></button>
              </div>
              <app-face-capture
                title="Face ID Enrollment"
                captureLabel="Use This Face"
                hint="This photo becomes your profile avatar and the 128-point face descriptor enables Face Login."
                (captured)="onFaceCaptured($event)">
              </app-face-capture>
              <div class="success-msg" *ngIf="profilePicture && faceEmbedding.length">
                <i class="fas fa-circle-check"></i> Face profile captured and ready for secure enrollment.
              </div>
              <button type="submit" class="btn-submit" [disabled]="loading">
                <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
                <span *ngIf="!loading">Send OTP & Create Account</span>
              </button>
            </form>
            <p class="auth-footer">Already have an account? <a routerLink="/login">Sign In</a></p>
          </div>

          <!-- STEP 2: OTP VERIFICATION -->
          <div *ngIf="step === 'otp'" class="step-container animate-slide-up">
            <!-- Pulsing Envelope Illustration -->
            <div class="otp-pulse-wrapper">
              <div class="otp-pulse-ring"></div>
              <div class="otp-pulse-ring-inner"></div>
              <div class="otp-envelope-circle">
                <i class="fas fa-envelope-open-text envelope-icon"></i>
              </div>
            </div>

            <div class="auth-heading text-center">
              <h2>Verify Your Email</h2>
              <p>We have dispatched a 6-digit verification code to</p>
              <strong class="email-highlight">{{email}}</strong>
            </div>
            
            <div class="error-msg" *ngIf="error"><i class="fas fa-exclamation-circle"></i> {{error}}</div>
            <div class="success-msg" *ngIf="otpSuccess"><i class="fas fa-check-circle"></i> {{otpSuccess}}</div>
            <div class="dev-otp-banner" *ngIf="devOtpCode">
              <strong>Development OTP:</strong>
              <span class="dev-otp-code">{{ devOtpCode }}</span>
              <small>{{ devOtpHint }}</small>
            </div>
            
            <div class="otp-section">
              <div class="otp-inputs">
                <input *ngFor="let d of otpDigits; let i = index; trackBy: trackByIndex"
                       type="text" inputmode="numeric" maxlength="1" [value]="otpDigits[i]"
                       (input)="onOtpInput($event, i)"
                       (keydown)="onOtpKeyDown($event, i)"
                       (paste)="onOtpPaste($event)"
                       class="otp-input" #otpInput>
              </div>
              <button class="btn-submit" (click)="verifyOtp()" [disabled]="loading" style="margin-top:24px">
                <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
                <span *ngIf="!loading"><i class="fas fa-shield-check"></i> Authorize & Register Account</span>
              </button>
              <div class="resend-link">
                Didn't receive the code?
                <button (click)="resendOtp()" [disabled]="resendTimer > 0" class="btn-resend">
                  {{resendTimer > 0 ? 'Resend in ' + resendTimer + 's' : 'Resend Verification OTP'}}
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 3: WELCOME -->
          <div *ngIf="step === 'welcome'" class="step-container welcome-lux-section">
            <div class="success-ring-celebration">
              <div class="glow-ring"></div>
              <div class="glow-ring-inner"></div>
              <div class="glow-ring-center">
                <i class="fas fa-check"></i>
              </div>
            </div>

            <h2 class="welcome-title">Welcome to FinTrack Pro!</h2>
            <p class="welcome-desc">Your corporate digital financial account is officially configured and verified successfully.</p>
            
            <div class="welcome-features-list">
              <div class="feature-bullet"><i class="fas fa-check-circle"></i> Real-time Ledger Tracking</div>
              <div class="feature-bullet"><i class="fas fa-check-circle"></i> Adaptive Column Analytics</div>
              <div class="feature-bullet"><i class="fas fa-check-circle"></i> Interactive SQL Data Upload</div>
            </div>

            <button class="btn-submit btn-welcome-success animate-pulse-btn" (click)="goToDashboard()" style="margin-top:28px">
              <span>Go to Enterprise Dashboard <i class="fas fa-arrow-right"></i></span>
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.scss'],
  styles: [`
    .step-container {
      animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Pulsing Envelope Animation */
    .otp-pulse-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 10px auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .otp-envelope-circle {
        width: 64px; height: 64px; border-radius: 50%;
        background: linear-gradient(135deg, #1a56db 0%, #3f83f8 100%);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 1.6rem; z-index: 3;
        box-shadow: 0 4px 15px rgba(26,86,219,0.3);
      }
      
      .otp-pulse-ring {
        position: absolute; width: 80px; height: 80px; border-radius: 50%;
        background: rgba(26,86,219,0.15); z-index: 1;
        animation: pulseOut 2s infinite ease-in-out;
      }
      .otp-pulse-ring-inner {
        position: absolute; width: 68px; height: 68px; border-radius: 50%;
        background: rgba(26,86,219,0.25); z-index: 2;
        animation: pulseOutInner 2s infinite ease-in-out;
      }
    }
    
    @keyframes pulseOut {
      0% { transform: scale(0.9); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    @keyframes pulseOutInner {
      0% { transform: scale(0.95); opacity: 0.8; }
      100% { transform: scale(1.15); opacity: 0; }
    }

    .email-highlight {
      color: #1a56db; font-size: 0.95rem; margin-top: 4px; display: block;
    }
    
    /* Premium OTP Inputs */
    .otp-inputs {
      display: flex; justify-content: space-between; gap: 10px; margin-top: 20px;
      
      .otp-input {
        width: 48px; height: 52px; border: 2px solid #d1d5db; border-radius: 10px;
        text-align: center; font-size: 1.4rem; font-weight: 700; color: #1e293b;
        background: #fff; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        
        &:focus {
          border-color: #1a56db;
          box-shadow: 0 0 0 4px rgba(26,86,219,0.12);
          transform: translateY(-2px);
          outline: none;
        }
      }
    }
    
    .dev-otp-banner {
      margin: 12px 0 16px; padding: 14px 16px; border-radius: 10px;
      background: #fffbeb; border: 1px solid #fde68a; text-align: center;
      strong { display: block; font-size: 0.8rem; color: #92400e; margin-bottom: 6px; }
      .dev-otp-code {
        display: block; font-size: 1.75rem; font-weight: 800; letter-spacing: 8px;
        color: #1a56db; font-family: ui-monospace, monospace;
      }
      small { display: block; margin-top: 6px; color: #78716c; font-size: 0.75rem; }
    }

    .btn-resend {
      background: none; border: none; color: #1a56db; font-weight: 600; font-size: 0.8rem;
      cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.15s;
      &:hover { background: #eef2ff; text-decoration: underline; }
      &:disabled { color: #94a3b8; cursor: not-allowed; &:hover { background: none; text-decoration: none; } }
    }

    /* Welcome Celebration Luxury Section */
    .welcome-lux-section {
      text-align: center;
      padding: 16px 0;
      
      .success-ring-celebration {
        position: relative; width: 100px; height: 100px; margin: 0 auto 24px;
        display: flex; align-items: center; justify-content: center;
        
        .glow-ring {
          position: absolute; width: 100px; height: 100px; border-radius: 50%;
          background: rgba(16,185,129,0.1); z-index: 1;
          animation: pulseOut 2.5s infinite ease-in-out;
        }
        .glow-ring-inner {
          position: absolute; width: 84px; height: 84px; border-radius: 50%;
          background: rgba(16,185,129,0.2); z-index: 2;
          animation: pulseOutInner 2.5s infinite ease-in-out;
        }
        .glow-ring-center {
          width: 68px; height: 68px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 2rem; z-index: 3;
          box-shadow: 0 6px 20px rgba(16,185,129,0.3);
        }
      }
      
      .welcome-title { font-size: 1.55rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
      .welcome-desc { color: #64748b; font-size: 0.9rem; line-height: 1.6; padding: 0 12px; }
    }
    
    .welcome-features-list {
      background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px;
      padding: 14px 20px; margin: 20px 0; display: inline-block; text-align: left;
      
      .feature-bullet {
        font-size: 0.8rem; color: #475569; font-weight: 600; margin: 8px 0;
        display: flex; align-items: center; gap: 8px;
        i { color: #10b981; font-size: 0.9rem; }
      }
    }
    
    .btn-welcome-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      box-shadow: 0 4px 15px rgba(16,185,129,0.25) !important;
      border: none !important;
      &:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      }
    }
    
    .animate-pulse-btn {
      animation: pulseBtn 2s infinite alternate;
    }
    @keyframes pulseBtn {
      from { transform: scale(1); }
      to { transform: scale(1.025); }
    }
  `]
})
export class RegisterComponent {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  step: 'register' | 'otp' | 'welcome' = 'register';
  firstName = ''; lastName = ''; email = ''; phone = ''; password = ''; confirmPassword = '';
  showPw = false; showCpw = false;
  loading = false; error = ''; otpSuccess = '';
  devOtpCode = ''; devOtpHint = '';
  otpDigits = ['', '', '', '', '', ''];
  resendTimer = 0;
  profilePicture = '';
  faceEmbedding: number[] = [];
  private resendInterval: any;

  constructor(private auth: AuthService, private router: Router, private http: HttpClient) {}

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onFaceCaptured(result: FaceCaptureResult) {
    this.profilePicture = result.profilePicture;
    this.faceEmbedding = result.faceEmbedding;
    this.error = '';
  }

  onRegister() {
    this.loading = true; this.error = '';

    // Validate First Name
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (!this.firstName || this.firstName.trim().length < 2) {
      this.error = 'First name must be at least 2 characters long.'; this.loading = false; return;
    }
    if (!nameRegex.test(this.firstName.trim())) {
      this.error = 'First name must contain only letters and single spaces.'; this.loading = false; return;
    }

    // Validate Last Name
    if (!this.lastName || this.lastName.trim().length < 1) {
      this.error = 'Last name is required.'; this.loading = false; return;
    }
    if (!nameRegex.test(this.lastName.trim())) {
      this.error = 'Last name must contain only letters and single spaces.'; this.loading = false; return;
    }

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!this.email || !emailRegex.test(this.email.trim().toLowerCase())) {
      this.error = 'Please enter a valid Gmail address (ending in @gmail.com).'; this.loading = false; return;
    }

    // Validate Phone
    const phoneRegex = /^[0-9]{10}$/;
    if (this.phone && this.phone.trim() !== '' && !phoneRegex.test(this.phone.trim())) {
      this.error = 'Phone number must be exactly 10 digits.'; this.loading = false; return;
    }

    // Validate Password
    if (!this.password || this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.'; this.loading = false; return;
    }

    // Validate Confirm Password
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.'; this.loading = false; return;
    }

    if (!this.profilePicture || this.faceEmbedding.length !== 128) {
      this.error = 'Please capture your face before creating the account.'; this.loading = false; return;
    }

    this.sendOtpRequest();
  }

  private sendOtpRequest() {
    this.http.post<any>('http://localhost:8080/api/auth/send-otp', { email: this.email.trim().toLowerCase() }).subscribe({
      next: (res) => {
        this.loading = false;
        this.step = 'otp';
        this.applyOtpResponse(res);
        this.startResendTimer();
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  private applyOtpResponse(res: { message?: string; otp?: string; devMode?: string }) {
    this.otpSuccess = res.message || 'OTP sent.';
    if (res.otp) {
      this.devOtpCode = res.otp;
      this.devOtpHint = res.devMode === 'true'
        ? 'SMTP is not configured — use this code to continue.'
        : '';
      this.otpDigits = res.otp.split('');
    } else {
      this.devOtpCode = '';
      this.devOtpHint = '';
    }
  }

  onOtpInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    // Keep only digits
    val = val.replace(/\D/g, '');
    
    // Only take the last character typed if they managed to type more than one (e.g. fast typing)
    if (val.length > 1) {
      val = val.substring(val.length - 1);
    }
    
    input.value = val;
    this.otpDigits[index] = val;
    
    if (val !== '' && index < 5) {
      setTimeout(() => {
        const inputs = this.otpInputs.toArray();
        inputs[index + 1].nativeElement.focus();
      }, 10);
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        // If current is empty, focus previous and clear it
        event.preventDefault();
        const inputs = this.otpInputs.toArray();
        this.otpDigits[index - 1] = '';
        inputs[index - 1].nativeElement.value = '';
        inputs[index - 1].nativeElement.focus();
      } else {
        // Clear current
        this.otpDigits[index] = '';
      }
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '').split('').slice(0, 6);
    digits.forEach((d, i) => { this.otpDigits[i] = d; });
    
    // Focus the last filled box or first empty box
    const focusIndex = Math.min(digits.length, 5);
    setTimeout(() => {
      const inputs = this.otpInputs.toArray();
      if (inputs[focusIndex]) {
        inputs[focusIndex].nativeElement.focus();
      }
    }, 50);
  }

  verifyOtp() {
    const otp = this.otpDigits.join('');
    if (otp.length !== 6) {
      this.error = 'Please enter the complete 6-digit OTP.'; return;
    }

    this.loading = true; this.error = '';

    this.http.post('http://localhost:8080/api/auth/verify-otp', {
      email: this.email.trim().toLowerCase(),
      otp: otp
    }).subscribe({
      next: () => {
        // OTP verified, now register the user
        this.auth.register({
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          email: this.email.trim().toLowerCase(),
          phoneNumber: this.phone.trim(),
          password: this.password,
          profilePicture: this.profilePicture,
          faceEmbedding: this.faceEmbedding
        }).subscribe({
          next: () => { this.loading = false; this.step = 'welcome'; },
          error: (e) => { this.loading = false; this.error = e.error?.message || 'Registration failed.'; }
        });
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Invalid OTP. Please try again.';
      }
    });
  }

  resendOtp() {
    this.error = ''; this.otpSuccess = '';
    this.http.post<any>('http://localhost:8080/api/auth/send-otp', { email: this.email.trim().toLowerCase() }).subscribe({
      next: (res) => {
        this.applyOtpResponse(res);
        this.startResendTimer();
      },
      error: () => { this.error = 'Failed to resend OTP.'; }
    });
  }

  startResendTimer() {
    this.resendTimer = 60;
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) clearInterval(this.resendInterval);
    }, 1000);
  }

  goToDashboard() {
    this.router.navigate(['/app/dashboard']);
  }
}
