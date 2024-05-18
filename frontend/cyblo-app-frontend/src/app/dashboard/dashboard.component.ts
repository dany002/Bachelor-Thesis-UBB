import {Component, OnInit} from '@angular/core';
import {DashboardService} from "../services/dashboard.service";
import {Project} from "../models/Project";
import {MatDialog} from "@angular/material/dialog";
import {AddProjectDialogComponent} from "../add-project-dialog/add-project-dialog.component";
import {File} from "../models/File";
import {AddFileDialogComponent} from "../add-file-dialog/add-file-dialog.component";
import {AlertService} from "../services/alert.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{
  projects: Project[] | undefined;
  selectedProject: Project | undefined;
  selectedFileIdSQL: string | undefined;

  ngOnInit() {
    this.getProjects();
  }

  constructor(private dashboardService: DashboardService, private dialog: MatDialog, private alertService: AlertService) {

  }

  getProjects() {
    this.dashboardService.getProjects().subscribe(
      (response) => {
        if (response && response.projects && response.projects.length > 0) {
          console.log('Projects:', response.projects);
          this.projects = response.projects;
        } else {
          console.log('No projects found');
        }
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  openAddProjectDialog(): void {
    const dialogRef = this.dialog.open(AddProjectDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getProjects();
      }
    });
  }

  onProjectSelectionChange(): void {
    if (this.selectedProject) {
      const projectId = this.selectedProject.id;
      this.dashboardService.getFilesByProjectId(projectId).subscribe(
        (response: File[]) => { // Assuming 'File' is the interface for your file model
          console.log('Files for selected project:', response);
          const sqlFile = response.find(file => file.type === 'SQL');
          if (sqlFile) {
            this.selectedFileIdSQL = sqlFile.id;
            console.log('Selected SQL file ID:', this.selectedFileIdSQL);
          } else {
            console.log('No SQL file found for the selected project.');
          }
        },
        (error) => {
          console.error('Error fetching files:', error);
        }
      );
    }
  }



  logout() {

  }

  openAddFileDialog() {
    if(this.selectedProject != undefined){
      const dialogRef = this.dialog.open(AddFileDialogComponent, {
        width: '600px',
        data: { projectId: this.selectedProject.id }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.getProjects();
        }
      });
    }
    else{
      this.alertService.showError('Select First the project.');
    }

  }
}
