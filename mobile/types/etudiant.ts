import type { Classe } from './classe';

export type Etudiant = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  photoUrl?: string;
  classe?: Classe;
};
