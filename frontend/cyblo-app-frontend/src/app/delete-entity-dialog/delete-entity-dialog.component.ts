import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DashboardService} from "../services/dashboard.service";
import {HttpResponse} from "@angular/common/http";

@Component({
  selector: 'app-delete-entity-dialog',
  templateUrl: './delete-entity-dialog.component.html',
  styleUrls: ['./delete-entity-dialog.component.css']
})
export class DeleteEntityDialogComponent {
  fullName: string = '';
  entityType: string;
  entityId: string;

  constructor(
    public dialogRef: MatDialogRef<DeleteEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dashboardService: DashboardService
  ) {
    this.entityType = data.entityType;
    this.entityId = data.entityId;
  }

  deleteEntity(): void {
    if (this.fullName === 'delete me') {
      if (this.entityType === 'projects'){
        this.dashboardService.deleteProject(this.data.entityId).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 204) {
              console.log('Entity deleted successfully:', this.data.entityId);
              this.dialogRef.close(true);
            } else {
              console.log('Failed to delete entity:', this.data.entityId);
            }
          },
          (error) => {
            console.error('Error deleting entity:', error);
          }
        );
      }
      else if (this.entityType === 'files'){
        this.dashboardService.deleteFile(this.data.entityId).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 204) {
              console.log('File deleted successfully:', this.data.entityId);
              this.dialogRef.close(true);
            } else {
              console.log('Failed to delete file:', this.data.entityId);
            }
          },
          (error) => {
            console.error('Error deleting file:', error);
          }
        );
      }
      else if (this.entityType === 'connections'){
        this.dashboardService.deleteConnection(this.data.entityId).subscribe(
          (response: HttpResponse<any>) => {
            if (response.status === 204) {
              console.log('Connection deleted successfully:', this.data.entityId);
              this.dialogRef.close(true);
            } else {
              console.log('Failed to delete connection:', this.data.entityId);
            }
          },
          (error) => {
            console.error('Error deleting connection:', error);
          }
        );
      }
    } else {
      console.log('Invalid delete me');
    }
  }

}
