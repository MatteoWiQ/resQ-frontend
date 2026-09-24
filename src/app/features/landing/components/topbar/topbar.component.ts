import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing-topbar',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})

export class LandingTopbar {
  protected readonly authService = inject(AuthService);

  esAdmin(): boolean {
    return this.authService.usuarioActual()?.rol === 'ADMINISTRADOR';
  }
}