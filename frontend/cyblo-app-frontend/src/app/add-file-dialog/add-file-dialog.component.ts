import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {AlertService} from "../services/alert.service";
import {AddProject} from "../models/AddProject";
import {AddFile} from "../models/AddFile";
import {Project} from "../models/Project";

@Component({
  selector: 'app-add-file-dialog',
  templateUrl: './add-file-dialog.component.html',
  styleUrls: ['./add-file-dialog.component.css']
})
export class AddFileDialogComponent {
  path: string = '';
  service_account_key: string = '';
  type: string = '';
  fileTypes: string[] = ['SQL', 'DDOS', 'XSS', 'Anomaly', 'None'];
  project: Project | undefined;
  projects: Project[];

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<AddFileDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {
    this.projects = this.data.projects;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {

    const pathRegex = /^gs:\/\/.*/;


    if (!pathRegex.test(this.path)) {
      console.error('Invalid path');
      this.alertService.showError('Invalid path. It should start with "gs://".');
      return;
    }

    if (this.project != undefined) {
      const fileToBeAdded: AddFile = {
        path: this.path,
        service_account_key: this.service_account_key,
        type: this.type,
        project_id: this.project.id
      };

      this.dashboardService.addFile(fileToBeAdded).subscribe(
        (response) => {
          console.log('File added successfully:', response);
          this.dialogRef.close(true);
        },
        (error) => {
          console.error('Error adding file:', error);
          this.dialogRef.close(false);
        }
      );
    } else{
      console.log("Select project first");
    }
  }
}
