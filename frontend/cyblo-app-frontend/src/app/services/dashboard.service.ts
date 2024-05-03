import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {UserRegister} from "../models/UserRegister";
import {Observable} from "rxjs";
import {UserLogin} from "../models/UserLogin";
import {AddProject} from "../models/AddProject";

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

}
