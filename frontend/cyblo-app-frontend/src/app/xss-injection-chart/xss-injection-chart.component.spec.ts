import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XssInjectionChartComponent } from './xss-injection-chart.component';

describe('XssInjectionChartComponent', () => {
  let component: XssInjectionChartComponent;
  let fixture: ComponentFixture<XssInjectionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XssInjectionChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XssInjectionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
