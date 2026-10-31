import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number; firstName: string; lastName: string; email: string;
  role: string; profilePicture?: string; faceEnabled?: boolean; currency: string; darkMode: boolean;
}
export interface AuthResponse { accessToken: string; refreshToken: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem('fintrack_user');
    if (saved) this.currentUser.next(JSON.parse(saved));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  faceLogin(faceEmbedding: number[]): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/face-login`, {
      faceEmbedding: JSON.stringify(faceEmbedding)
    }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  register(data: any): Observable<AuthResponse> {
    const payload = {
      ...data,
      faceEmbedding: Array.isArray(data.faceEmbedding) ? JSON.stringify(data.faceEmbedding) : data.faceEmbedding
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem('fintrack_token', res.accessToken);
    localStorage.setItem('fintrack_refresh', res.refreshToken);
    localStorage.setItem('fintrack_user', JSON.stringify(res.user));
    this.currentUser.next(res.user);
  }

  logout() {
    const user = this.getUser();
    if (user && user.email) {
      this.http.post(`${this.apiUrl}/logout`, { email: user.email }).subscribe({
        next: () => console.log('Backend logout successful'),
        error: (err) => console.error('Backend logout failed', err)
      });
    }
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_refresh');
    localStorage.removeItem('fintrack_user');
    this.currentUser.next(null);
    this.router.navigate(['/login']);
  }

  updateUser(updatedUser: User) {
    localStorage.setItem('fintrack_user', JSON.stringify(updatedUser));
    this.currentUser.next(updatedUser);
  }

  isLoggedIn(): boolean { return !!localStorage.getItem('fintrack_token'); }
  getUser(): User | null { return this.currentUser.value; }
  getToken(): string | null { return localStorage.getItem('fintrack_token'); }

  isAdmin(): boolean {
    const user = this.getUser();
    if (!user) return false;
    const email = (user.email || '').toLowerCase();
    return email === 'admin@gmail.com';
  }
}
