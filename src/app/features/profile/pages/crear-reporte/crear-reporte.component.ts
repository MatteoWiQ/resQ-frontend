import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [FormsModule, BackButtonComponent],
  templateUrl: './crear-reporte.component.html',
  styleUrl: './crear-reporte.component.css',
})
export class CrearReporteComponent {
  readonly tiposCaso = ['PERDIDA', 'ENCONTRADA', 'ABANDONADA'];

  readonly form = {
    tipoCaso: '',
    descripcion: '',
    fotoUrl: '',
  };

  readonly paso = signal(1);
  readonly message = signal('');
  readonly enviando = signal(false);

  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly router = inject(Router);

  descripcionValida(): boolean {
    return this.form.descripcion.trim().length > 0;
  }

  seleccionarTipo(tipo: string): void {
    this.form.tipoCaso = tipo;
    this.message.set('');
  }

  continuar(): void {
    if (!this.form.tipoCaso) {
      this.message.set('Selecciona un tipo de reporte.');
      return;
    }
    this.message.set('');
    this.paso.set(2);
  }

  atras(): void {
    this.paso.set(1);
    this.message.set('');
  }

  crearReporte(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.message.set('No hay una sesión activa. Vuelve a iniciar sesión.');
      return;
    }
    if (!this.form.tipoCaso) {
      this.message.set('Selecciona un tipo de reporte.');
      return;
    }
    if (!this.descripcionValida()) {
      this.message.set('La descripción es obligatoria.');
      return;
    }

    this.message.set('');
    this.enviando.set(true);
    this.reporteService
      .crearReporte({
        idUsuario,
        tipoCaso: this.form.tipoCaso,
        descripcion: this.form.descripcion.trim(),
        fotoUrl: this.form.fotoUrl.trim() || null,
      })
      .subscribe({
        next: () => this.router.navigate(['/perfil']),
        error: () => {
          this.enviando.set(false);
          this.message.set('No se pudo crear el reporte. Inténtalo de nuevo.');
        },
      });
  }
}