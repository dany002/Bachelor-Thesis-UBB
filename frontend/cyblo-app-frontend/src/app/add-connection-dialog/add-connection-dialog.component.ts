import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Project} from "../models/Project";
import {DashboardService} from "../services/dashboard.service";
import {AlertService} from "../services/alert.service";
import {AddFile} from "../models/AddFile";
import {AddConnection} from "../models/AddConnection";

@Component({
  selector: 'app-add-connection-dialog',
  templateUrl: './add-connection-dialog.component.html',
  styleUrls: ['./add-connection-dialog.component.css']
})
export class AddConnectionDialogComponent{
  name: string = '';
  host: string = '';
  port: string = '';
  username: string = '';
  password: string = '';
  database: string = '';


  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { projectId: string },
    public dialogRef: MatDialogRef<AddConnectionDialogComponent>,
    private dashboardService: DashboardService,
    private alertService: AlertService
  ) {}

  onAdd(): void {

    const connectionToBeAdded: AddConnection = { name: this.name, host: this.host, port: this.port, username: this.username, password: this.password, database: this.database, project_id: this.data.projectId };

    this.dashboardService.addExternalConnection(connectionToBeAdded).subscribe(
      (response) => {
        console.log('Connection added successfully:', response);
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error adding connection:', error);
        this.dialogRef.close(false);
      }
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
