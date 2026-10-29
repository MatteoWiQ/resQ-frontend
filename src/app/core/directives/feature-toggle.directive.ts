import { Directive, Input, OnInit, ElementRef } from '@angular/core';
import { FeatureToggleService } from '../services/feature-toggle.service';

@Directive({
  selector: '[appFeatureToggle]',
  standalone: true,
})
export class FeatureToggleDirective implements OnInit {
  @Input() set appFeatureToggle(flag: string) {
    if (this.ft.isEnabled(flag as any)) {
      this.el.nativeElement.style.display = '';
    } else {
      this.el.nativeElement.style.display = 'none';
    }
  }

  constructor(private el: ElementRef, private ft: FeatureToggleService) {}

  ngOnInit(): void {
    // Si ya tiene un valor por input inicial, el setter ya se llamó
  }
}