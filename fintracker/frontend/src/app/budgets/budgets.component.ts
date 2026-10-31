import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Budgets & Reports</h1><p>Compare income and expenses across time</p></div>
        <div class="filter-group" style="display:flex; gap:10px; align-items:center;">
          <input type="month" [(ngModel)]="startMonth" (change)="loadData()" class="form-control" style="width:auto">
          <span class="text-muted fw-bold">to</span>
          <input type="month" [(ngModel)]="endMonth" (change)="loadData()" class="form-control" style="width:auto">
        </div>
      </div>

      <!-- Summary -->
      <div class="summary-card card">
        <div class="summary-grid">
          <div class="summary-item"><span class="s-label">Total Income</span><span class="s-value success">₹{{totalIncome.toLocaleString('en-IN')}}</span></div>
          <div class="summary-item"><span class="s-label">Total Expense</span><span class="s-value danger">₹{{totalExpense.toLocaleString('en-IN')}}</span></div>
          <div class="summary-item"><span class="s-label">Net Savings</span><span class="s-value" [class.success]="totalIncome - totalExpense >= 0" [class.danger]="totalIncome - totalExpense < 0">₹{{(totalIncome - totalExpense).toLocaleString('en-IN')}}</span></div>
          <div class="summary-item"><span class="s-label">Savings Rate</span><span class="s-value">{{savingsRate.toFixed(1)}}%</span></div>
        </div>
      </div>

      <!-- Breakdowns -->
      <div class="breakdown-grid">
        <!-- Expense Breakdown -->
        <div class="card">
          <div class="card-head"><h3><i class="fas fa-arrow-up text-danger"></i> Expense Breakdown</h3></div>
          <div class="card-body">
            <div class="mini-summary">
              <span><strong>Income</strong> â‚¹{{totalIncome.toLocaleString('en-IN')}}</span>
              <span><strong>Expenses</strong> â‚¹{{totalExpense.toLocaleString('en-IN')}}</span>
            </div>
            <div class="no-data-sm" *ngIf="expenseBreakdown.length === 0">No expense data in this period.</div>
            <div class="b-item" *ngFor="let item of expenseBreakdown">
              <div class="b-info"><span>{{item.category}}</span><span>₹{{item.amount.toLocaleString('en-IN')}}</span></div>
              <div class="progress-bar"><div class="fill red" [style.width.%]="item.pct"></div></div>
            </div>
          </div>
        </div>

        <!-- Income Breakdown -->
        <div class="card">
          <div class="card-head"><h3><i class="fas fa-arrow-down text-success"></i> Income Breakdown</h3></div>
          <div class="card-body">
            <div class="mini-summary">
              <span><strong>Income</strong> â‚¹{{totalIncome.toLocaleString('en-IN')}}</span>
              <span><strong>Expenses</strong> â‚¹{{totalExpense.toLocaleString('en-IN')}}</span>
            </div>
            <div class="no-data-sm" *ngIf="incomeBreakdown.length === 0">No income data in this period.</div>
            <div class="b-item" *ngFor="let item of incomeBreakdown">
              <div class="b-info"><span>{{item.category}}</span><span>₹{{item.amount.toLocaleString('en-IN')}}</span></div>
              <div class="progress-bar"><div class="fill green" [style.width.%]="item.pct"></div></div>
            </div>
          </div>
        </div>
        
        <!-- Category Overall Overview -->
        <div class="card">
          <div class="card-head"><h3><i class="fas fa-chart-pie text-info"></i> Budget Overview</h3></div>
          <div class="card-body centered-content">
             <div class="overview-circle" [style]="'--inc: ' + (totalIncome + totalExpense > 0 ? (totalIncome / (totalIncome + totalExpense) * 100) : 50) + '%'">
                <div class="circle-inner">
                  <span class="c-title">Total Processed</span>
                  <span class="c-val">₹{{(totalIncome + totalExpense).toLocaleString('en-IN')}}</span>
                </div>
             </div>
             <p class="mt-4 text-muted text-center" style="font-size:0.85rem; line-height: 1.5;">
               <span *ngIf="totalIncome > 0">You spent <strong>{{((totalExpense / totalIncome) * 100).toFixed(0)}}%</strong> of your income during this period.</span>
               <span *ngIf="totalIncome === 0 && totalExpense > 0">You had expenses but no income recorded during this period.</span>
               <span *ngIf="totalIncome === 0 && totalExpense === 0">No transactions recorded in this date range.</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02); height: 100%; }
    .card-head { padding:16px 20px; border-bottom:1px solid #f1f5f9; h3 { font-size:0.95rem; font-weight:700; color:#1e293b; margin:0; i { margin-right:8px; } } }
    .card-body { padding: 20px; height: calc(100% - 53px); overflow-y: auto;}
    .summary-card { margin-bottom:24px; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; padding:24px; }
    .summary-item { text-align:center; }
    .s-label { display:block; font-size:0.8rem; color:#64748b; margin-bottom:6px; font-weight:600; text-transform: uppercase; letter-spacing: 0.5px; }
    .s-value { font-size:1.5rem; font-weight:800; color:#1e293b; &.danger{color:#ef4444;} &.success{color:#10b981;} }
    
    .breakdown-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; align-items: stretch;}
    .mini-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; font-size:0.78rem; color:#64748b;
      span { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:9px 10px; display:flex; flex-direction:column; gap:3px; }
      strong { color:#1e293b; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.4px; } }
    .b-item { margin-bottom: 16px; }
    .b-info { display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; color:#334155; margin-bottom:6px; }
    .progress-bar { height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .fill { height:100%; border-radius:4px; transition:width 1s ease-in-out; }
    .fill.red { background: linear-gradient(90deg, #f87171, #ef4444); }
    .fill.green { background: linear-gradient(90deg, #34d399, #10b981); }
    
    .centered-content { display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .overview-circle { width:160px; height:160px; border-radius:50%; background: conic-gradient(#10b981 var(--inc), #ef4444 0); display:flex; align-items:center; justify-content:center; position:relative; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 20px; }
    .circle-inner { width:130px; height:130px; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:2; }
    .c-title { font-size:0.7rem; color:#64748b; font-weight:600; text-transform:uppercase; margin-bottom:4px; }
    .c-val { font-size:1.1rem; font-weight:800; color:#1e293b; }
    .no-data-sm { padding:20px; text-align:center; color:#94a3b8; font-size:0.85rem; font-style:italic; }

    @media(max-width:992px) { .breakdown-grid{grid-template-columns:1fr;} .summary-grid{grid-template-columns:1fr 1fr;} }
  `]
})
export class BudgetsComponent implements OnInit {
  startMonth = '';
  endMonth = '';
  
  transactions: any[] = [];
  
  totalIncome = 0;
  totalExpense = 0;
  savingsRate = 0;
  
  incomeBreakdown: any[] = [];
  expenseBreakdown: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    const today = new Date();
    const currentMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    // Default to last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    const pastMonthStr = sixMonthsAgo.getFullYear() + '-' + String(sixMonthsAgo.getMonth() + 1).padStart(2, '0');
    
    this.startMonth = pastMonthStr;
    this.endMonth = currentMonthStr;
    this.fetchData();
  }
  
  loadData() {
    this.processData();
  }

  fetchData() {
    this.api.getTransactions(0, 5000).subscribe({
      next: (data: any) => {
        this.transactions = data.content || data || [];
        this.processData();
      },
      error: () => {
        this.transactions = [];
        this.processData();
      }
    });
  }
  
  processData() {
    if (!this.startMonth || !this.endMonth) return;
    
    const startObj = new Date(this.startMonth + '-01');
    const endObj = new Date(this.endMonth + '-01');
    endObj.setMonth(endObj.getMonth() + 1);
    endObj.setDate(0);
    
    const filtered = this.transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startObj && tDate <= endObj;
    });
    
    this.totalIncome = 0;
    this.totalExpense = 0;
    
    const incMap: any = {};
    const expMap: any = {};
    
    filtered.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'INCOME') {
        this.totalIncome += amt;
        const category = this.getDisplayCategory(t, 'INCOME');
        incMap[category] = (incMap[category] || 0) + amt;
      } else {
        this.totalExpense += amt;
        const category = this.getDisplayCategory(t, 'EXPENSE');
        expMap[category] = (expMap[category] || 0) + amt;
      }
    });
    
    this.savingsRate = this.totalIncome > 0 ? ((this.totalIncome - this.totalExpense) / this.totalIncome) * 100 : 0;
    if (this.savingsRate < 0) this.savingsRate = 0;
    
    this.incomeBreakdown = Object.keys(incMap).map(k => ({
      category: k,
      amount: incMap[k],
      pct: this.totalIncome > 0 ? (incMap[k] / this.totalIncome) * 100 : 0
    })).sort((a,b) => b.amount - a.amount);
    
    this.expenseBreakdown = Object.keys(expMap).map(k => ({
      category: k,
      amount: expMap[k],
      pct: this.totalExpense > 0 ? (expMap[k] / this.totalExpense) * 100 : 0
    })).sort((a,b) => b.amount - a.amount);
  }

  getDisplayCategory(t: any, type: 'INCOME' | 'EXPENSE') {
    const raw = String(t.category || '').trim();
    if (raw && !this.isBadCategory(raw)) return raw;

    const text = `${t.title || ''} ${t.description || ''}`.toLowerCase();
    if (type === 'INCOME') {
      if (text.includes('salary')) return 'Salary';
      if (text.includes('freelance')) return 'Freelance';
      if (text.includes('extra') || text.includes('discretionary') || text.includes('contractual') ||
          text.includes('sales target') || text.includes('performance goal') || text.includes('milestone') ||
          text.includes('bonus') || text.includes('incentive')) return 'Bonuses & Incentives';
      if (text.includes('stock option') || text.includes('restricted stock') || text.includes('rsu') ||
          text.includes('ownership') || text.includes('company grows') || text.includes('company is sold')) return 'Equity Compensation';
      if (text.includes('benefit') || text.includes('allowance') || text.includes('health insurance') ||
          text.includes('housing') || text.includes('travel stipend') || text.includes('non-salary')) return 'Benefits & Allowances';
      if (text.includes('interest')) return 'Interest';
      if (text.includes('dividend')) return 'Investments';
      return 'Income';
    }

    if (text.includes('emi') || text.includes('loan')) return 'EMI';
    if (text.includes('grocery') || text.includes('food') || text.includes('restaurant')) return 'Food';
    if (text.includes('travel') || text.includes('fuel') || text.includes('transport')) return 'Travel';
    if (text.includes('shopping') || text.includes('purchase')) return 'Shopping';
    if (text.includes('bill') || text.includes('electricity') || text.includes('internet') || text.includes('phone')) return 'Bills';
    if (text.includes('medical') || text.includes('doctor') || text.includes('health')) return 'Healthcare';
    if (text.includes('movie') || text.includes('entertainment')) return 'Entertainment';
    return 'Expense';
  }

  isBadCategory(value: string) {
    return /^fy\s*\d{4}$/i.test(value) || /^[-+]?\d+(\.\d+)?$/.test(value) || /^\d{4,}$/.test(value);
  }
}
