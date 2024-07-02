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
import {ManualSelectionDialogComponent} from "../manual-selection-dialog/manual-selection-dialog.component";

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
  selectedTableXSS: string | undefined;
  selectedMode: string = 'Real-Time';
  files: File[] | undefined;
  selectedFile: File | undefined;
  displayedColumns: string[] = ['metric', 'lstm', 'regex', 'random_forests'];
  confusionMatrixColumns: string[] = ['label', 'predicted_0', 'predicted_1'];
  responseData: any;
  loading: boolean = true;
  pathManual: string | undefined;
  numberOfRecords: string | undefined;
  fileSize: string | undefined;

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
    // if (this.selectedOption === 'AI' || this.selectedOption === 'Regex') {
    //   this.selectedTable = '';
    //   this.selectedConnectionId = '';
    //   this.offset = 0;
    // }
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

  onTableXSSSelectionChange() {

  }

  formatNumber(num: number, decimals: number = 3): string {
    return num.toFixed(decimals);
  }

  formatPercentage(value: number): string {
    return (value * 100).toFixed(2) + '%'; // Formats the number as percentage with two decimal places
  }

  processResponseData(response: any) {
    this.responseData = {
      metricData: [
        { metric: 'Total LSTM predicted as 1', lstm: response.total_bilstm_predicted_1, regex: response.total_regex_predicted_1, random_forests: response.total_random_forest_predicted_1},
        { metric: 'Total LSTM predicted as 0', lstm: response.total_bilstm_predicted_0, regex: response.total_regex_predicted_0, random_forests: response.total_random_forest_predicted_1},
        { metric: 'Accuracy', lstm: this.formatPercentage(response.bilstm_accuracy), regex: this.formatPercentage(response.regex_accuracy), random_forests: this.formatPercentage(response.random_forest_accuracy) },
        { metric: 'F1 Score', lstm: this.formatPercentage(response.bilstm_f1_score), regex: this.formatPercentage(response.regex_f1_score), random_forests: this.formatPercentage(response.random_forest_f1_score) },
        { metric: 'Recall', lstm: this.formatPercentage(response.bilstm_recall), regex: this.formatPercentage(response.regex_recall), random_forests: this.formatPercentage(response.random_forest_recall) },
        { metric: 'Precision', lstm: this.formatPercentage(response.bilstm_precision), regex: this.formatPercentage(response.regex_precision), random_forests: this.formatPercentage(response.random_forest_precision) },
        { metric: 'Time', lstm: `${this.formatNumber(response.bilstm_time)} seconds`, regex: `${this.formatNumber(response.regex_time)} seconds`, random_forests: `${this.formatNumber(response.random_forest_time)} seconds` }
      ],
      bilstm_confusion_matrix: [
        { label: 'Actual 0', predicted_0: response.bilstm_confusion_matrix[0][0], predicted_1: response.bilstm_confusion_matrix[0][1] },
        { label: 'Actual 1', predicted_0: response.bilstm_confusion_matrix[1][0], predicted_1: response.bilstm_confusion_matrix[1][1] }
      ],
      random_forest_confusion_matrix: [
        { label: 'Actual 0', predicted_0: response.random_forest_confusion_matrix[0][0], predicted_1: response.random_forest_confusion_matrix[0][1] },
        { label: 'Actual 1', predicted_0: response.random_forest_confusion_matrix[1][0], predicted_1: response.random_forest_confusion_matrix[1][1] }
      ],
      regex_confusion_matrix: [
        { label: 'Actual 0', predicted_0: response.regex_confusion_matrix[0][0], predicted_1: response.regex_confusion_matrix[0][1] },
        { label: 'Actual 1', predicted_0: response.regex_confusion_matrix[1][0], predicted_1: response.regex_confusion_matrix[1][1] }
      ]
    };
    this.numberOfRecords = response.total_bilstm_predicted_0 + response.total_bilstm_predicted_1;
    this.fileSize = this.formatNumber(response.file_size / (1024*1024))
    this.loading = false;
  }


  onModeSelectionChange() {
    if(this.selectedMode === 'Audit' && this.selectedProject){
      this.dashboardService.getFilesByProjectId(this.selectedProject.id).subscribe(
        (response) => {
          console.log(response);
          this.files = response;
          // this.tables = response.tables;
        }, (error) => {
          console.error('Error:', error);
        }
      );
    }
    if(this.selectedMode === 'Manual Selection'){
      const dialogRef = this.dialog.open(ManualSelectionDialogComponent, {
        width: '600px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const path = result.path
          const model_attack = result.model_attack;
          this.pathManual = result.path.split('/').pop(); // get the file name not the whole path
          this.dashboardService.runManualSelection(path, model_attack).subscribe(
            (response) => {
              console.log(response);
              this.processResponseData(response);
            }, (error) => {
              console.error('Error:', error);
            }
          )
        }
      });
    }
  }

  onFileSelectionChange() {
    console.log("FILEEE", this.selectedFile);
  }
}
