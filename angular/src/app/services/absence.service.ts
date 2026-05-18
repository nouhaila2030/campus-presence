import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Absence, AbsenceCreate, JustifierRequest } from '../models/absence.model';

const API_URL = 'http://localhost:8080/api/absences';

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Absence[]> {
    return this.http.get<Absence[]>(API_URL);
  }

  getBySeanceId(seanceId: number): Observable<Absence[]> {
    return this.http.get<Absence[]>(API_URL, { params: { seanceId } });
  }

  create(absence: AbsenceCreate): Observable<Absence> {
    return this.http.post<Absence>(API_URL, absence);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }

  justifier(id: number, body: JustifierRequest): Observable<Absence> {
    return this.http.put<Absence>(`${API_URL}/${id}/justifier`, body);
  }
}
