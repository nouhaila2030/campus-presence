import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Seance } from '../models/seance.model';

const API_URL = 'http://localhost:8080/api/seances';

@Injectable({ providedIn: 'root' })
export class SeanceService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Seance[]> {
    return this.http.get<Seance[]>(API_URL);
  }
}
