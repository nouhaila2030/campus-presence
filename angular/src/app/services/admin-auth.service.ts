import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Admin, LoginRequest } from '../models/admin.model';

const API_URL = 'http://localhost:8080/api/admins';
const STORAGE_KEY = 'admin';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string): Observable<Admin> {
    const body: LoginRequest = { email, password };
    return this.http.post<Admin>(`${API_URL}/login`, body).pipe(
      tap((admin) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
        this.router.navigate(['/admin']);
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  getAdmin(): Admin | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Admin;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getAdmin() !== null;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/admin-login']);
  }
}
