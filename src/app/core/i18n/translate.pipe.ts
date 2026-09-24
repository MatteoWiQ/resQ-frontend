import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslateParams, TranslateService } from './translate.service';
import { TranslationKey } from './strings';

@Pipe({ name: 'translate', pure: false, standalone: true })
export class TranslatePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);

  transform(key: TranslationKey, params?: TranslateParams): string {
    this.translateService.lang();
    return this.translateService.t(key, params);
  }
}