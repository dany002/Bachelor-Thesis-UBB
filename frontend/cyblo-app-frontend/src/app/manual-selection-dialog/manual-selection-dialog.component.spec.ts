import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualSelectionDialogComponent } from './manual-selection-dialog.component';

describe('ManualSelectionDialogComponent', () => {
  let component: ManualSelectionDialogComponent;
  let fixture: ComponentFixture<ManualSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualSelectionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
