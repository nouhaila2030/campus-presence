import { Etudiant } from './etudiant.model';
import { Seance } from './seance.model';

export interface Absence {
  id?: number;
  date: string;
  justifiee: boolean;
  commentaire?: string | null;
  etudiant?: Etudiant;
  seance?: Seance;
}

export interface JustifierRequest {
  commentaire: string;
}

export interface AbsenceCreate {
  date: string;
  justifiee: boolean;
  etudiant: Pick<Etudiant, 'id'>;
  seance: Pick<Seance, 'id'>;
}
