import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlInjectionChartDetailedAiRegexComponent } from './sql-injection-chart-detailed-ai-regex.component';

describe('SqlInjectionChartDetailedAiRegexComponent', () => {
  let component: SqlInjectionChartDetailedAiRegexComponent;
  let fixture: ComponentFixture<SqlInjectionChartDetailedAiRegexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlInjectionChartDetailedAiRegexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlInjectionChartDetailedAiRegexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
