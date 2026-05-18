import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Enseignant } from '../models/enseignant.model';

const API_URL = 'http://localhost:8080/api/enseignants';

export interface EnseignantCreate {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  matricule: string;
}

@Injectable({ providedIn: 'root' })
export class EnseignantService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Enseignant[]> {
    return this.http.get<Enseignant[]>(API_URL);
  }

  create(body: EnseignantCreate): Observable<Enseignant> {
    return this.http.post<Enseignant>(API_URL, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }
}
