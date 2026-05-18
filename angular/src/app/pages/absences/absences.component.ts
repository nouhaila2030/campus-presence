import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Absence } from '../../models/absence.model';
import { Classe } from '../../models/classe.model';
import { Seance } from '../../models/seance.model';
import { AbsenceService } from '../../services/absence.service';
import { AuthService } from '../../services/auth.service';
import { ClasseService } from '../../services/classe.service';
import { SeanceService } from '../../services/seance.service';

type JustifieeFilter = 'all' | 'justified' | 'unjustified';

@Component({
  selector: 'app-absences',
  imports: [RouterLink],
  templateUrl: './absences.component.html',
  styleUrl: './absences.component.css',
})
export class AbsencesComponent implements OnInit {
  private readonly absenceService = inject(AbsenceService);
  private readonly seanceService = inject(SeanceService);
  private readonly classeService = inject(ClasseService);
  protected readonly auth = inject(AuthService);

  protected readonly absences = signal<Absence[]>([]);
  protected readonly seances = signal<Seance[]>([]);
  protected readonly classes = signal<Classe[]>([]);
  protected readonly selectedSeanceId = signal<string>('');
  protected readonly selectedClasseId = signal<string>('');
  protected readonly selectedJustifieeFilter = signal<JustifieeFilter>('all');
  protected readonly studentSearch = signal('');
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly justifyModalOpen = signal(false);
  protected readonly justifyTarget = signal<Absence | null>(null);
  protected readonly justifyComment = signal('');
  protected readonly justifySubmitting = signal(false);
  protected readonly justifyError = signal('');

  protected readonly filteredAbsences = computed(() => {
    const seanceId = this.selectedSeanceId();
    const classeId = this.selectedClasseId();
    const justifieeFilter = this.selectedJustifieeFilter();
    const search = this.studentSearch().trim().toLowerCase();

    return this.absences().filter((absence) => {
      if (seanceId && String(absence.seance?.id ?? '') !== seanceId) {
        return false;
      }

      if (classeId) {
        const absenceClasseId =
          absence.etudiant?.classe?.id ?? absence.seance?.classe?.id ?? null;
        if (String(absenceClasseId ?? '') !== classeId) {
          return false;
        }
      }

      if (justifieeFilter === 'justified' && !absence.justifiee) {
        return false;
      }

      if (justifieeFilter === 'unjustified' && absence.justifiee) {
        return false;
      }

      if (search) {
        const nom = absence.etudiant?.nom?.toLowerCase() ?? '';
        const prenom = absence.etudiant?.prenom?.toLowerCase() ?? '';
        const fullName = `${prenom} ${nom}`.trim();
        if (!nom.includes(search) && !prenom.includes(search) && !fullName.includes(search)) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      absences: this.absenceService.getAll(),
      seances: this.seanceService.getAll(),
      classes: this.classeService.getAll(),
    }).subscribe({
      next: ({ absences, seances, classes }) => {
        this.absences.set(absences);
        this.seances.set(seances);
        this.classes.set(classes);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossible de charger les absences.');
      },
    });
  }

  onSeanceFilterChange(event: Event): void {
    this.selectedSeanceId.set((event.target as HTMLSelectElement).value);
  }

  onClasseFilterChange(event: Event): void {
    this.selectedClasseId.set((event.target as HTMLSelectElement).value);
  }

  onJustifieeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as JustifieeFilter;
    this.selectedJustifieeFilter.set(value);
  }

  onStudentSearchChange(event: Event): void {
    this.studentSearch.set((event.target as HTMLInputElement).value);
  }

  getClasseLabel(absence: Absence): string {
    return (
      absence.etudiant?.classe?.nom ??
      absence.seance?.classe?.nom ??
      (absence.seance?.classe?.id != null ? 'Classe ' + absence.seance.classe.id : '—')
    );
  }

  getMatiereLabel(absence: Absence): string {
    return (
      absence.seance?.matiere?.nom ??
      (absence.seance?.matiere?.id != null ? 'Matière ' + absence.seance.matiere.id : '—')
    );
  }

  formatTime(time: string | undefined): string {
    if (!time) {
      return '—';
    }
    return time.slice(0, 5);
  }

  openJustifyModal(absence: Absence): void {
    this.justifyTarget.set(absence);
    this.justifyComment.set('');
    this.justifyError.set('');
    this.justifyModalOpen.set(true);
  }

  closeJustifyModal(): void {
    if (this.justifySubmitting()) {
      return;
    }
    this.justifyModalOpen.set(false);
    this.justifyTarget.set(null);
    this.justifyComment.set('');
    this.justifyError.set('');
  }

  onJustifyCommentChange(event: Event): void {
    this.justifyComment.set((event.target as HTMLTextAreaElement).value);
  }

  confirmJustify(): void {
    const absence = this.justifyTarget();
    const commentaire = this.justifyComment().trim();
    if (!absence?.id) {
      return;
    }
    if (!commentaire) {
      this.justifyError.set('Veuillez saisir un commentaire.');
      return;
    }

    this.justifySubmitting.set(true);
    this.justifyError.set('');

    this.absenceService.justifier(absence.id, { commentaire }).subscribe({
      next: (updated) => {
        this.absences.update((list) =>
          list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
        );
        this.justifySubmitting.set(false);
        this.closeJustifyModal();
      },
      error: () => {
        this.justifySubmitting.set(false);
        this.justifyError.set('Impossible de justifier cette absence.');
      },
    });
  }
}
