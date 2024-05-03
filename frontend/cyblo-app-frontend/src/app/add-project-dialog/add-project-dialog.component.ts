import { Component } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {Project} from "../models/Project";
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

  constructor(public dialogRef: MatDialogRef<AddProjectDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {

    const nameRegex = /^[a-zA-Z\s]+$/;
    const descriptionRegex = /^[a-zA-Z0-9'".,\s]+$/;

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

    const projectToBeAdded: AddProject = { name: this.name, description: this.description };

    this.dashboardService.addProject(projectToBeAdded).subscribe(
      (response) => {
        console.log('Project added successfully:', response);
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error adding project:', error);
        this.dialogRef.close(false);
      }
    );
  }
}

