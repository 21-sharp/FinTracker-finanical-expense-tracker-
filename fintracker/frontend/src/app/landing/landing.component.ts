import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <nav class="navbar navbar-expand-lg navbar-light sticky-top landing-navbar">
        <div class="container-fluid px-4 px-md-5 px-lg-6 max-width-container">
          <a class="navbar-brand-custom d-flex align-items-center gap-2">
            <i class="fas fa-chart-line"></i> <span>FinTrack</span>
          </a>
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#landingNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="landingNav">
            <div class="navbar-nav ms-auto align-items-lg-center gap-3">
              <a routerLink="/login" class="nav-link fw-semibold px-3 text-secondary-hover">Sign In</a>
              <a routerLink="/register" class="btn btn-primary px-4 py-2 rounded-3 shadow-sm btn-get-started">Get Started</a>
            </div>
          </div>
        </div>
      </nav>

      <header class="hero-section py-5 position-relative overflow-hidden">
        <!-- Transparent visual finance layout related to FinTrack in the background -->
        <div class="hero-bg-graphic" aria-hidden="true">
          <div class="glow-orb orb-1"></div>
          <div class="glow-orb orb-2"></div>
          <svg class="bg-chart-line" viewBox="0 0 1440 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 420C200 400 350 250 550 290C750 330 900 150 1100 200C1300 250 1400 100 1540 70" stroke="url(#chartGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 12" opacity="0.12"/>
            <path d="M-100 320C150 280 400 380 650 220C900 60 1150 200 1350 90C1450 35 1500 80 1540 60" stroke="url(#chartGrad2)" stroke-width="4" stroke-linecap="round" opacity="0.08"/>
            <circle cx="550" cy="290" r="8" fill="rgba(30, 64, 175, 0.2)"/>
            <circle cx="1100" cy="200" r="10" fill="rgba(99, 102, 241, 0.2)"/>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stop-color="#1e40af"/>
                <stop offset="0.5" stop-color="#3b82f6"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
              <linearGradient id="chartGrad2" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#10b981"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="container py-lg-5 position-relative hero-content-wrapper">
          <div class="row align-items-center g-5">
            <div class="col-lg-6 hero-text-col">
              <span class="badge bg-primary-subtle text-primary mb-3 px-3 py-2 rounded-pill fw-semibold">Enterprise Finance Platform</span>
              <h1 class="display-5 fw-extrabold text-dark mb-3 hero-title">Professional financial management for your organization</h1>
              <p class="lead text-secondary mb-4 hero-desc">
                Track transactions, manage budgets, set goals, and generate reports — all in one secure, modern dashboard.
              </p>
              <div class="d-flex flex-wrap gap-3 mb-4">
                <a routerLink="/register" class="btn btn-primary btn-lg px-4 py-3 rounded-3 shadow-md btn-hero-cta">
                  <i class="fas fa-arrow-right me-2"></i>Create free account
                </a>
                <a routerLink="/login" class="btn btn-outline-primary btn-lg px-4 py-3 rounded-3 btn-hero-sec">Sign in</a>
              </div>
              
              <!-- Frosted Glass highlight card for Stats data -->
              <div class="stats-highlight-card p-4 rounded-4 mt-4 border">
                <div class="row g-3 text-center text-lg-start">
                  <div class="col-4 border-end border-light-subtle">
                    <div class="h3 fw-extrabold mb-0 text-primary-gradient">10K+</div>
                    <small class="text-secondary fw-semibold">Active users</small>
                  </div>
                  <div class="col-4 border-end border-light-subtle">
                    <div class="h3 fw-extrabold mb-0 text-primary-gradient">₹50Cr+</div>
                    <small class="text-secondary fw-semibold">Tracked</small>
                  </div>
                  <div class="col-4">
                    <div class="h3 fw-extrabold mb-0 text-primary-gradient">99.9%</div>
                    <small class="text-secondary fw-semibold">Uptime</small>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="card border-0 shadow-2xl overflow-hidden rounded-4 dashboard-preview-card">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" class="card-img-top" alt="FinTrack dashboard preview">
                <div class="card-body bg-light border-top border-light">
                  <p class="mb-0 small text-muted d-flex align-items-center gap-2"><i class="fas fa-shield-alt text-success"></i> JWT-secured · SQL import · Real-time insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="py-5 features-section position-relative">
        <!-- Colored background blobs for feature section shading -->
        <div class="features-bg-shade-1" aria-hidden="true"></div>
        <div class="features-bg-shade-2" aria-hidden="true"></div>

        <div class="container py-lg-4 position-relative" style="z-index: 2;">
          <div class="text-center mb-5">
            <h2 class="fw-bold section-title">Everything you need to manage finances</h2>
            <p class="text-secondary mx-auto" style="max-width: 560px;">Built for teams who want clarity, control, and beautiful reporting without spreadsheet chaos.</p>
          </div>
          <div class="row g-4">
            <div class="col-md-6 col-lg-4" *ngFor="let f of features">
              <div class="card h-100 border shadow-sm feature-card" 
                   [style.border-top]="'5px solid ' + f.color"
                   [style.background]="'linear-gradient(180deg, ' + f.color + '0e 0%, #ffffff 100%)'"
                   [style.--card-glow-color]="f.color + '22'">
                <div class="card-body p-4">
                  <div class="feature-icon rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
                    [style.background]="f.color + '18'" [style.color]="f.color">
                    <i [class]="f.icon + ' fa-lg'"></i>
                  </div>
                  <h3 class="h5 fw-bold text-dark mb-2">{{ f.title }}</h3>
                  <p class="text-secondary small mb-0">{{ f.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 bg-primary text-white position-relative overflow-hidden">
        <div class="cta-overlay-glow" aria-hidden="true"></div>
        <div class="container text-center py-4 position-relative" style="z-index: 2;">
          <h2 class="fw-bold mb-2">Ready to take control of your finances?</h2>
          <p class="opacity-75 mb-4">Import sample SQL data in seconds and explore your dashboard instantly.</p>
          <a routerLink="/register" class="btn btn-light btn-lg text-primary fw-semibold px-5 py-3 rounded-3 shadow-md btn-cta-start">
            <i class="fas fa-user-plus me-2"></i>Create your account
          </a>
        </div>
      </section>

      <footer class="py-4 border-top bg-white">
        <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <span class="fw-bold text-primary d-flex align-items-center gap-2"><i class="fas fa-chart-line"></i> FinTrack <span class="text-muted fw-normal">© 2026</span></span>
          <div class="d-flex gap-4 small">
            <a href="#" class="text-secondary text-decoration-none hover-link">Privacy</a>
            <a href="#" class="text-secondary text-decoration-none hover-link">Terms</a>
            <a href="#" class="text-secondary text-decoration-none hover-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; overflow-x: hidden; }
    
    /* Bigger Logo Title & Spacious Shaded Navbar */
    .landing-navbar {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1.5px solid rgba(226, 232, 240, 0.7);
      box-shadow: 0 4px 30px rgba(15, 23, 42, 0.04);
      padding: 24px 0; /* Expanded Navbar height / vertical padding */
      transition: all 0.3s ease;
    }
    .max-width-container {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }
    .navbar-brand-custom {
      font-size: 2.1rem; /* Enlarger Header Title */
      font-weight: 850;
      letter-spacing: -0.8px;
      cursor: pointer;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      user-select: none;
      i {
        font-size: 2.2rem; /* Enlarged header icon */
        -webkit-text-fill-color: #3b82f6;
        filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.25));
        transition: transform 0.3s ease;
      }
      &:hover i {
        transform: rotate(5deg) scale(1.05);
      }
    }
    .text-secondary-hover {
      color: #475569;
      transition: color 0.2s;
      &:hover { color: #1e40af; }
    }
    .btn-get-started {
      background: #1e40af;
      border: none;
      font-weight: 600;
      padding: 10px 24px !important;
      transition: all 0.2s ease;
      &:hover { background: #1d4ed8; transform: translateY(-1px); }
    }

    /* Hero Section with Transparent Candlestick Background Layout */
    .hero-section {
      background: linear-gradient(180deg, #f0f4ff 0%, #f8fafc 100%);
      min-height: 640px;
      display: flex;
      align-items: center;
    }
    .hero-content-wrapper {
      z-index: 10;
    }
    .hero-bg-graphic {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
      
      /* Watermark finance background photo */
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80');
        background-size: cover;
        background-position: center;
        opacity: 0.07; /* Highly transparent watermark graph */
      }
      
      .bg-chart-line {
        position: absolute;
        bottom: 0; left: 0; width: 100%; height: auto;
        min-height: 400px;
      }
      .glow-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(90px);
        opacity: 0.14;
      }
      .orb-1 {
        top: -10%; left: 10%; width: 350px; height: 350px;
        background: #3b82f6;
      }
      .orb-2 {
        bottom: 10%; right: 5%; width: 450px; height: 450px;
        background: #818cf8;
      }
    }

    /* Hero Content Contrast / Highlights */
    .hero-title {
      font-size: 3.2rem;
      font-weight: 850;
      color: #0f172a !important;
      letter-spacing: -1.2px;
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(255, 255, 255, 0.7);
    }
    .hero-desc {
      font-size: 1.15rem;
      color: #334155 !important;
      line-height: 1.6;
      text-shadow: 0 1px 6px rgba(255, 255, 255, 0.8);
    }
    .btn-hero-cta {
      background: #1e40af;
      border: none;
      font-weight: 600;
      transition: all 0.2s;
      &:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(30, 64, 175, 0.25); }
    }
    .btn-hero-sec {
      border-color: #cbd5e1;
      color: #334155;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(4px);
      &:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
    }

    /* Stats Data Glass Highlight Card */
    .stats-highlight-card {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-color: rgba(255, 255, 255, 0.8) !important;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
    }
    .text-primary-gradient {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 1.85rem;
    }

    .shadow-2xl {
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.12);
    }
    .dashboard-preview-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid rgba(255,255,255,0.7) !important;
      &:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 30px 60px -10px rgba(15, 23, 42, 0.18); }
    }

    /* Features Section and Color Shaded Elements (Image 2) */
    .features-section {
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 50%, #f8fafc 100%);
    }
    .features-bg-shade-1 {
      position: absolute;
      top: 15%; left: -5%; width: 400px; height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .features-bg-shade-2 {
      position: absolute;
      bottom: 10%; right: -5%; width: 450px; height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .feature-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      position: relative;
      overflow: hidden;
      
      .feature-icon {
        width: 48px; height: 48px;
        border-radius: 10px;
        transition: transform 0.25s ease;
      }
      &:hover {
        transform: translateY(-6px);
        border-color: rgba(226, 232, 240, 0.2) !important;
        box-shadow: 0 20px 40px var(--card-glow-color, rgba(15, 23, 42, 0.08)) !important;
        .feature-icon {
          transform: scale(1.1) rotate(5deg);
        }
      }
    }
    
    .section-title {
      font-size: 2.3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    /* CTA Section */
    .bg-primary {
      background: linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%) !important;
    }
    .cta-overlay-glow {
      position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 600px; height: 300px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }
    .btn-cta-start {
      transition: transform 0.2s;
      &:hover { transform: translateY(-2px); }
    }
    
    .hover-link:hover {
      color: #1e40af !important;
    }
  `]
})
export class LandingComponent {
  features = [
    { title: 'Transaction tracking', desc: 'Record and categorize income and expenses with powerful filters and search.', icon: 'fas fa-exchange-alt', color: '#1a56db' },
    { title: 'Budget management', desc: 'Set monthly limits and monitor spending before you exceed your plan.', icon: 'fas fa-wallet', color: '#059669' },
    { title: 'Financial goals', desc: 'Define savings targets and track progress with clear visual indicators.', icon: 'fas fa-bullseye', color: '#d97706' },
    { title: 'Reports & exports', desc: 'Monthly summaries with Excel and PDF export for stakeholders.', icon: 'fas fa-chart-bar', color: '#7c3aed' },
    { title: 'Secure platform', desc: 'JWT authentication and role-based access for enterprise peace of mind.', icon: 'fas fa-shield-alt', color: '#dc2626' },
    { title: 'SQL import', desc: 'Bulk-load transactions from .sql files — download our samples to get started.', icon: 'fas fa-file-import', color: '#0284c7' },
  ];
}
