import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, BackButtonComponent, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  usuario = {
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    rol: ''
  };

  message = signal('');

  constructor(private authService: AuthService, private translate: TranslateService) {}

  onRegister() {
    this.message.set('');
    this.authService.register(this.usuario).subscribe({
      next: () => {
        this.message.set(this.translate.t('auth.register.ok'));
      },
      error: () => {
        this.message.set(this.translate.t('auth.register.errorDb'));
      }
    });
  }
}