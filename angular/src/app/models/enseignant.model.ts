export interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
