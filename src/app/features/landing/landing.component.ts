import { Component } from '@angular/core';

import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { LandingHero } from './components/hero/hero.component';
import { LandingSteps } from './components/steps/steps.component';
import { LandingCasesSection } from './components/cases-section/cases-section.component';
import { LandingHelpSection } from './components/help-section/help-section.component';
import { MapaComponent } from './components/mapa/mapa.component';

@Component({
  selector: 'app-landing',
  imports: [
    AppHeaderComponent,
    LandingHero,
    LandingSteps,
    LandingCasesSection,
    LandingHelpSection,
    MapaComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {}