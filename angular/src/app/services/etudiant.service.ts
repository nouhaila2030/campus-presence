import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Etudiant } from '../models/etudiant.model';

const API_URL = 'http://localhost:8080/api/etudiants';

@Injectable({ providedIn: 'root' })
export class EtudiantService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Etudiant[]> {
    return this.http.get<Etudiant[]>(API_URL);
  }

  create(body: Record<string, unknown>): Observable<Etudiant> {
    return this.http.post<Etudiant>(API_URL, body);
  }

  updatePhoto(id: number, photoUrl: string): Observable<Etudiant> {
    return this.http.put<Etudiant>(`${API_URL}/${id}/photo`, { photoUrl });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
