import { Pipe, PipeTransform } from '@angular/core';
import { FeatureToggleService } from '../../core/services/feature-toggle.service';
import { FeatureFlags } from '../../core/config/feature-flags.model';

@Pipe({
  name: 'featureToggle',
  standalone: true,
})
export class FeatureTogglePipe implements PipeTransform {
  constructor(private ft: FeatureToggleService) {}

  transform<T>(value: T | string): T {
    // Si es string, asumimos que es el nombre de la flag
    if (typeof value === 'string') {
      return this.ft.isEnabled(value as keyof FeatureFlags) ? value : null as any;
    }
    return value;
  }
}