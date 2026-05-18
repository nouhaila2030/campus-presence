import { Classe } from './classe.model';
import { Enseignant } from './enseignant.model';
import { Matiere } from './matiere.model';

export interface Seance {
  id: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  enseignant?: Enseignant;
  classe?: Classe;
  matiere?: Matiere;
}
