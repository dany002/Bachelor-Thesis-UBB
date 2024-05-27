import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {AlertService} from "../services/alert.service";
import {Project} from "../models/Project";
import {File} from "../models/File";

@Component({
  selector: 'app-edit-file-dialog',
  templateUrl: './edit-file-dialog.component.html',
  styleUrls: ['./edit-file-dialog.component.css']
})
export class EditFileDialogComponent {
  path: string = '';
  service_account_key: string = '';
  type: string = '';
  project: Project;
  fileId: string = '';
  projects: Project[];
  selectedProjectId: string = '';
  fileTypes: string[] = ['SQL', 'DDOS', 'XSS', 'Anomaly', 'None'];

  constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EditFileDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {
    this.fileId = this.data.fileId;
    this.path = this.data.path;
    this.service_account_key = this.data.service_account_key;
    this.type = this.data.type;
    this.project = this.data.project;
    this.projects = this.data.projects;
    console.log(this.project);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEdit(): void {

    const fileToBeEdited: File = { id: this.fileId, path: this.path, service_account_key: this.service_account_key, type: this.type, project_id: this.selectedProjectId, last_check_time: '', last_checked_size: -1, last_read_position: -1 };

    this.dashboardService.editFile(fileToBeEdited).subscribe(
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
