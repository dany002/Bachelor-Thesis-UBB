import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlInjectionChartComponent } from './sql-injection-chart.component';

describe('SqlInjectionChartComponent', () => {
  let component: SqlInjectionChartComponent;
  let fixture: ComponentFixture<SqlInjectionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlInjectionChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlInjectionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
