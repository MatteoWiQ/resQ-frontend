import { Component } from '@angular/core';

import { LandingTopbar } from './components/topbar/topbar.component';
import { LandingHero } from './components/hero/hero.component';
import { LandingSteps } from './components/steps/steps.component';
import { LandingCasesSection } from './components/cases-section/cases-section.component';
import { LandingHelpSection } from './components/help-section/help-section.component';

@Component({
  selector: 'app-landing',
  imports: [
    LandingTopbar,
    LandingHero,
    LandingSteps,
    LandingCasesSection,
    LandingHelpSection
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {}