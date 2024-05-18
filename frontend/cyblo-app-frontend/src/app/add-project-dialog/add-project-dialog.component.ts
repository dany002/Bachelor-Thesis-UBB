import { Component } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {AddProject} from "../models/AddProject";
import {AlertService} from "../services/alert.service";

@Component({
  selector: 'app-add-project-dialog',
  templateUrl: './add-project-dialog.component.html',
  styleUrls: ['./add-project-dialog.component.css']
})
export class AddProjectDialogComponent {
  name: string = '';
  description: string = '';
  path: string = '';
  service_account_key: string = '';
  type: string = '';
  fileTypes: string[] = ['SQL', 'DDOS', 'XSS', 'Anomaly', 'None'];

  constructor(public dialogRef: MatDialogRef<AddProjectDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {

    const nameRegex = /^[a-zA-Z\s]+$/;
    const descriptionRegex = /^[a-zA-Z0-9'".,\s]+$/;
    const pathRegex = /^gs:\/\/.*/;

    if (!nameRegex.test(this.name)) {
      console.error('Invalid project name');
      this.alertService.showError('Invalid project name');
      return;
    }

    if (!descriptionRegex.test(this.description)) {
      console.error('Invalid project description');
      this.alertService.showError('Invalid project description');
      return;
    }

    if (!pathRegex.test(this.path)) {
      console.error('Invalid path');
      this.alertService.showError('Invalid path. It should start with "gs://".');
      return;
    }

    const projectToBeAdded: AddProject = { name: this.name, description: this.description, path: this.path, service_account_key: this.service_account_key, type: this.type };

    this.dashboardService.addProject(projectToBeAdded).subscribe(
      (response) => {
        console.log('Project and file added successfully:', response);
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error adding project:', error);
        this.dialogRef.close(false);
      }
    );
  }
}

