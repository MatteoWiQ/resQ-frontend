import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing-steps',
  imports: [TranslatePipe],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.css',
})
export class LandingSteps {}