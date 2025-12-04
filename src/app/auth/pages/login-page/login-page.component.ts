import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@src/environments/environment';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  showPassword = signal(false);
  cleanInput = signal(false);

  envs = environment;

  private authService = inject(AuthService);
  router = inject(Router);

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/),
      ],
    ],
  });

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 2000);
      return;
    }

    const { username = '', password = '' } = this.loginForm.value;

    this.authService
      .login(username!, password!)
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigateByUrl('/dashboard');
          return;
        }

        this.hasError.set(true);
        this.loginForm.patchValue({ password: '' });
        setTimeout(() => {
          this.hasError.set(false);
        }, 2000);
        return;
      });
  }
}
