import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Enseignant, LoginRequest } from '../models/enseignant.model';

const API_URL = 'http://localhost:8080/api/enseignants';
const STORAGE_KEY = 'enseignant';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string): Observable<Enseignant> {
    const body: LoginRequest = { email, password };
    return this.http.post<Enseignant>(`${API_URL}/login`, body).pipe(
      tap((enseignant) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enseignant));
        this.router.navigate(['/dashboard']);
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  getEnseignant(): Enseignant | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Enseignant;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getEnseignant() !== null;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login']);
  }
}
