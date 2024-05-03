import {Component, OnInit} from '@angular/core';
import {DashboardService} from "../services/dashboard.service";
import {Project} from "../models/Project";
import {MatDialog} from "@angular/material/dialog";
import {AddProjectDialogComponent} from "../add-project-dialog/add-project-dialog.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{
  projects: Project[] | undefined;

  ngOnInit() {
    this.getProjects();
  }

  constructor(private dashboardService: DashboardService, private dialog: MatDialog) {

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
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getProjects();
      }
    });
  }

  logout() {

  }
}
