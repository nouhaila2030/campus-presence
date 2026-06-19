import type { Etudiant } from './etudiant';

export type Absence = {
  id: number;
  date: string;
  justifiee: boolean;
  etudiant: Etudiant;
};
