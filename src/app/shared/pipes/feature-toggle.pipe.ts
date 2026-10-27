import { Pipe, PipeTransform } from '@angular/core';
import { FeatureToggleService } from '../services/feature-toggle.service';

@Pipe({
  name: 'featureToggle',
  standalone: true,
})
export class FeatureTogglePipe implements PipeTransform {
  constructor(private ft: FeatureToggleService) {}

  transform<T>(value: T | string): T {
    // Si es string, asumimos que es el nombre de la flag
    if (typeof value === 'string') {
      return this.ft.isEnabled(value as keyof import('../core/config/feature-flags.model').FeatureFlags) ? value : null as any;
    }
    return value;
  }
}