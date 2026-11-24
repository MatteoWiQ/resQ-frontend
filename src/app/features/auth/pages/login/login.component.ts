import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationKey } from '../../../../core/i18n/strings';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { LoginRequest } from '../../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, BackButtonComponent, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly credentials: LoginRequest = { email: '', password: '' };

  readonly message = signal('');

  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  onLogin(): void {
    this.message.set('');
    this.authService.login(this.credentials).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destino = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
        void this.router.navigateByUrl(destino);
      },
      error: (err) => {
        const mensaje: TranslationKey =
          err?.status === 401
            ? 'auth.login.errorCredenciales'
            : 'auth.login.errorDb';
        this.message.set(this.translate.t(mensaje));
      },
    });
  }
}
