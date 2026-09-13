import { Component } from '@angular/core';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [BackButtonComponent],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css',
})
export class PanelAdminComponent {}