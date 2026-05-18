import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-login-admin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-admin.component.html',
  styleUrls: ['../login/login.component.css', './login-admin.component.css'],
})
export class LoginAdminComponent {
  private readonly adminAuth = inject(AdminAuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isLoading.set(true);

    this.adminAuth.login(email, password).subscribe({
      next: () => this.isLoading.set(false),
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Email ou mot de passe incorrect');
      },
    });
  }
}
