import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEntitiesDialogComponent } from './manage-entities-dialog.component';

describe('ManageEntitiesDialogComponent', () => {
  let component: ManageEntitiesDialogComponent;
  let fixture: ComponentFixture<ManageEntitiesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageEntitiesDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEntitiesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
