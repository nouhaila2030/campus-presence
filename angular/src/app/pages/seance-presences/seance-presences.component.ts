import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Classe { id: number; nom: string; niveau: string; }
interface Etudiant { id: number; nom: string; prenom: string; matricule: string; classe?: Classe; }
interface Seance { id: number; date: string; heureDebut: string; heureFin: string; matiere?: { nom: string }; classe?: { nom: string }; }
interface Absence { id: number; date: string; justifiee: boolean; etudiant?: Etudiant; seance?: { id: number }; }

const API = 'http://localhost:8080/api';

@Component({
  selector: 'app-seance-presences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seance-presences.component.html',
  styleUrl: './seance-presences.component.css',
})
export class SeancePresencesComponent implements OnInit {
  seances   = signal<Seance[]>([]);
  etudiants = signal<Etudiant[]>([]);   // tous les étudiants
  absences  = signal<Absence[]>([]);    // absences de la séance
  selected  = signal<Seance | null>(null);
  loading   = signal(false);
  error     = signal('');

  // IDs des absents pour cette séance
  private absentIds = computed(() =>
    new Set(this.absences().map(a => a.etudiant?.id).filter((id): id is number => id != null))
  );

  // Présents = tous les étudiants SAUF les absents
  presents = computed(() => this.etudiants().filter(e => !this.absentIds().has(e.id)));
  // Absents = étudiants qui ont une absence
  absents  = computed(() => this.etudiants().filter(e =>  this.absentIds().has(e.id)));

  presentsByFiliere = computed(() => this.groupByFiliere(this.presents()));
  absentsByFiliere  = computed(() => this.groupByFiliere(this.absents()));

  ngOnInit() { this.loadSeances(); }

  private groupByFiliere(list: Etudiant[]): Record<string, Etudiant[]> {
    return list.reduce((acc, e) => {
      const k = e.classe?.nom ?? 'Autre';
      (acc[k] = acc[k] ?? []).push(e);
      return acc;
    }, {} as Record<string, Etudiant[]>);
  }

  private async loadSeances() {
    try {
      const r = await fetch(`${API}/seances`);
      const d = await r.json();
      this.seances.set(Array.isArray(d) ? d : []);
    } catch { this.error.set('Impossible de charger les séances.'); }
  }

  async onSeanceChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) {
      this.selected.set(null);
      this.absences.set([]);
      this.etudiants.set([]);
      return;
    }
    this.selected.set(this.seances().find(s => s.id === id) ?? null);
    this.loading.set(true);
    this.error.set('');
    try {
      // Charger en parallèle : tous les étudiants (sans photo) + absences de la séance
      const [etudiantsRes, absencesRes] = await Promise.all([
        fetch(`${API}/etudiants/light`),
        fetch(`${API}/absences?seanceId=${id}`),
      ]);

      const etudiantsData = await etudiantsRes.json();
      const absencesData  = await absencesRes.json();

      // Les étudiants viennent de /api/etudiants (avec classe)
      this.etudiants.set(Array.isArray(etudiantsData) ? etudiantsData : []);
      // Les absences viennent de /api/absences?seanceId=X (avec etudiant imbriqué)
      this.absences.set(Array.isArray(absencesData) ? absencesData : []);

    } catch (e) {
      this.error.set('Erreur lors du chargement des données.');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  getJustifiee(etudiantId: number): boolean {
    return this.absences().find(a => a.etudiant?.id === etudiantId)?.justifiee ?? false;
  }

  keys(obj: Record<string, unknown>) { return Object.keys(obj); }
}
