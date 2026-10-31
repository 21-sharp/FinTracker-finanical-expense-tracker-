import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { IMPORT_SAMPLES, downloadImportSample } from '../shared/import-samples';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  importSamples = IMPORT_SAMPLES;
  downloadSample = downloadImportSample;

  searchQuery = '';
  filterType = 'ALL';
  filterCategory = '';
  sortField = 'date';
  sortDir = 'desc';
  showAddModal = false;
  editingTransaction: any = null;
  currentPage = 1;
  pageSize = 10;
  loading = true;

  // Drag & drop
  uploadDragOver = false;
  uploadProgress = false;
  uploadSuccess = '';
  uploadWarning = '';
  formWarning = '';

  categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Salary', 'Freelance', 'Investments', 'EMI', 'Bonuses', 'Incentives', 'Profit Sharing', 'Employees’ Provident Fund (EPF)', 'Gratuity', 'Employee State Insurance (ESI)', 'Other'];

  transactions: any[] = [];

  newTxn = { title: '', amount: 0, type: 'EXPENSE', category: 'Food', date: '', description: '', paymentMethod: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    this.api.getTransactions(0, 200, this.sortField, this.sortDir).subscribe({
      next: (data: any) => {
        if (data.content) {
          this.transactions = data.content;
        } else if (Array.isArray(data)) {
          this.transactions = data;
        } else {
          this.transactions = [];
        }
        this.loading = false;
      },
      error: () => {
        this.transactions = [];
        this.loading = false;
      }
    });
  }

  get filtered() {
    let result = this.transactions.filter(t => {
      const matchType = this.filterType === 'ALL' || t.type === this.filterType;
      const matchCat = !this.filterCategory || t.category === this.filterCategory;
      const matchSearch = !this.searchQuery ||
        (t.title || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
    result.sort((a: any, b: any) => {
      let valA = a[this.sortField], valB = b[this.sortField];
      if (this.sortField === 'amount') { valA = Number(valA); valB = Number(valB); }
      if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }

  get paginatedTransactions() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages() { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages() { return Array.from({length: this.totalPages}, (_, i) => i + 1); }

  toggleSort(field: string) {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
  }

  openAdd() {
    this.newTxn = { title: '', amount: 0, type: 'EXPENSE', category: 'Food',
      date: new Date().toISOString().split('T')[0], description: '', paymentMethod: '' };
    this.editingTransaction = null;
    this.formWarning = '';
    this.showAddModal = true;
  }

  editTxn(t: any) {
    this.newTxn = { ...t };
    this.editingTransaction = t;
    this.formWarning = '';
    this.showAddModal = true;
  }

  saveTxn() {
    this.formWarning = '';
    if (!this.newTxn.title?.trim() || !this.newTxn.amount || Number(this.newTxn.amount) <= 0 || !this.newTxn.type || !this.newTxn.category || !this.newTxn.date) {
      this.formWarning = 'Please fill all required transaction fields before saving.';
      return;
    }

    const payload = {
      title: this.newTxn.title.trim(),
      amount: this.newTxn.amount,
      type: this.newTxn.type,
      category: this.newTxn.category,
      date: this.newTxn.date,
      description: this.newTxn.description,
      paymentMethod: this.newTxn.paymentMethod || 'Manual Entry'
    };

    if (this.editingTransaction && this.editingTransaction.id) {
      this.api.updateTransaction(this.editingTransaction.id, payload).subscribe({
        next: () => { this.showAddModal = false; this.filterType = 'ALL'; this.currentPage = 1; this.loadTransactions(); },
        error: (err) => alert(err.error?.message || 'Failed to update transaction.')
      });
    } else {
      this.api.createTransaction(payload).subscribe({
        next: () => { this.showAddModal = false; this.filterType = 'ALL'; this.currentPage = 1; this.loadTransactions(); },
        error: (err) => alert(err.error?.message || 'Failed to create transaction.')
      });
    }
  }

  deleteAll() {
    if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
      this.api.deleteAllTransactions().subscribe({
        next: () => {
          this.filterType = 'ALL';
          this.currentPage = 1;
          this.loadTransactions();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete all transactions.')
      });
    }
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
    this.uploadWarning = '';
    if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
      this.uploadWarning = 'Only SQL, CSV, Excel, and PDF files are supported.';
      return;
    }
    this.uploadProgress = true;
    this.uploadSuccess = '';
    this.api.uploadTransactionFile(file).subscribe({
      next: (res: any) => {
        this.uploadProgress = false;
        this.uploadSuccess = res.message || `Imported ${res.count} transactions!`;
        this.filterType = 'ALL';
        this.currentPage = 1;
        this.loadTransactions();
        setTimeout(() => this.uploadSuccess = '', 5000);
      },
      error: (err) => {
        this.uploadProgress = false;
        this.uploadWarning = err.error?.message || 'Failed to upload transaction file.';
      }
    });
  }

  get totalIncome() { return this.transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount || 0), 0); }
  get totalExpense() { return this.transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount || 0), 0); }

  formatCurrency(val: number): string {
    if (!val) return '₹0';
    return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
}
