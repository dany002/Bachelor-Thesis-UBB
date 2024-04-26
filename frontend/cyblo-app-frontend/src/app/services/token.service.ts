import { Injectable } from '@angular/core';
import {AuthenticationService} from "./authentication.service";
import {Router} from "@angular/router";
import {AlertService} from "./alert.service";
import {catchError, map, Observable, of, tap, throwError} from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(private authService: AuthenticationService, private router: Router, private alertService: AlertService) { }


  checkTokenExpiration(): Observable<any> {
    return this.authService.checkTokenExpiration().pipe(
      tap(response => {
        console.log(response);
        return response;
      }),
      catchError(error => {
        console.error(error);
        this.alertService.showError("Session expired, you have to login!");
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(error);
      })
    );
  }

  refreshToken(): Observable<boolean> {
    return this.authService.refreshToken().pipe(
      map((response) => {
        console.log("Token refreshed successfully:", response);
        return true; // Indicate success
      }),
      catchError((error) => {
        console.error("Token refresh failed:", error);
        this.alertService.showError("Session expired, you have to login!");
        this.authService.logout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }



}
