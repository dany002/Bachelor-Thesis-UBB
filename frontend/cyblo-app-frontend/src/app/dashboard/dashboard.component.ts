import {Component, OnInit} from '@angular/core';
import {DashboardService} from "../services/dashboard.service";
import {Project} from "../models/Project"
import {MatDialog} from "@angular/material/dialog";
import {AddProjectDialogComponent} from "../add-project-dialog/add-project-dialog.component";
import {File} from "../models/File";
import {AddFileDialogComponent} from "../add-file-dialog/add-file-dialog.component";
import {AlertService} from "../services/alert.service";
import {AddConnectionDialogComponent} from "../add-connection-dialog/add-connection-dialog.component";
import {Connection} from "../models/Connection";
import {ManageEntitiesDialogComponent} from "../manage-entities-dialog/manage-entities-dialog.component";
import {error} from "@angular/compiler-cli/src/transformers/util";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{
  projects: Project[] | undefined;
  selectedProject: Project | undefined;
  selectedFileIdSQL: string | undefined;
  connections: Connection[] | undefined;
  selectedConnection: Connection | undefined;
  selectedOption: string | undefined;
  selectedTable: string | undefined;
  selectedConnectionId: string | undefined;
  tables: String[] | undefined;

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

  getConnectionsForAProject() {
    if(this.selectedProject != undefined){
      this.dashboardService.getConnectionsForAProject(this.selectedProject.id).subscribe(
        (response) => {
          if (response && response.length > 0) {
            console.log('Connections:', response);
            this.connections = response;
          } else {
            console.log('No connections found');
            this.connections = [];
            this.selectedConnection = undefined;
          }
        },
        (error) => {
          console.error('Error:', error);
        }
      );
    }
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
      this.selectedTable = '';
      this.selectedOption = '';
      this.getConnectionsForAProject();
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


  openAddConnectionDialog() {
    if(this.selectedProject != undefined){
      const dialogRef = this.dialog.open(AddConnectionDialogComponent, {
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

  onConnectionSelectionChange() {
    if(this.selectedConnection != undefined){
      this.selectedConnectionId = this.selectedConnection.id;
      this.dashboardService.getTablesForASpecificConnection(this.selectedConnection.id).subscribe(
        (response) => {
          console.log(response);
          this.tables = response.tables;
        }, (error) => {
          console.error('Error:', error);
        }
      );
    }
  }

  onOptionSelectionChange() {

  }

  openManageDialog(entityType: string) {
    const dialogRef = this.dialog.open(ManageEntitiesDialogComponent, {
      width: '800px',
      data: { entityType }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh data based on the managed entity type
        if (entityType === 'projects') {
          this.getProjects();
        } else if (entityType === 'files') {
          // Logic to refresh files
        } else if (entityType === 'connections') {
          this.getConnectionsForAProject();
        }
      }
    });
  }

  onTableSelectionChange() {

  }
}
