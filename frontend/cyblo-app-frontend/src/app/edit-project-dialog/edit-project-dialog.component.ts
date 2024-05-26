import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {AlertService} from "../services/alert.service";
import {AddProject} from "../models/AddProject";
import {Project} from "../models/Project";

@Component({
  selector: 'app-edit-project-dialog',
  templateUrl: './edit-project-dialog.component.html',
  styleUrls: ['./edit-project-dialog.component.css']
})
export class EditProjectDialogComponent {
  name: string = '';
  description: string = '';
  projectId: string = '';

  constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<EditProjectDialogComponent>, private dashboardService: DashboardService, private alertService: AlertService) {
    this.projectId = this.data.projectId;
    this.description = this.data.description;
    this.name = this.data.name;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onEdit(): void {

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

    const projectToBeEdited: Project = { id: this.projectId, name: this.name, description: this.description };

    this.dashboardService.editProject(projectToBeEdited).subscribe(
      (response) => {
        console.log('Project edited successfully:', response);
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error editing project:', error);
        this.dialogRef.close(false);
      }
    );
  }
}
