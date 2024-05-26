import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient, HttpResponse} from "@angular/common/http";
import {UserRegister} from "../models/UserRegister";
import {Observable} from "rxjs";
import {UserLogin} from "../models/UserLogin";
import {AddProject} from "../models/AddProject";
import {AddFile} from "../models/AddFile";
import {AddConnection} from "../models/AddConnection";
import {Project} from "../models/Project";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private backendUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.backendUrl}/projects`, { withCredentials: true });
  }

  addProject(project: AddProject): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/projects/add`, project, { withCredentials: true });
  }

  editProject(project: Project): Observable<any> {
    return this.http.put<any>(`${this.backendUrl}/projects/edit`, project, { withCredentials: true });
  }

  deleteProject(project_id: string): Observable<HttpResponse<any>> {
    return this.http.delete<HttpResponse<any>>(
      `${this.backendUrl}/projects/delete/${project_id}`,
      { withCredentials: true, observe: 'response' }
    );
  }

  getFilesByProjectId(id: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/projects/${id}`, { withCredentials: true });
  }

  getAllFilesForAUser(): Observable<any> {
    return this.http.get(`${this.backendUrl}/files`, { withCredentials: true });
  }

  refreshChartSQLForASpecificFile(id: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/files/checksql/${id}`, { withCredentials: true });
  }

  addFile(file:AddFile): Observable<any>{
    return this.http.post<any>(`${this.backendUrl}/files/add`, file, { withCredentials: true });
  }

  getLogsForAFile(id: string | undefined): Observable<any> {
    return this.http.get(`${this.backendUrl}/files/${id}`, { withCredentials: true });
  }

  addExternalConnection(connection: AddConnection): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/connections/add`, connection, { withCredentials: true });
  }

  getConnectionsForAProject(project_id: string | undefined): Observable<any>{
    return this.http.get<any>(`${this.backendUrl}/connections/projects/${project_id}`, { withCredentials: true });
  }
}
