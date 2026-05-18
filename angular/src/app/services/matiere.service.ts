import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Matiere } from '../models/matiere.model';

const API_URL = 'http://localhost:8080/api/matieres';

export interface MatiereCreate {
  nom: string;
  coefficient: number;
}

@Injectable({ providedIn: 'root' })
export class MatiereService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(API_URL);
  }

  create(body: MatiereCreate): Observable<Matiere> {
    return this.http.post<Matiere>(API_URL, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
