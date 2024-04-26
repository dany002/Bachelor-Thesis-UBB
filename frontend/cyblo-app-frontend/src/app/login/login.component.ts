import { Component } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthenticationService} from "../services/authentication.service";
import {AlertService} from "../services/alert.service";
import {UserLogin} from "../models/UserLogin";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword: boolean = true;

  constructor(private formBuilder: FormBuilder, private apiSrv: AuthenticationService, private alertService: AlertService, private router: Router) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }



  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      const userLoginData: UserLogin = { username, password };
      this.apiSrv.login(userLoginData).subscribe(
        (response) => {
          console.log("Login successful:", response);
          this.router.navigate(['/dashboard'])
        },
        (error) => {
          console.log("Login failed:", error.error);
          if (error.error.error == "Username or email and password are required"){
            this.alertService.showError('Username or email and password are required');
          } else if (error.error.error == "Invalid credentials"){
            this.alertService.showError('Invalid credentials!');
          }
          this.alertService.showError("Please try again!")
          console.log("Registration failed. Please try again.");
        }
      );
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

}
