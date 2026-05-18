import { Classe } from './classe.model';

export interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  photoUrl?: string;
  classe?: Classe;
}
