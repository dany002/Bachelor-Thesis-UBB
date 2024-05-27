import {Component, Inject} from '@angular/core';
import {Project} from "../models/Project";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {AlertService} from "../services/alert.service";
import {File} from "../models/File";
import {Connection} from "../models/Connection";

@Component({
  selector: 'app-edit-connection-dialog',
  templateUrl: './edit-connection-dialog.component.html',
  styleUrls: ['./edit-connection-dialog.component.css']
})
export class EditConnectionDialogComponent {
  name: string = '';
  host: string = '';
  port: string = '';
  username: string = '';
  password: string = '';
  database: string = '';
  project: Project;
  connectionId: string = '';
  projects: Project[];

  constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EditConnectionDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {
    this.connectionId = this.data.connectionId;
    this.name = this.data.name;
    this.host = this.data.host;
    this.port = this.data.port;
    this.project = this.data.project;
    this.projects = this.data.projects;
    this.username = this.data.username;
    this.password = this.data.password;
    this.database = this.data.database;
    console.log(this.project);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEdit(): void {

    const connectionToBeEdited: Connection = { id: this.connectionId, name: this.name, host: this.host, port: this.port, username: this.username, password: this.password, database: this.database, project_id: this.project.id};

    this.dashboardService.editConnection(connectionToBeEdited).subscribe(
      (response) => {
        console.log('File edited successfully:', response);
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error editing file:', error);
        this.dialogRef.close(false);
      }
    );
  }
}
