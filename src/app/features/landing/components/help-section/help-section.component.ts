import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-landing-help',
  imports: [TranslatePipe],
  templateUrl: './help-section.component.html',
  styleUrl: './help-section.component.css',
})
export class LandingHelpSection {}