import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Classe } from '../models/classe.model';

const API_URL = 'http://localhost:8080/api/classes';

@Injectable({ providedIn: 'root' })
export class ClasseService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Classe[]> {
    return this.http.get<Classe[]>(API_URL);
  }

  create(body: Partial<Classe>): Observable<Classe> {
    return this.http.post<Classe>(API_URL, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
