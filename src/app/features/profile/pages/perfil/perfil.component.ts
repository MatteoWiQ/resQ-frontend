import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly reporteService = inject(ReporteService);

  readonly usuario = signal<Usuario | null>(null);
  readonly reportes = signal<Reporte[]>([]);
  readonly cargandoPerfil = signal(true);
  readonly cargandoReportes = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();

    if (!idUsuario) {
      this.error.set('No hay una sesión activa.');
      this.cargandoPerfil.set(false);
      this.cargandoReportes.set(false);
      return;
    }

    this.usuarioService.obtenerPorId(idUsuario).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu información de perfil.');
        this.cargandoPerfil.set(false);
      },
    });

    this.reporteService.obtenerMisReportes(idUsuario).subscribe((reportes) => {
      this.reportes.set(reportes);
      this.cargandoReportes.set(false);
    });
  }

  iniciales(nombre: string | undefined): string {
    if (!nombre) return '?';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  claseEstado(estado: string): string {
    return `estado estado-${estado.toLowerCase()}`;
  }
}