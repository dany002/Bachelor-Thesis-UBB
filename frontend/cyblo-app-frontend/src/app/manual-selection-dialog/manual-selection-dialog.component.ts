import { Component } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-manual-selection-dialog',
  templateUrl: './manual-selection-dialog.component.html',
  styleUrls: ['./manual-selection-dialog.component.css']
})
export class ManualSelectionDialogComponent {

  path: string = '';
  model_attack: string = '';

  constructor(public dialogRef: MatDialogRef<ManualSelectionDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onRun(): void {
    if(this.path && this.model_attack)
      this.dialogRef.close({ path: this.path, model_attack: this.model_attack });
  }
}
