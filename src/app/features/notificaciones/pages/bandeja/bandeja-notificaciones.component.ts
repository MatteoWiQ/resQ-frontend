import { Component } from '@angular/core';

import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { NotificacionesComponent } from '../../../../shared/components/notificaciones/notificaciones.component';

@Component({
  selector: 'app-bandeja-notificaciones',
  standalone: true,
  imports: [AppHeaderComponent, BackButtonComponent, NotificacionesComponent],
  templateUrl: './bandeja-notificaciones.component.html',
  styleUrl: './bandeja-notificaciones.component.css',
})
export class BandejaNotificacionesComponent {}
