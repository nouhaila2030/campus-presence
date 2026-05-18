import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, from, switchMap } from 'rxjs';
import { Classe } from '../../models/classe.model';
import { Etudiant } from '../../models/etudiant.model';
import { Enseignant } from '../../models/enseignant.model';
import { Matiere } from '../../models/matiere.model';
import { AdminAuthService } from '../../services/admin-auth.service';
import { ClasseService } from '../../services/classe.service';
import { EnseignantService } from '../../services/enseignant.service';
import { EtudiantService } from '../../services/etudiant.service';
import { MatiereService } from '../../services/matiere.service';
import { readImageAsDataUrl } from '../../utils/file-to-base64';
import { AdminStatsComponent } from './admin-stats.component';

type AdminSection = 'etudiants' | 'enseignants' | 'classes' | 'matieres' | 'stats';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, AdminStatsComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly etudiantService = inject(EtudiantService);
  private readonly enseignantService = inject(EnseignantService);
  private readonly classeService = inject(ClasseService);
  private readonly matiereService = inject(MatiereService);

  protected readonly admin = this.adminAuth.getAdmin();
  protected readonly activeSection = signal<AdminSection>('etudiants');
  protected readonly isLoading = signal(true);
  protected readonly actionMessage = signal('');
  protected readonly actionError = signal('');

  protected readonly etudiants = signal<Etudiant[]>([]);
  protected readonly enseignants = signal<Enseignant[]>([]);
  protected readonly classes = signal<Classe[]>([]);
  protected readonly matieres = signal<Matiere[]>([]);
  protected readonly newEtudiantPhotoUrl = signal<string | null>(null);
  protected readonly newEtudiantPhotoName = signal('');
  protected readonly photoUploadTargetId = signal<number | null>(null);
  protected readonly isUploadingPhoto = signal(false);

  @ViewChild('existingPhotoInput')
  private existingPhotoInput?: ElementRef<HTMLInputElement>;

  protected readonly etudiantForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    matricule: ['', Validators.required],
    classeId: ['', Validators.required],
  });

  protected readonly enseignantForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    matricule: ['', Validators.required],
  });

  protected readonly classeForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    niveau: ['', Validators.required],
  });

  protected readonly matiereForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    coefficient: [1, [Validators.required, Validators.min(0.1)]],
  });

  ngOnInit(): void {
    if (!this.adminAuth.isLoggedIn()) {
      this.router.navigate(['/admin-login']);
      return;
    }
    this.loadAll();
  }

  setSection(section: AdminSection): void {
    this.activeSection.set(section);
    this.actionMessage.set('');
    this.actionError.set('');
  }

  private loadAll(): void {
    this.isLoading.set(true);
    forkJoin({
      etudiants: this.etudiantService.getAll(),
      enseignants: this.enseignantService.getAll(),
      classes: this.classeService.getAll(),
      matieres: this.matiereService.getAll(),
    }).subscribe({
      next: ({ etudiants, enseignants, classes, matieres }) => {
        this.etudiants.set(etudiants);
        this.enseignants.set(enseignants);
        this.classes.set(classes);
        this.matieres.set(matieres);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.actionError.set('Impossible de charger les données.');
      },
    });
  }

  onNewEtudiantPhotoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    readImageAsDataUrl(file)
      .then((dataUrl) => {
        this.newEtudiantPhotoUrl.set(dataUrl);
        this.newEtudiantPhotoName.set(file.name);
        this.actionError.set('');
      })
      .catch((err: Error) => {
        this.newEtudiantPhotoUrl.set(null);
        this.newEtudiantPhotoName.set('');
        this.actionError.set(err.message);
      });
  }

  clearNewEtudiantPhoto(): void {
    this.newEtudiantPhotoUrl.set(null);
    this.newEtudiantPhotoName.set('');
  }

  pickPhotoForEtudiant(etudiantId: number): void {
    this.photoUploadTargetId.set(etudiantId);
    this.existingPhotoInput?.nativeElement.click();
  }

  onExistingEtudiantPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const etudiantId = this.photoUploadTargetId();

    input.value = '';

    if (!file || etudiantId == null) {
      return;
    }

    this.isUploadingPhoto.set(true);
    this.actionError.set('');

    from(readImageAsDataUrl(file))
      .pipe(switchMap((photoUrl) => this.etudiantService.updatePhoto(etudiantId, photoUrl)))
      .subscribe({
        next: (updated) => {
          this.etudiants.update((list) =>
            list.map((e) => (e.id === updated.id ? { ...e, photoUrl: updated.photoUrl } : e)),
          );
          this.actionMessage.set('Photo enregistrée.');
          this.isUploadingPhoto.set(false);
          this.photoUploadTargetId.set(null);
        },
        error: (err: Error) => {
          this.isUploadingPhoto.set(false);
          this.photoUploadTargetId.set(null);
          this.actionError.set(err?.message || 'Erreur lors de l\'envoi de la photo.');
        },
      });
  }

  addEtudiant(): void {
    if (this.etudiantForm.invalid) {
      this.etudiantForm.markAllAsTouched();
      return;
    }
    const v = this.etudiantForm.getRawValue();
    const body: Record<string, unknown> = {
      nom: v.nom,
      prenom: v.prenom,
      email: v.email,
      matricule: v.matricule,
      classe: { id: Number(v.classeId) },
    };

    const photoUrl = this.newEtudiantPhotoUrl();
    if (photoUrl) {
      body['photoUrl'] = photoUrl;
    }

    this.etudiantService.create(body).subscribe({
      next: (created) => {
        this.etudiants.update((list) => [...list, created]);
        this.etudiantForm.reset();
        this.clearNewEtudiantPhoto();
        this.actionMessage.set('Étudiant ajouté.');
        this.actionError.set('');
      },
      error: () => this.actionError.set('Erreur lors de l\'ajout de l\'étudiant.'),
    });
  }

  deleteEtudiant(id: number): void {
    if (!confirm('Supprimer cet étudiant ?')) return;
    this.etudiantService.delete(id).subscribe({
      next: () => {
        this.etudiants.update((list) => list.filter((e) => e.id !== id));
        this.actionMessage.set('Étudiant supprimé.');
      },
      error: () => this.actionError.set('Erreur lors de la suppression.'),
    });
  }

  addEnseignant(): void {
    if (this.enseignantForm.invalid) {
      this.enseignantForm.markAllAsTouched();
      return;
    }
    this.enseignantService.create(this.enseignantForm.getRawValue()).subscribe({
      next: (created) => {
        this.enseignants.update((list) => [...list, created]);
        this.enseignantForm.reset();
        this.actionMessage.set('Enseignant ajouté.');
        this.actionError.set('');
      },
      error: () => this.actionError.set('Erreur lors de l\'ajout de l\'enseignant.'),
    });
  }

  deleteEnseignant(id: number): void {
    if (!confirm('Supprimer cet enseignant ?')) return;
    this.enseignantService.delete(id).subscribe({
      next: () => {
        this.enseignants.update((list) => list.filter((e) => e.id !== id));
        this.actionMessage.set('Enseignant supprimé.');
      },
      error: () => this.actionError.set('Erreur lors de la suppression.'),
    });
  }

  addClasse(): void {
    if (this.classeForm.invalid) {
      this.classeForm.markAllAsTouched();
      return;
    }
    this.classeService.create(this.classeForm.getRawValue()).subscribe({
      next: (created) => {
        this.classes.update((list) => [...list, created]);
        this.classeForm.reset();
        this.actionMessage.set('Classe ajoutée.');
        this.actionError.set('');
      },
      error: () => this.actionError.set('Erreur lors de l\'ajout de la classe.'),
    });
  }

  deleteClasse(id: number): void {
    if (!confirm('Supprimer cette classe ?')) return;
    this.classeService.delete(id).subscribe({
      next: () => {
        this.classes.update((list) => list.filter((c) => c.id !== id));
        this.actionMessage.set('Classe supprimée.');
      },
      error: () => this.actionError.set('Erreur lors de la suppression.'),
    });
  }

  addMatiere(): void {
    if (this.matiereForm.invalid) {
      this.matiereForm.markAllAsTouched();
      return;
    }
    const v = this.matiereForm.getRawValue();
    this.matiereService.create({ nom: v.nom, coefficient: Number(v.coefficient) }).subscribe({
      next: (created) => {
        this.matieres.update((list) => [...list, created]);
        this.matiereForm.reset({ nom: '', coefficient: 1 });
        this.actionMessage.set('Matière ajoutée.');
        this.actionError.set('');
      },
      error: () => this.actionError.set('Erreur lors de l\'ajout de la matière.'),
    });
  }

  deleteMatiere(id: number): void {
    if (!confirm('Supprimer cette matière ?')) return;
    this.matiereService.delete(id).subscribe({
      next: () => {
        this.matieres.update((list) => list.filter((m) => m.id !== id));
        this.actionMessage.set('Matière supprimée.');
      },
      error: () => this.actionError.set('Erreur lors de la suppression.'),
    });
  }

  logout(): void {
    this.adminAuth.logout();
  }
}
