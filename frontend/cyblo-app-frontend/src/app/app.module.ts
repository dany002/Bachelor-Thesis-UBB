import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RegisterComponent } from './register/register.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatIconModule} from "@angular/material/icon";
import {HttpClientModule} from "@angular/common/http";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {MatCardModule} from "@angular/material/card";
import { AddProjectDialogComponent } from './add-project-dialog/add-project-dialog.component';
import {MatDialogModule} from "@angular/material/dialog";
import {MatSelectModule} from "@angular/material/select";
import { NgChartsModule } from 'ng2-charts';
import { SqlInjectionChartComponent } from './sql-injection-chart/sql-injection-chart.component';
import { AddFileDialogComponent } from './add-file-dialog/add-file-dialog.component';
import { AddConnectionDialogComponent } from './add-connection-dialog/add-connection-dialog.component';
import { ManageEntitiesDialogComponent } from './manage-entities-dialog/manage-entities-dialog.component';
import { EditProjectDialogComponent } from './edit-project-dialog/edit-project-dialog.component';
import { DeleteEntityDialogComponent } from './delete-entity-dialog/delete-entity-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    DashboardComponent,
    AddProjectDialogComponent,
    SqlInjectionChartComponent,
    AddFileDialogComponent,
    AddConnectionDialogComponent,
    ManageEntitiesDialogComponent,
    EditProjectDialogComponent,
    DeleteEntityDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatIconModule,
    HttpClientModule,
    MatSnackBarModule,
    MatCardModule,
    MatDialogModule,
    MatSelectModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
