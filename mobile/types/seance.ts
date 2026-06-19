import type { Classe } from './classe';
import type { Matiere } from './matiere';

export type Seance = {
  id: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  enseignant?: { id: number };
  classe: Classe;
  matiere: Matiere;
};
