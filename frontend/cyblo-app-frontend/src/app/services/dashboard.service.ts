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

  // SQLi Live
  fetchRecordsForBiLSTMSQL(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_bilstm_sql`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  fetchRecordsForRandomForestSQL(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_random_forests_sql`, {
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

  // XSS Live

  fetchRecordsForBiLSTMXSS(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_bilstm_xss`, {
      table: table,
      current_timestamp: currentTimestamp,
      connection_id: connection_id,
      offset: offset
    }, {withCredentials: true});
  }

  fetchRecordsForRandomForestXSS(table: string, currentTimestamp: string, connection_id: string, offset: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/get_records_with_random_forests_xss`, {
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

  // Check File SQLi

  checkFileSQLBiLSTM(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_sql_bilstm/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileSQLRandomForest(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_sql_random_forests/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileSQLRegex(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_sql_regex/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }


  // CHECK File XSS

  checkFileXSSBiLSTM(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_xss_bilstm/${file_id}`, {
      page: page,
      timestamp: currentTimestamp
    }, {withCredentials: true});
  }

  checkFileXSSRandomForest(file_id: string, currentTimestamp: string, page: number): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/check_file_xss_random_forests/${file_id}`, {
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

  // MANUAL SELECTION

  runManualSelection(path: string, model_attack: string): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/run_manual_selection`, {
      path: path,
      model_attack: model_attack
    }, {withCredentials: true});
  }
}
