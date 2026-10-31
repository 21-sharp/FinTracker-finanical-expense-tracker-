import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Savings Goals</h1>
          <p>Track and manage your financial milestones dynamically</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fas fa-plus"></i> Add Goal
        </button>
      </div>

      <!-- Summary Card -->
      <div class="summary-card card mb-4">
        <div class="p-4" style="display:flex; justify-content:space-between; align-items:center">
           <div>
             <span class="text-muted fw-bold text-uppercase" style="font-size:0.8rem">Available Savings</span>
             <h2 class="m-0 mt-1 fw-bold text-success">₹{{totalSavings.toLocaleString('en-IN')}}</h2>
           </div>
           <div class="text-end">
             <i class="fas fa-piggy-bank fa-2x text-success opacity-50"></i>
           </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="card empty-state" *ngIf="goals.length === 0">
        <i class="fas fa-bullseye fa-3x mb-3 text-muted"></i>
        <h3>No Goals Yet</h3>
        <p class="text-muted mb-4">Start visualizing your financial future by creating your first savings milestone.</p>
        <button class="btn-primary" (click)="openAddModal()">
          <i class="fas fa-plus"></i> Create A Goal
        </button>
      </div>

      <!-- Goals Grid -->
      <div class="goals-grid" *ngIf="goals.length > 0">
        <div class="card goal-card" *ngFor="let g of goals" [class.completed]="isGoalCompleted(g)">
          <div class="g-top">
            <div class="g-icon" [style.background]="g.color + '14'" [style.color]="g.color">
              <i [class]="g.icon || 'fas fa-bullseye'"></i>
            </div>
            
            <div class="g-actions">
              <button class="action-icon-btn edit" (click)="editGoal(g)" title="Edit Goal">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-icon-btn delete" (click)="deleteGoal(g.id)" title="Delete Goal">
                <i class="fas fa-trash"></i>
              </button>
              <span class="g-status" [class.done]="isGoalCompleted(g)">
                {{isGoalCompleted(g) ? 'Completed' : 'In Progress'}}
              </span>
            </div>
          </div>
          
          <h4>{{g.name}}</h4>
          <p class="g-desc">{{g.description}}</p>
          
          <div class="g-amounts">
            <span>Rs {{getGoalSavedAmount(g).toLocaleString('en-IN')}} <small>/ Rs {{g.targetAmount.toLocaleString('en-IN')}}</small></span>
            <span class="g-pct" [style.color]="isGoalCompleted(g) ? '#10b981' : '#3b82f6'">
               {{getGoalProgress(g).toFixed(0)}}%
            </span>
          </div>
          
          <div class="progress-bar">
            <div class="fill" [style.width.%]="getGoalProgress(g)"
              [style.background]="isGoalCompleted(g) ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #60a5fa, #3b82f6)'"></div>
          </div>
          
          <div class="g-deadline mt-3" style="font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-top: 14px;">
            <i class="fas fa-calendar-alt"></i> Target Date: {{g.deadline}}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form (Glassmorphic Visuals) -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{editingGoal ? 'Edit' : 'Add'}} Savings Goal</h3>
          <button class="btn-close" (click)="showModal = false"><i class="fas fa-times"></i></button>
        </div>
        
        <form (ngSubmit)="saveGoal()">
          <div class="field-warning" *ngIf="formWarning">
            <i class="fas fa-triangle-exclamation"></i> {{formWarning}}
          </div>
          <div class="form-group">
            <label class="form-label">Goal Name</label>
            <input type="text" [(ngModel)]="goalName" name="name" class="form-control" placeholder="e.g. New Macbook Pro" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea [(ngModel)]="goalDescription" name="description" class="form-control" placeholder="What are you saving for?" rows="2"></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Target Amount (₹)</label>
              <input type="number" [(ngModel)]="goalTargetAmount" name="targetAmount" class="form-control" required min="1">
            </div>
            
            <div class="form-group">
              <label class="form-label">Saved Amount (₹)</label>
              <input type="number" [(ngModel)]="goalSavedAmount" name="savedAmount" class="form-control" min="0">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Target Date</label>
            <input type="date" [(ngModel)]="goalDeadline" name="deadline" class="form-control" required>
          </div>
          
          <!-- Icon Picker -->
          <div class="form-group">
            <label class="form-label">Select Icon</label>
            <div class="picker-grid">
              <div class="icon-option" *ngFor="let icon of iconOptions" 
                   [class.selected]="selectedIcon === icon" (click)="selectedIcon = icon">
                <i [class]="icon"></i>
              </div>
            </div>
          </div>
          
          <!-- Color Picker -->
          <div class="form-group">
            <label class="form-label">Theme Color</label>
            <div class="picker-grid">
              <div class="color-option" *ngFor="let color of colorOptions" 
                   [style.background]="color" [class.selected]="selectedColor === color" (click)="selectedColor = color">
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="showModal = false">Cancel</button>
            <button type="submit" class="btn-primary">
              {{editingGoal ? 'Update' : 'Create'}} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
    .mb-4 { margin-bottom: 24px; }
    .goals-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .goal-card { padding:24px; transition: all 0.2s; &.completed { border-color:#a7f3d0; background:#f0fdf4; } &:hover { transform:translateY(-2px); box-shadow:0 10px 15px -3px rgba(0,0,0,0.05); } }
    .g-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .g-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
    
    .g-actions { display: flex; gap: 6px; align-items: center; }
    .action-icon-btn {
      width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: #fff; color: #64748b; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
      &:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
      &.delete:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }
    }
    
    .g-status { font-size:0.75rem; font-weight:700; color:#3b82f6; padding:6px 12px; background:#eff6ff; border-radius:6px; letter-spacing:0.5px; text-transform:uppercase; margin-left:4px;
      &.done { color:#059669; background:#ecfdf5; } }
    h4 { font-size:1.1rem; font-weight:800; color:#1e293b; margin-bottom:6px; }
    .g-desc { font-size:0.85rem; color:#64748b; margin-bottom:20px; min-height: 40px; }
    .g-amounts { display:flex; justify-content:space-between; font-size:0.9rem; font-weight:600; margin-bottom:10px; color:#334155; small{color:#94a3b8; font-weight:500;} .g-pct{font-weight:800;} }
    .progress-bar { height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; }
    .fill { height:100%; border-radius:5px; transition:width 1s ease-in-out; }
    
    /* Empty State */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px; text-align: center; background: #fff; border: 1px dashed #cbd5e1;
      h3 { font-weight: 700; color: #1e293b; margin-bottom: 6px; }
      p { font-size: 0.9rem; max-width: 400px; }
    }
    
    /* Modal styles */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px;
      h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    }
    .btn-close {
      background: none; border: none; color: #64748b;
      font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%; transition: all 0.2s;
      &:hover { background: #f1f5f9; color: #0f172a; }
    }
    .form-group { margin-bottom: 18px; }
    .field-warning { display:flex; align-items:center; gap:8px; background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:8px; padding:10px 12px; font-size:0.82rem; font-weight:700; margin-bottom:14px; }
    .form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-control {
      background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;
      padding: 10px 14px; color: #0f172a; font-size: 0.9rem; width: 100%; font-family: inherit;
      transition: all 0.2s;
      &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
    }
    textarea.form-control { resize: none; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    
    /* Icon and Color Picker grid styles */
    .picker-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
    .icon-option {
      width: 40px; height: 40px; border-radius: 8px; border: 1px solid #cbd5e1;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: #64748b; background: #fff; font-size: 1rem; transition: all 0.2s;
      &:hover { border-color: #94a3b8; color: #475569; background: #f8fafc; }
      &.selected { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
    }
    .color-option {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent;
      cursor: pointer; position: relative; transition: transform 0.2s;
      &:hover { transform: scale(1.1); }
      &.selected { border-color: #0f172a; transform: scale(1.1); }
    }
    
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
    .btn-primary { background: #1a56db; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 600; cursor: pointer; transition: background 0.2s; &:hover { background: #1648b8; } }
    .btn-outline { background: transparent; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; &:hover { background: #f1f5f9; color: #0f172a; border-color: #94a3b8; } }
    
    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    @media(max-width:992px) { .goals-grid{grid-template-columns:1fr 1fr;} }
    @media(max-width:768px) { 
      .goals-grid{grid-template-columns:1fr;}
      .form-row { grid-template-columns: 1fr; gap: 0; }
    }
  `]
})
export class GoalsComponent implements OnInit {
  Math = Math;
  totalSavings = 0;
  goals: any[] = [];
  
  // Modal visibility
  showModal = false;
  editingGoal: any = null;

  // Form Fields
  goalName = '';
  goalDescription = '';
  goalTargetAmount: number | null = null;
  goalSavedAmount = 0;
  goalDeadline = '';
  selectedIcon = 'fas fa-bullseye';
  selectedColor = '#10B981';
  formWarning = '';

  // Icon options
  iconOptions = [
    'fas fa-bullseye',
    'fas fa-piggy-bank',
    'fas fa-shield-halved',
    'fas fa-car',
    'fas fa-plane',
    'fas fa-home',
    'fas fa-chart-line',
    'fas fa-graduation-cap',
    'fas fa-gift'
  ];

  // Vibrant premium colors
  colorOptions = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#EF4444', // Red
    '#06B6D4'  // Cyan
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // 1. Get available savings (balance)
    this.api.getDashboard().subscribe({
      next: (data: any) => {
        this.totalSavings = data.totalBalance || 0;
      },
      error: () => { 
        this.totalSavings = 0;
      }
    });

    // 2. Fetch goals from DB
    this.api.getGoals().subscribe({
      next: (data: any[]) => {
        this.goals = data || [];
      },
      error: () => {
        this.goals = [];
      }
    });
  }

  openAddModal() {
    this.editingGoal = null;
    this.goalName = '';
    this.goalDescription = '';
    this.goalTargetAmount = null;
    this.goalSavedAmount = Math.max(this.totalSavings, 0);
    this.formWarning = '';
    
    // Set deadline to one month from now by default
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    this.goalDeadline = oneMonthFromNow.toISOString().split('T')[0];
    
    this.selectedIcon = 'fas fa-bullseye';
    this.selectedColor = '#10B981';
    
    this.showModal = true;
  }

  editGoal(goal: any) {
    this.editingGoal = goal;
    this.goalName = goal.name;
    this.goalDescription = goal.description || '';
    this.goalTargetAmount = goal.targetAmount;
    this.goalSavedAmount = goal.savedAmount || 0;
    this.goalDeadline = goal.deadline;
    this.selectedIcon = goal.icon || 'fas fa-bullseye';
    this.selectedColor = goal.color || '#10B981';
    this.formWarning = '';
    
    this.showModal = true;
  }

  saveGoal() {
    this.formWarning = '';
    if (!this.goalName?.trim() || !this.goalTargetAmount || this.goalTargetAmount <= 0 || !this.goalDeadline) {
      this.formWarning = 'Please fill all required goal fields before saving.';
      return;
    }
    if (this.goalSavedAmount < 0) {
      this.formWarning = 'Saved amount cannot be negative.';
      return;
    }

    // Target Date Validation (Must not be in the past)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (this.goalDeadline < todayStr) {
      this.formWarning = 'Target date cannot be in the past. Please select a current or future date.';
      return;
    }

    const payload = {
      name: this.goalName.trim(),
      description: this.goalDescription,
      targetAmount: this.goalTargetAmount,
      savedAmount: this.goalSavedAmount,
      deadline: this.goalDeadline,
      icon: this.selectedIcon,
      color: this.selectedColor,
      status: this.goalSavedAmount >= this.goalTargetAmount ? 'COMPLETED' : 'IN_PROGRESS'
    };

    if (this.editingGoal) {
      // Update Goal
      this.api.updateGoal(this.editingGoal.id, payload).subscribe({
        next: () => {
          this.showModal = false;
          this.loadData();
        },
        error: (err) => {
          alert('Failed to update savings goal: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // Create Goal
      this.api.createGoal(payload).subscribe({
        next: () => {
          this.showModal = false;
          this.loadData();
        },
        error: (err) => {
          alert('Failed to create savings goal: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteGoal(id: number) {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      this.api.deleteGoal(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          alert('Failed to delete savings goal: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  getGoalSavedAmount(goal: any) {
    const target = Number(goal.targetAmount || 0);
    const available = Math.max(Number(this.totalSavings || 0), 0);
    if (target <= 0 || available <= 0) return 0;
    return Math.min(available, target);
  }

  getGoalProgress(goal: any) {
    const target = Number(goal.targetAmount || 0);
    if (target <= 0) return 0;
    return Math.min((this.getGoalSavedAmount(goal) / target) * 100, 100);
  }

  isGoalCompleted(goal: any) {
    return this.getGoalProgress(goal) >= 100;
  }
}

