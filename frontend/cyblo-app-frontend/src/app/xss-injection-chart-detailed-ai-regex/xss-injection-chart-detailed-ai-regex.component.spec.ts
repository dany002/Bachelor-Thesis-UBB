import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XssInjectionChartDetailedAiRegexComponent } from './xss-injection-chart-detailed-ai-regex.component';

describe('XssInjectionChartDetailedAiRegexComponent', () => {
  let component: XssInjectionChartDetailedAiRegexComponent;
  let fixture: ComponentFixture<XssInjectionChartDetailedAiRegexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XssInjectionChartDetailedAiRegexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XssInjectionChartDetailedAiRegexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
