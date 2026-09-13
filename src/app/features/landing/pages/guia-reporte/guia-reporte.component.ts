import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LandingTopbar } from '../../components/topbar/topbar.component';

@Component({
  selector: 'app-guia-reporte',
  imports: [RouterLink, LandingTopbar],
  templateUrl: './guia-reporte.component.html',
  styleUrl: './guia-reporte.component.css',
})
export class GuiaReporteComponent {}
