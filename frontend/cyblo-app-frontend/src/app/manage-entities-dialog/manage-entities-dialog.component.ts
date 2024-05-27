import {Component, Inject, OnInit} from '@angular/core';
import {DashboardService} from "../services/dashboard.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {AddProjectDialogComponent} from "../add-project-dialog/add-project-dialog.component";
import {AddFileDialogComponent} from "../add-file-dialog/add-file-dialog.component";
import {EditProjectDialogComponent} from "../edit-project-dialog/edit-project-dialog.component";
import {DeleteEntityDialogComponent} from "../delete-entity-dialog/delete-entity-dialog.component";
import {Project} from "../models/Project";
import {EditFileDialogComponent} from "../edit-file-dialog/edit-file-dialog.component";
import {AddConnectionDialogComponent} from "../add-connection-dialog/add-connection-dialog.component";
import {EditConnectionDialogComponent} from "../edit-connection-dialog/edit-connection-dialog.component";

@Component({
  selector: 'app-manage-entities-dialog',
  templateUrl: './manage-entities-dialog.component.html',
  styleUrls: ['./manage-entities-dialog.component.css']
})
export class ManageEntitiesDialogComponent implements OnInit{
  entityType: string;
  entities: any[];

  constructor(
    public dialogRef: MatDialogRef<ManageEntitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dashboardService: DashboardService,
    private dialog: MatDialog
  ) {
    this.entityType = data.entityType;
    this.entities = [];
  }

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    if (this.entityType === 'projects') {
      this.dashboardService.getProjects().subscribe(
        (response) => {
          this.entities = response.projects;
        },
        (error) => {
          console.error('Error fetching projects:', error);
        }
      );
    } else if (this.entityType === 'files') {
        this.dashboardService.getAllFilesForAUser().subscribe(
          (response) => {
            console.log(response);
            this.entities = response;
          },
          (error) => {
            console.error('Error fetching files:', error);
          }
        );
    } else if (this.entityType === 'connections') {
        this.dashboardService.getAllConnectionsForAUser().subscribe(
          (response) => {
            this.entities = response;
            console.log(response);
          },
          (error) => {
            console.error('Error fetching connections:', error);
          }
        );
    }
  }

  addEntity(): void {
    if (this.entityType === 'projects') {
      const dialogRef = this.dialog.open(AddProjectDialogComponent, {
        width: '600px'
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadEntities();
        }
      });
    }
    else if (this.entityType === 'files') {
      this.dashboardService.getProjects().subscribe(
        (response) => {
          const dialogRef = this.dialog.open(AddFileDialogComponent, {
            width: '600px',
            data:{
              projects: response.projects
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result) {
              this.loadEntities();
            }
          });
        },
        (error) => {
          console.error('Error fetching projects:', error);
        }
      );
    }
    else if (this.entityType === 'connections') {
      this.dashboardService.getProjects().subscribe(
        (response) => {
          const dialogRef = this.dialog.open(AddConnectionDialogComponent, {
            width: '600px',
            data:{
              projects: response.projects
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result) {
              this.loadEntities();
            }
          });
        },
        (error) => {
          console.error('Error fetching projects:', error);
        }
      );
    }

  }

  updateEntity(entity: any): void {
    if (this.entityType === 'projects') {
      const dialogRef = this.dialog.open(EditProjectDialogComponent, {
        width: '600px',
        data: {
          projectId: entity.id,
          name: entity.name,
          description: entity.description
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadEntities();
        }
      });
    }
    else if (this.entityType === 'files') {
      this.dashboardService.getProjects().subscribe(
        (response) => {
          const dialogRef = this.dialog.open(EditFileDialogComponent, {
            width: '600px',
            data:{
              projects: response.projects,
              project: entity.project,
              path: entity.path,
              service_account_key: entity.service_account_key,
              type: entity.type,
              fileId: entity.id
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result) {
              this.loadEntities();
            }
          });
        },
        (error) => {
          console.error('Error fetching projects:', error);
        }
      );
    }
    else if (this.entityType === 'connections') {
      this.dashboardService.getProjects().subscribe(
        (response) => {
          const dialogRef = this.dialog.open(EditConnectionDialogComponent, {
            width: '600px',
            data:{
              projects: response.projects,
              project: entity.project,
              name: entity.name,
              host: entity.host,
              port: entity.port,
              username: entity.username,
              password: entity.password,
              database: entity.database,
              connectionId: entity.id
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result) {
              this.loadEntities();
            }
          });
        },
        (error) => {
          console.error('Error fetching projects:', error);
        }
      );
    }
  }

  deleteEntity(entity: any): void {
    const dialogRef = this.dialog.open(DeleteEntityDialogComponent, {
      width: '600px',
      height: '150px',
      data: {
        entityId: entity.id,
        entityType: this.entityType
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Perform any action after successful deletion
        console.log('Entity deleted successfully!');
        this.loadEntities();
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close(true);
  }
}
