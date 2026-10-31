import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ─── Dashboard ───
  getDashboard(year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get(`${this.base}/dashboard`, { params });
  }

  // ─── Transactions ───
  getTransactions(page = 0, size = 10, sortBy = 'date', sortDir = 'desc'): Observable<any> {
    const params = new HttpParams()
      .set('page', page).set('size', size)
      .set('sortBy', sortBy).set('sortDir', sortDir);
    return this.http.get(`${this.base}/transactions`, { params });
  }

  searchTransactions(filters: any): Observable<any> {
    let params = new HttpParams()
      .set('page', filters.page || 0).set('size', filters.size || 10);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get(`${this.base}/transactions/search`, { params });
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post(`${this.base}/transactions`, data);
  }

  updateTransaction(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/transactions/${id}`, data);
  }

  deleteTransaction(id: number): Observable<any> {
    return this.http.delete(`${this.base}/transactions/${id}`);
  }

  deleteAllTransactions(): Observable<any> {
    return this.http.delete(`${this.base}/transactions/all`);
  }

  // ─── SQL Upload ───
  uploadTransactionFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.base}/upload/transactions`, formData);
  }

  // ─── Budgets ───
  getBudgets(month?: number, year?: number): Observable<any> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.get(`${this.base}/budgets`, { params });
  }

  createBudget(data: any): Observable<any> {
    return this.http.post(`${this.base}/budgets`, data);
  }

  updateBudget(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/budgets/${id}`, data);
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete(`${this.base}/budgets/${id}`);
  }

  // ─── Goals ───
  getGoals(): Observable<any> {
    return this.http.get(`${this.base}/goals`);
  }

  createGoal(data: any): Observable<any> {
    return this.http.post(`${this.base}/goals`, data);
  }

  updateGoal(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/goals/${id}`, data);
  }

  deleteGoal(id: number): Observable<any> {
    return this.http.delete(`${this.base}/goals/${id}`);
  }

  // ─── Categories ───
  getCategories(type?: string): Observable<any> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get(`${this.base}/categories`, { params });
  }

  createCategory(data: any): Observable<any> {
    return this.http.post(`${this.base}/categories`, data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.base}/categories/${id}`);
  }

  // ─── Notifications ───
  getNotifications(): Observable<any> {
    return this.http.get(`${this.base}/notifications`);
  }

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.base}/notifications/unread/count`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.base}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.put(`${this.base}/notifications/read-all`, {});
  }

  // ─── Profile ───
  getProfile(): Observable<any> {
    return this.http.get(`${this.base}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.base}/profile`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.base}/profile/change-password`, data);
  }

  updateFaceProfile(data: { profilePicture: string; faceEmbedding: number[] }): Observable<any> {
    return this.http.post(`${this.base}/profile/face`, {
      profilePicture: data.profilePicture,
      faceEmbedding: JSON.stringify(data.faceEmbedding)
    });
  }

  // ─── Export ───
  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/transactions/export/excel`, { responseType: 'blob' });
  }

  exportPdf(): Observable<Blob> {
    return this.http.get(`${this.base}/transactions/export/pdf`, { responseType: 'blob' });
  }
}
