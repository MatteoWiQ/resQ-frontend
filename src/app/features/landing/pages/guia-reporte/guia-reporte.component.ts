import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LandingTopbar } from '../../components/topbar/topbar.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-guia-reporte',
  imports: [RouterLink, LandingTopbar, TranslatePipe],
  templateUrl: './guia-reporte.component.html',
  styleUrl: './guia-reporte.component.css',
})
export class GuiaReporteComponent {}
