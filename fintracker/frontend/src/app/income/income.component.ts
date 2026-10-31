import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Income</h1><p>Track all your income sources</p></div>
        <button class="btn-primary" (click)="showModal=true"><i class="fas fa-plus"></i> Add Income</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon green"><i class="fas fa-wallet"></i></div></div>
          <div class="stat-value">₹{{totalIncome.toLocaleString('en-IN')}}</div>
          <div class="stat-label">Total Income</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon green"><i class="fas fa-coins"></i></div></div>
          <div class="stat-value">{{incomeList.length}}</div>
          <div class="stat-label">Income Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><div class="stat-icon green"><i class="fas fa-chart-line"></i></div></div>
          <div class="stat-value">₹{{avgIncome.toLocaleString('en-IN')}}</div>
          <div class="stat-label">Average Income</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Income Trend Chart -->
        <div class="card chart-card">
          <div class="card-head"><h3><i class="fas fa-chart-line"></i> Income Trend</h3></div>
          <div class="chart-container">
            <apx-chart *ngIf="chartOptions.series"
              [series]="chartOptions.series" [chart]="chartOptions.chart"
              [colors]="chartOptions.colors" [fill]="chartOptions.fill"
              [stroke]="chartOptions.stroke" [dataLabels]="chartOptions.dataLabels"
              [xaxis]="chartOptions.xaxis" [yaxis]="chartOptions.yaxis"
              [grid]="chartOptions.grid" [tooltip]="chartOptions.tooltip"
            ></apx-chart>
          </div>
        </div>

        <!-- Income Breakdown Chart -->
        <div class="card chart-card">
          <div class="card-head"><h3><i class="fas fa-chart-pie"></i> Income Breakdown</h3></div>
          <div class="chart-container donut-wrapper">
            <apx-chart *ngIf="donutOptions.series"
              [series]="donutOptions.series" [chart]="donutOptions.chart"
              [labels]="donutOptions.labels" [colors]="donutOptions.colors"
              [plotOptions]="donutOptions.plotOptions" [legend]="donutOptions.legend"
              [dataLabels]="donutOptions.dataLabels" [stroke]="donutOptions.stroke"
              [tooltip]="donutOptions.tooltip"
            ></apx-chart>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-head"><h3><i class="fas fa-list"></i> Income History</h3></div>
        <div class="no-data-msg" *ngIf="incomeList.length === 0">
          <i class="fas fa-inbox"></i> No income data yet. Add income entries or import SQL data.
        </div>
        <table class="table-professional" *ngIf="incomeList.length > 0">
          <thead><tr><th>Source</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
          <tbody>
            <tr *ngFor="let t of incomeList">
              <td><div class="cell-with-icon"><div class="icon-sm green"><i class="fas fa-arrow-trend-up"></i></div>{{t.title}}</div></td>
              <td><span class="badge-cat" style="background:#dcfce3; color:#166534">{{t.category}}</span></td>
              <td class="text-muted">{{t.date}}</td>
              <td class="text-success fw-600">+₹{{t.amount.toLocaleString('en-IN')}}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Income Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header"><h3>Add Income</h3><button class="btn-close" (click)="showModal=false"><i class="fas fa-times"></i></button></div>
          <form (ngSubmit)="addIncome()">
            <div class="form-group"><label class="form-label">Title</label><input type="text" [(ngModel)]="form.title" name="title" class="form-control" required></div>
            <div class="form-group"><label class="form-label">Amount (₹)</label><input type="number" [(ngModel)]="form.amount" name="amount" class="form-control" required></div>
            <div class="form-group"><label class="form-label">Category</label>
              <select [(ngModel)]="form.category" name="category" class="form-control">
                <option *ngFor="let c of categories">{{c}}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Date</label><input type="date" [(ngModel)]="form.date" name="date" class="form-control" required></div>
            <div class="form-group"><label class="form-label">Description</label><input type="text" [(ngModel)]="form.description" name="desc" class="form-control"></div>
            <div class="modal-footer"><button type="button" class="btn-outline" (click)="showModal=false">Cancel</button><button type="submit" class="btn-primary">Add Income</button></div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:992px) { .dashboard-grid { grid-template-columns:1fr; } }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
    .card-head { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9;
      h3 { font-size:0.9rem; font-weight:700; color:#1e293b; margin:0; i { margin-right:8px; color:#059669; } } }
    .chart-container { padding:12px 16px; }
    .cell-with-icon { display:flex; align-items:center; gap:10px; }
    .icon-sm { width:32px; height:32px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:0.8rem;
      &.green { background:#ecfdf5; color:#059669; } }
    .no-data-msg { text-align:center; padding:32px; color:#94a3b8; font-size:0.85rem; i{font-size:1.3rem;display:block;margin-bottom:8px;color:#d1d5db;} }
    .badge-cat { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #e2e8f0; color: #475569; display: inline-block; }
  `]
})
export class IncomeComponent implements OnInit {
  showModal = false;
  categories = ['Salary', 'Freelancing', 'Investments', 'Business', 'Bonuses', 'Incentives', 'Profit Sharing', 'Employees’ Provident Fund (EPF)', 'Gratuity', 'Employee State Insurance (ESI)', 'Other'];
  form = { title: '', amount: 0, category: 'Salary', date: '', description: '' };
  incomeList: any[] = [];
  chartOptions: any = {};
  donutOptions: any = {};

  CATEGORY_COLORS = ['#2563EB', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadIncome(); }

  loadIncome() {
    this.api.getTransactions(0, 200).subscribe({
      next: (data: any) => {
        const all = data.content || data || [];
        this.incomeList = all.filter((t: any) => t.type === 'INCOME');
        this.buildChart();
        this.buildDonut();
      },
      error: () => { this.incomeList = []; this.buildChart(); this.buildDonut(); }
    });
  }

  get totalIncome() { return this.incomeList.reduce((s, t) => s + Number(t.amount || 0), 0); }
  get avgIncome() { return this.incomeList.length > 0 ? Math.round(this.totalIncome / this.incomeList.length) : 0; }

  buildChart() {
    const grouped: any = {};
    this.incomeList.forEach(t => {
      const month = t.date ? t.date.substring(0, 7) : 'Unknown';
      grouped[month] = (grouped[month] || 0) + Number(t.amount || 0);
    });
    const months = Object.keys(grouped).sort();
    const values = months.map(m => grouped[m]);

    this.chartOptions = {
      series: [{ name: 'Income', data: values.length > 0 ? values : [0] }],
      chart: { type: 'area', height: 260, fontFamily: 'Inter, sans-serif', toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout' as any, speed: 800 } },
      colors: ['#059669'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] } },
      stroke: { curve: 'smooth' as any, width: 3 },
      dataLabels: { enabled: false },
      xaxis: { categories: months.length > 0 ? months : ['No Data'], labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v: number) => '₹' + (v / 1000).toFixed(0) + 'K' } },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v: number) => '₹' + v.toLocaleString('en-IN') } }
    };
  }

  buildDonut() {
    const grouped: any = {};
    this.incomeList.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount || 0);
    });
    const labels = Object.keys(grouped);
    const values = labels.map(l => grouped[l]);

    this.donutOptions = {
      series: values.length > 0 ? values : [1],
      chart: { type: 'donut', height: 260, fontFamily: 'Inter, sans-serif', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
      labels: labels.length > 0 ? labels : ['No Data'],
      colors: this.CATEGORY_COLORS,
      plotOptions: { pie: { donut: { size: '72%', labels: { show: true, name: { show: true }, value: { show: true, formatter: (v: string) => '₹' + Number(v).toLocaleString('en-IN') }, total: { show: true, label: 'Total Income', formatter: () => '₹' + this.totalIncome.toLocaleString('en-IN') } } } } },
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#ffffff'] },
      tooltip: { y: { formatter: (v: number) => '₹' + v.toLocaleString('en-IN') } }
    };
  }

  addIncome() {
    if (!this.form.title.trim()) return;
    this.api.createTransaction({
      title: this.form.title, amount: this.form.amount, type: 'INCOME',
      category: this.form.category, date: this.form.date,
      description: this.form.description, paymentMethod: 'Manual Entry'
    }).subscribe({
      next: () => { this.showModal = false; this.loadIncome(); this.form = { title: '', amount: 0, category: 'Salary', date: '', description: '' }; },
      error: (err) => alert(err.error?.message || 'Failed to add income.')
    });
  }
}
