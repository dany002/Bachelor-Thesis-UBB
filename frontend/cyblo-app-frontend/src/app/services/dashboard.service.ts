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
import {File} from "../models/File";
import {Connection} from "../models/Connection";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private backendUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // PROJECTS

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

  // FILES

  getFilesByProjectId(id: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/projects/${id}`, { withCredentials: true });
  }

  getAllFilesForAUser(): Observable<any> {
    return this.http.get(`${this.backendUrl}/files`, { withCredentials: true });
  }

  addFile(file:AddFile): Observable<any>{
    return this.http.post<any>(`${this.backendUrl}/files/add`, file, { withCredentials: true });
  }

  editFile(file: File): Observable<any> {
    return this.http.put<any>(`${this.backendUrl}/files/edit`, file, { withCredentials: true });
  }

  deleteFile(file_id: string): Observable<HttpResponse<any>> {
    return this.http.delete<HttpResponse<any>>(
      `${this.backendUrl}/files/delete/${file_id}`,
      { withCredentials: true, observe: 'response' }
    );
  }

  // CONNECTIONS
  getConnectionsForAProject(project_id: string | undefined): Observable<any>{
    return this.http.get<any>(`${this.backendUrl}/connections/projects/${project_id}`, { withCredentials: true });
  }

  getAllConnectionsForAUser(): Observable<any> {
    return this.http.get(`${this.backendUrl}/connections`, { withCredentials: true });
  }

  addExternalConnection(connection: AddConnection): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/connections/add`, connection, { withCredentials: true });
  }

  editConnection(connection: Connection): Observable<any> {
    return this.http.put<any>(`${this.backendUrl}/connections/edit`, connection, { withCredentials: true });
  }

  deleteConnection(connection_id: string): Observable<HttpResponse<any>> {
    return this.http.delete<HttpResponse<any>>(
      `${this.backendUrl}/connections/delete/${connection_id}`,
      { withCredentials: true, observe: 'response' }
    );
  }

  getTablesForASpecificConnection(connection_id: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/connections/${connection_id}/tables`, {withCredentials: true});
  }


  // DETAILS
  refreshChartSQLForASpecificFile(id: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/files/checksql/${id}`, { withCredentials: true });
  }

  getLogsForAFile(id: string | undefined): Observable<any> {
    return this.http.get(`${this.backendUrl}/files/${id}`, { withCredentials: true });
  }

  fetchRecordsForAISQL(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_ai_sql`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  fetchRecordsForRegexSQL(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_regex_sql`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  fetchRecordsForAIXSS(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_ai_xss`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  fetchRecordsForRegexXSS(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_regex_xss`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  checkFileSQLRegex(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_sql_regex/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileSQLAI(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_sql_ai/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileXSSRegex(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_xss_regex/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileXSSAI(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_xss_ai/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }
}
