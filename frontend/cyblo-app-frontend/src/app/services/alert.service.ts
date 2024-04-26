import { Injectable } from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private snackBar: MatSnackBar) { }

  showError(message: string): void {
    const config: MatSnackBarConfig = {
      duration: 5000,
      panelClass: ['error-snackbar'],
      verticalPosition: 'top'
    };
    this.snackBar.open(message, 'Close', config);
  }

}
