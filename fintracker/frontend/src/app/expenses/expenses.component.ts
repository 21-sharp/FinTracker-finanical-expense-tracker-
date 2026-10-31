import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Expenses</h1><p>Monitor your spending across categories</p></div>
        <div class="filter-group">
          <select [(ngModel)]="filterCategory" (ngModelChange)="onFilterChange()" class="form-control" style="width:auto; min-width:200px">
            <option value="">All Categories</option>
            <option *ngFor="let c of categoryNames">{{c}}</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon red"><i class="fas fa-wallet"></i></div></div>
          <div class="stat-value">₹{{totalExpense.toLocaleString('en-IN')}}</div>
          <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon red"><i class="fas fa-receipt"></i></div></div>
          <div class="stat-value">{{filteredExpenses.length}}</div>
          <div class="stat-label">Expense Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon red"><i class="fas fa-chart-line"></i></div></div>
          <div class="stat-value">₹{{avgExpense.toLocaleString('en-IN')}}</div>
          <div class="stat-label">Average Expense</div>
        </div>
      </div>

      <!-- Expense Trend Chart -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-head">
          <h3><i class="fas fa-chart-line"></i> Expense Trend {{filterCategory ? '- ' + filterCategory : ''}}</h3>
        </div>
        <div class="chart-wrap">
          <apx-chart *ngIf="chartOptions.series"
            [series]="chartOptions.series" [chart]="chartOptions.chart"
            [colors]="chartOptions.colors" [fill]="chartOptions.fill"
            [stroke]="chartOptions.stroke" [dataLabels]="chartOptions.dataLabels"
            [xaxis]="chartOptions.xaxis" [yaxis]="chartOptions.yaxis"
            [grid]="chartOptions.grid" [tooltip]="chartOptions.tooltip"
            [markers]="chartOptions.markers" [noData]="chartOptions.noData"
          ></apx-chart>
        </div>
      </div>

      <!-- Expense Breakdown and History -->
      <div class="expense-details-grid">
        <!-- Breakdown -->
        <div class="card">
          <div class="card-head"><h3><i class="fas fa-chart-pie"></i> Category Breakdown</h3></div>
          <div class="breakdown-list">
            <div class="breakdown-item" *ngFor="let c of categories">
              <span class="dot" [style.background]="c.color"></span>
              <span class="name">{{c.category}}</span>
              <span class="pct">{{c.percentage | number:'1.0-1'}}%</span>
              <span class="amount">₹{{c.amount.toLocaleString('en-IN')}}</span>
            </div>
            <div class="no-data-sm" *ngIf="categories.length === 0">
              <i class="fas fa-info-circle"></i> No expense categories found.
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="card">
          <div class="card-head"><h3><i class="fas fa-list"></i> Expense History</h3></div>
          <div class="no-data-msg" *ngIf="filteredExpenses.length === 0">
            <i class="fas fa-inbox"></i> No expense transactions found.
          </div>
          <table class="table-professional" *ngIf="filteredExpenses.length > 0">
            <thead><tr><th>Item</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of pagedExpenses">
                <td><div class="cell-with-icon"><div class="icon-sm red"><i class="fas fa-money-bill-wave"></i></div>{{t.title}}</div></td>
                <td><span class="badge-cat">{{t.category}}</span></td>
                <td class="text-muted">{{t.date}}</td>
                <td class="text-danger fw-600">-₹{{t.amount.toLocaleString('en-IN')}}</td>
              </tr>
            </tbody>
          </table>
          <div class="pagination-bar" *ngIf="totalExpensePages > 1">
            <button type="button" class="page-btn arrow" (click)="goToExpensePage(expensePage - 1)" [disabled]="expensePage === 1" aria-label="Previous expense page">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button type="button" class="page-btn" *ngFor="let page of expensePages" (click)="goToExpensePage(page)" [class.active]="page === expensePage">
              {{page}}
            </button>
            <button type="button" class="page-btn arrow" (click)="goToExpensePage(expensePage + 1)" [disabled]="expensePage === totalExpensePages" aria-label="Next expense page">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04); display:flex; flex-direction:column; }
    .card-head { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9;
      h3 { font-size:0.9rem; font-weight:700; color:#1e293b; margin:0; i { margin-right:8px; color:#dc2626; } } }
    .chart-wrap { padding:12px 16px; flex:1; display:flex; flex-direction:column; }
    .expense-details-grid { display:grid; grid-template-columns:1fr 1.5fr; gap:20px; align-items:stretch; }
    .breakdown-list { padding:16px 20px; flex:1; display:flex; flex-direction:column; justify-content:space-evenly; overflow-y:auto; }
    .breakdown-item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:0.82rem; &:last-child { border-bottom:none; } }
    .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .name { flex:1; color:#475569; }
    .pct { color:#94a3b8; font-weight:600; width:40px; text-align:right; }
    .amount { color:#1e293b; font-weight:600; width:90px; text-align:right; }
    .cell-with-icon { display:flex; align-items:center; gap:10px; }
    .icon-sm { width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:0.8rem;
      &.red { background:#fef2f2; color:#dc2626; } }
    .badge-cat { background:#eef2ff; color:#1a56db; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; }
    .pagination-bar { display:flex; align-items:center; justify-content:center; gap:6px; padding:18px 16px 20px; border-top:1px solid #f1f5f9; }
    .page-btn { width:42px; height:42px; border:1px solid #dbe4f0; border-radius:8px; background:#fff; color:#64748b; font-size:0.86rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.18s ease; }
    .page-btn:hover:not(:disabled):not(.active) { border-color:#b8c6d9; color:#1a56db; background:#f8fbff; }
    .page-btn.active { background:#1d4ed8; border-color:#1d4ed8; color:#fff; box-shadow:0 8px 18px rgba(29,78,216,0.22); }
    .page-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .page-btn.arrow { font-size:0.78rem; }
    .no-data-msg { text-align:center; padding:32px; color:#94a3b8; font-size:0.85rem; i{font-size:1.3rem;display:block;margin-bottom:8px;color:#d1d5db;} }
    .no-data-sm { padding:24px; text-align:center; color:#94a3b8; font-size:0.82rem; }
    @media(max-width:768px) { .expense-details-grid { grid-template-columns:1fr; } }
  `]
})
export class ExpensesComponent implements OnInit {
  filterCategory = '';
  categoryNames = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'EMI', 'Other'];
  expenseList: any[] = [];
  categories: any[] = [];
  chartOptions: any = {};
  expensePage = 1;
  readonly expensePageSize = 10;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.api.getDashboard().subscribe({
      next: (data: any) => {
        this.categories = data.expenseByCategory || [];
      },
      error: () => { this.categories = []; }
    });

    this.api.getTransactions(0, 200).subscribe({
      next: (txnData: any) => {
        const all = txnData.content || txnData || [];
        this.expenseList = all.filter((t: any) => t.type === 'EXPENSE');
        this.expensePage = 1;
        this.buildChart();
      },
      error: () => {
        this.expenseList = [];
        this.buildChart();
      }
    });
  }

  get totalExpense() {
    return this.filteredExpenses.reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  get avgExpense() {
    return this.filteredExpenses.length > 0 ? Math.round(this.totalExpense / this.filteredExpenses.length) : 0;
  }

  get filteredExpenses() {
    if (!this.filterCategory) return this.expenseList;
    return this.expenseList.filter(e => e.category === this.filterCategory);
  }

  get totalExpensePages() {
    return Math.max(1, Math.ceil(this.filteredExpenses.length / this.expensePageSize));
  }

  get pagedExpenses() {
    const start = (this.expensePage - 1) * this.expensePageSize;
    return this.filteredExpenses.slice(start, start + this.expensePageSize);
  }

  get expensePages() {
    return Array.from({ length: this.totalExpensePages }, (_, i) => i + 1);
  }

  onFilterChange() {
    this.expensePage = 1;
    this.buildChart();
  }

  goToExpensePage(page: number) {
    this.expensePage = Math.min(Math.max(page, 1), this.totalExpensePages);
  }

  buildChart() {
    const grouped: any = {};
    const listToChart = this.filteredExpenses;
    listToChart.forEach(t => {
      const month = t.date ? t.date.substring(0, 7) : 'Unknown';
      grouped[month] = (grouped[month] || 0) + Number(t.amount || 0);
    });
    const months = Object.keys(grouped).sort();
    const values = months.map(m => grouped[m]);

    this.chartOptions = {
      series: [{ name: 'Expenses', data: values }],
      chart: { type: 'line', height: '100%', fontFamily: 'Inter, sans-serif', toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: true, easing: 'easeinout' as any, speed: 800 } },
      colors: ['#dc2626'],
      fill: { type: 'solid', opacity: 1 },
      stroke: { curve: 'smooth' as any, width: 3, lineCap: 'round' as any },
      markers: { size: 5, strokeWidth: 3, strokeColors: '#ffffff', hover: { size: 7 } },
      dataLabels: { enabled: false },
      xaxis: { categories: months, labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v: number) => '₹' + (v / 1000).toFixed(0) + 'K' } },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      noData: { text: 'No expense data to display', align: 'center' as any, verticalAlign: 'middle' as any, style: { color: '#94a3b8', fontSize: '13px' } },
      tooltip: { y: { formatter: (v: number) => '₹' + v.toLocaleString('en-IN') } }
    };
  }
}
