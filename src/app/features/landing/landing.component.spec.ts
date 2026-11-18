import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero heading', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Conectamos');
  });
});