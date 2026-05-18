import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Absence, AbsenceCreate } from '../../models/absence.model';
import { Etudiant } from '../../models/etudiant.model';
import { Seance } from '../../models/seance.model';
import { AbsenceService } from '../../services/absence.service';
import { AuthService } from '../../services/auth.service';
import { EtudiantService } from '../../services/etudiant.service';
import { SeanceService } from '../../services/seance.service';

interface EtudiantPresence {
  etudiant: Etudiant;
  present: boolean;
}

interface ValidationResult {
  created: number;
  deleted: number;
  unchanged: number;
}

@Component({
  selector: 'app-presences',
  imports: [RouterLink],
  templateUrl: './presences.component.html',
  styleUrl: './presences.component.css',
})
export class PresencesComponent implements OnInit {
  private readonly seanceService = inject(SeanceService);
  private readonly etudiantService = inject(EtudiantService);
  private readonly absenceService = inject(AbsenceService);
  protected readonly auth = inject(AuthService);

  protected readonly seances = signal<Seance[]>([]);
  protected readonly selectedSeanceId = signal<number | null>(null);
  protected readonly etudiantsPresence = signal<EtudiantPresence[]>([]);
  protected readonly isLoadingSeances = signal(true);
  protected readonly isLoadingEtudiants = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly selectedSeance = computed(() => {
    const id = this.selectedSeanceId();
    if (id === null) {
      return null;
    }
    return this.seances().find((s) => s.id === id) ?? null;
  });

  protected readonly absentCount = computed(
    () => this.etudiantsPresence().filter((e) => !e.present).length,
  );

  ngOnInit(): void {
    this.loadSeances();
  }

  private loadSeances(): void {
    this.isLoadingSeances.set(true);
    this.errorMessage.set('');

    this.seanceService.getAll().subscribe({
      next: (seances) => {
        this.seances.set(seances);
        this.isLoadingSeances.set(false);
      },
      error: () => {
        this.isLoadingSeances.set(false);
        this.errorMessage.set('Impossible de charger les séances.');
      },
    });
  }

  onSeanceChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!value) {
      this.selectedSeanceId.set(null);
      this.etudiantsPresence.set([]);
      return;
    }

    const seanceId = Number(value);
    this.selectedSeanceId.set(seanceId);
    this.loadEtudiantsForSeance(seanceId);
  }

  private loadEtudiantsForSeance(seanceId: number): void {
    const seance = this.seances().find((s) => s.id === seanceId);
    const classeId = seance?.classe?.id;

    if (!classeId) {
      this.etudiantsPresence.set([]);
      this.errorMessage.set('Cette séance n\'a pas de classe associée.');
      return;
    }

    this.isLoadingEtudiants.set(true);

    forkJoin({
      etudiants: this.etudiantService.getAll(),
      absences: this.absenceService.getBySeanceId(seanceId),
    }).subscribe({
      next: ({ etudiants, absences }) => {
        const absentEtudiantIds = this.getAbsentEtudiantIdsFromAbsences(absences);

        const filtered = etudiants
          .filter((e) => e.classe?.id === classeId)
          .map((etudiant) => ({
            etudiant,
            present: !absentEtudiantIds.has(etudiant.id),
          }));

        this.etudiantsPresence.set(filtered);
        this.isLoadingEtudiants.set(false);
      },
      error: () => {
        this.isLoadingEtudiants.set(false);
        this.errorMessage.set('Impossible de charger les étudiants.');
      },
    });
  }

  setPresence(index: number, present: boolean): void {
    this.etudiantsPresence.update((list) =>
      list.map((item, i) => (i === index ? { ...item, present } : item)),
    );
  }

  private getAbsentEtudiantIdsFromAbsences(absences: Absence[]): Set<number> {
    const ids = new Set<number>();
    for (const absence of absences) {
      const etudiantId = absence.etudiant?.id;
      if (etudiantId != null) {
        ids.add(etudiantId);
      }
    }
    return ids;
  }

  /** One entry per étudiant (last occurrence wins if duplicates in the list). */
  private getEtudiantsPresenceUnique(): Map<number, EtudiantPresence> {
    const byEtudiantId = new Map<number, EtudiantPresence>();

    for (const entry of this.etudiantsPresence()) {
      byEtudiantId.set(entry.etudiant.id, entry);
    }

    return byEtudiantId;
  }

  /** Map étudiant id → absences for this séance (handles duplicate rows in DB). */
  private groupAbsencesByEtudiantId(absences: Absence[]): Map<number, Absence[]> {
    const grouped = new Map<number, Absence[]>();

    for (const absence of absences) {
      const etudiantId = absence.etudiant?.id;
      if (etudiantId == null || absence.id == null) {
        continue;
      }

      const list = grouped.get(etudiantId) ?? [];
      list.push(absence);
      grouped.set(etudiantId, list);
    }

    return grouped;
  }

  private buildSyncOperations(
    seance: Seance,
    presenceByEtudiant: Map<number, EtudiantPresence>,
    absencesByEtudiant: Map<number, Absence[]>,
  ): { operations: Observable<unknown>[]; result: ValidationResult } {
    const operations: Observable<unknown>[] = [];
    let created = 0;
    let deleted = 0;
    let unchanged = 0;

    for (const [etudiantId, entry] of presenceByEtudiant) {
      const existing = absencesByEtudiant.get(etudiantId) ?? [];

      if (!entry.present) {
        if (existing.length === 0) {
          const body: AbsenceCreate = {
            date: seance.date,
            justifiee: false,
            etudiant: { id: etudiantId },
            seance: { id: seance.id },
          };
          operations.push(this.absenceService.create(body));
          created += 1;
        } else {
          unchanged += 1;
        }
        continue;
      }

      if (existing.length === 0) {
        unchanged += 1;
        continue;
      }

      for (const absence of existing) {
        if (absence.id != null) {
          operations.push(this.absenceService.delete(absence.id));
          deleted += 1;
        }
      }
    }

    return { operations, result: { created, deleted, unchanged } };
  }

  private formatValidationMessage(result: ValidationResult): string {
    const parts: string[] = [];

    if (result.created > 0) {
      parts.push(
        `${result.created} absence${result.created > 1 ? 's' : ''} enregistrée${result.created > 1 ? 's' : ''}`,
      );
    }

    if (result.deleted > 0) {
      parts.push(
        `${result.deleted} absence${result.deleted > 1 ? 's' : ''} supprimée${result.deleted > 1 ? 's' : ''}`,
      );
    }

    if (parts.length === 0) {
      return 'Aucune modification à enregistrer.';
    }

    return parts.join(', ') + '.';
  }

  valider(): void {
    const seance = this.selectedSeance();
    if (!seance) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.absenceService
      .getBySeanceId(seance.id)
      .pipe(
        switchMap((existingAbsences) => {
          const presenceByEtudiant = this.getEtudiantsPresenceUnique();
          const absencesByEtudiant = this.groupAbsencesByEtudiantId(existingAbsences);
          const { operations, result } = this.buildSyncOperations(
            seance,
            presenceByEtudiant,
            absencesByEtudiant,
          );

          if (operations.length === 0) {
            return of(result);
          }

          return forkJoin(operations).pipe(map(() => result));
        }),
      )
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          this.successMessage.set(this.formatValidationMessage(result));
        },
        error: () => {
          this.isSubmitting.set(false);
          this.errorMessage.set('Erreur lors de l\'enregistrement des présences.');
        },
      });
  }
}
