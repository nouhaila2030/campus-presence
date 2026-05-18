export interface Admin {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export interface AdminCreate {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
