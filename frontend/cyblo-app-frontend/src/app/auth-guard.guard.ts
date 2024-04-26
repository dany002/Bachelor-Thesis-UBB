import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {CookieService} from "ngx-cookie-service";
import {TokenService} from "./services/token.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuardGuard implements CanActivate {

  constructor(private router: Router, private cookieService: CookieService, private tokenService: TokenService) {}

  canActivate(): boolean {
    this.tokenService.checkTokenExpiration().subscribe(
      expirationDate => {
        const currentTime = Date.now();
        if (expirationDate.getTime() > currentTime) {
          return this.tokenService.refreshToken();
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      },
      error => {
        console.error('Error checking token expiration:', error);
        return false;
      }
    );
    return true;
  }

}
