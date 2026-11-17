import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

/** Inicio: como funciona ResQ, contado como la historia de un caso con la hora de cada paso. */
@Component({
  selector: 'app-landing-steps',
  imports: [TranslatePipe],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.css',
})
export class LandingSteps {}
