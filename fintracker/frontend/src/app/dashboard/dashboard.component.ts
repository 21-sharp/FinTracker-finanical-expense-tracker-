import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { IMPORT_SAMPLES, downloadImportSample } from '../shared/import-samples';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  importSamples = IMPORT_SAMPLES;
  downloadSample = downloadImportSample;

  userName = '';
  profilePicture = '';
  loading = true;
  isNewUser = true;
  uploadDragOver = false;
  uploadProgress = false;
  uploadSuccess = '';

  // Stats
  totalBalance = 0;
  monthlyIncome = 0;
  monthlyExpenses = 0;
  monthlySavings = 0;
  savingsRate = 0;

  // Data
  selectedYear = new Date().getFullYear();
  availableYears = [2023, 2024, 2025, 2026, 2027];
  recentTransactions: any[] = [];
  expenseByCategory: any[] = [];
  monthlyTrend: any[] = [];
  financialHealth: any = { score: 0, status: 'No Data', message: 'Upload your financial data to get started.' };

  // Chart options
  trendChartOptions: any = {};
  categoryChartOptions: any = {};

  // Quick Actions
  quickActions = [
    { icon: 'fas fa-plus', label: 'Add Transaction', link: '/app/transactions', color: '#1a56db' },
    { icon: 'fas fa-wallet', label: 'Set Budget', link: '/app/budgets', color: '#059669' },
    { icon: 'fas fa-bullseye', label: 'New Goal', link: '/app/goals', color: '#7c3aed' },
    { icon: 'fas fa-file-import', label: 'Import File', link: '/app/transactions', color: '#d97706' }
  ];

  constructor(private authService: AuthService, private api: ApiService) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user ? `${user.firstName} ${user.lastName}` : 'User';
    this.profilePicture = user?.profilePicture || '';
    this.loadDashboard();
  }
  
  onYearChange() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.api.getDashboard(this.selectedYear).subscribe({
      next: (data: any) => {
        this.totalBalance = data.totalBalance || 0;
        this.monthlyIncome = data.monthlyIncome || 0;
        this.monthlyExpenses = data.monthlyExpenses || 0;
        this.monthlySavings = data.monthlySavings || 0;
        this.savingsRate = data.savingsRate || 0;
        this.recentTransactions = data.recentTransactions || [];
        this.expenseByCategory = data.expenseByCategory || [];
        this.monthlyTrend = data.monthlyTrend || [];
        this.financialHealth = data.financialHealth || this.financialHealth;
        
        // If there are no recent transactions, it is a first time user
        this.isNewUser = (this.recentTransactions.length === 0);

        this.buildTrendChart();
        this.buildCategoryChart();
        this.loading = false;
      },
      error: () => {
        this.isNewUser = true;
        this.loading = false;
        this.buildTrendChart();
        this.buildCategoryChart();
      }
    });
  }

  buildTrendChart() {
    const months = this.monthlyTrend.length > 0
      ? this.monthlyTrend.map((m: any) => m.month)
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const incomeData = this.monthlyTrend.length > 0
      ? this.monthlyTrend.map((m: any) => m.income || 0)
      : [0, 0, 0, 0, 0];
    const expenseData = this.monthlyTrend.length > 0
      ? this.monthlyTrend.map((m: any) => m.expense || 0)
      : [0, 0, 0, 0, 0];

    this.trendChartOptions = {
      series: [
        { name: 'Income', data: incomeData },
        { name: 'Expenses', data: expenseData }
      ],
      chart: {
        type: 'line',
        height: '100%',
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        dropShadow: { enabled: true, top: 3, left: 0, blur: 6, opacity: 0.12 }
      },
      colors: ['#059669', '#dc2626'],
      stroke: { curve: 'smooth', width: 3 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: months,
        labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 600 } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '11px' },
          formatter: (val: number) => '₹' + (val / 1000).toFixed(0) + 'K'
        }
      },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      legend: {
        position: 'top', horizontalAlign: 'right',
        fontSize: '12px', fontWeight: 600,
        markers: { size: 5, shape: 'circle' as any }
      },
      tooltip: {
        y: { formatter: (val: number) => '₹' + val.toLocaleString('en-IN') }
      }
    };
  }

  buildCategoryChart() {
    const labels = this.expenseByCategory.length > 0
      ? this.expenseByCategory.map((c: any) => c.category)
      : ['No Data'];
    const values = this.expenseByCategory.length > 0
      ? this.expenseByCategory.map((c: any) => c.amount || 0)
      : [1];
    const colors = this.expenseByCategory.length > 0
      ? this.expenseByCategory.map((c: any) => c.color)
      : ['#e2e8f0'];

    this.categoryChartOptions = {
      series: values,
      chart: {
        type: 'donut',
        height: 260,
        fontFamily: 'Inter, sans-serif',
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      labels: labels,
      colors: colors,
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', color: '#94a3b8' },
              value: {
                show: true, fontSize: '20px', fontWeight: 700, color: '#1e293b',
                formatter: (val: string) => {
                  if (this.expenseByCategory.length === 0) return '₹0';
                  return '₹' + Number(val).toLocaleString('en-IN');
                }
              },
              total: {
                show: true, label: 'Total Expenses',
                fontSize: '11px', color: '#94a3b8',
                formatter: (w: any) => {
                  if (this.expenseByCategory.length === 0) return '₹0';
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return '₹' + total.toLocaleString('en-IN');
                }
              }
            }
          }
        }
      },
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#ffffff'] },
      tooltip: {
        enabled: this.expenseByCategory.length > 0,
        y: { formatter: (val: number) => '₹' + val.toLocaleString('en-IN') }
      }
    };
  }

  formatCurrency(val: number): string {
    if (!val) return '₹0';
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  getChangePercent(): string {
    if (this.monthlyIncome === 0) return '0%';
    return ((this.monthlySavings / this.monthlyIncome) * 100).toFixed(1) + '%';
  }

  // ─── Drag & Drop SQL Upload ───
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.uploadDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
  }

  processFile(file: File) {
    const allowedExtensions = ['.sql', '.csv', '.xlsx', '.xls', '.pdf'];
    const fileName = file.name.toLowerCase();
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
      alert('Only SQL, CSV, Excel, and PDF files are supported.');
      return;
    }
    this.uploadProgress = true;
    this.uploadSuccess = '';
    this.api.uploadTransactionFile(file).subscribe({
      next: (res: any) => {
        this.uploadProgress = false;
        this.uploadSuccess = res.message || `Imported ${res.count} transactions successfully!`;
        this.loadDashboard();
        setTimeout(() => this.uploadSuccess = '', 5000);
      },
      error: (err: any) => {
        this.uploadProgress = false;
        alert(err.error?.message || 'Failed to upload transaction file.');
      }
    });
  }

  getHealthColor(): string {
    const s = this.financialHealth.score;
    if (s >= 75) return '#059669';
    if (s >= 50) return '#d97706';
    if (s >= 30) return '#f97316';
    return '#dc2626';
  }

  getHealthCircleDash(): string {
    const pct = this.financialHealth.score / 100;
    const circumference = 2 * Math.PI * 54;
    return `${pct * circumference} ${circumference}`;
  }
}
