import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-guia-reporte',
  imports: [RouterLink, AppHeaderComponent, TranslatePipe],
  templateUrl: './guia-reporte.component.html',
  styleUrl: './guia-reporte.component.css',
})
export class GuiaReporteComponent {}
