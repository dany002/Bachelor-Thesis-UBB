import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {UserRegister} from "../models/UserRegister";
import {catchError, map, Observable, tap, throwError} from "rxjs";
import {UserLogin} from "../models/UserLogin";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private backendUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  register(user: UserRegister): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/register`, user);
  }

  login(user: UserLogin): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/login`, user, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/logout`, null);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.backendUrl}/token/refresh`, { withCredentials: true}).pipe(
      tap(response => {
        console.log("Token refreshed");
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  checkTokenExpiration(): Observable<Date> {
    return this.http.post<any>(`${this.backendUrl}/token/check`, {}, { withCredentials: true}).pipe(
      map(response => new Date(response.expiration_date)),
      catchError(error => {
        return throwError(error);
      })
    );
  }
}
