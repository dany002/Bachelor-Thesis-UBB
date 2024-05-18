import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFileDialogComponent } from './add-file-dialog.component';

describe('AddFileDialogComponent', () => {
  let component: AddFileDialogComponent;
  let fixture: ComponentFixture<AddFileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddFileDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
