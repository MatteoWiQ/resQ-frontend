import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  imports: [],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.css',
})
export class BackButtonComponent {
  readonly ruta = input<string>();

  private readonly location = inject(Location);
  private readonly router = inject(Router);

  goBack(): void {
    const destino = this.ruta();
    if (destino) {
      this.router.navigate([destino]);
      return;
    }
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}