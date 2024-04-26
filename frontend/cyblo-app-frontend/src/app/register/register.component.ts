import { Component } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators} from "@angular/forms";
import {ErrorStateMatcher} from "@angular/material/core";
import {AuthenticationService} from "../services/authentication.service";
import {UserRegister} from "../models/UserRegister";
import {AlertService} from "../services/alert.service";
import {Router} from "@angular/router";

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

function usernameValidator(control: FormControl): Promise<{ [key: string]: any } | null> {
  return new Promise((resolve) => {
    if (!/^[a-zA-Z][a-zA-Z0-9]{7,}$/.test(control.value)) {
      resolve({ invalidUsername: true });
    } else {
      resolve(null);
    }
  });
}

function passwordValidator(control: FormControl): Promise<{ [key: string]: any } | null> {
  return new Promise((resolve) => {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(control.value)) {
      resolve({ invalidPassword: true });
    } else {
      resolve(null);
    }
  });
}


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registrationForm: FormGroup;

  hidePassword: boolean = true;
  passwordCriteria: string = "At least 8 characters long, combination of uppercase letters, lowercase letters, numbers, and symbols";
  hideConfirmPassword: boolean = true;

  constructor(private formBuilder: FormBuilder, private apiSrv: AuthenticationService, private alertService: AlertService, private router: Router) {
    this.registrationForm = this.formBuilder.group({
      username: ['', Validators.required, usernameValidator],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required, passwordValidator],
      confirmPassword: ['', Validators.required]
    }, { validators: this.checkPasswordsMatch('password', 'confirmPassword') });
  }

  get username() { return this.registrationForm.get('username'); }
  get email() { return this.registrationForm.get('email'); }
  get password() { return this.registrationForm.get('password'); }
  get confirmPassword() { return this.registrationForm.get('confirmPassword'); }

  checkPasswordsMatch(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup): {[key: string]: any} | null => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];
      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true }; // Return the error object
      } else {
        return null;
      }
    };
  }


  onSubmit() {
    if (this.registrationForm.valid) {
      const { username, email, password } = this.registrationForm.value;
      const userRegisterData: UserRegister = { username, email, password };
      this.apiSrv.register(userRegisterData).subscribe(
        (response) => {
          console.log("Registration successful:", response);
          // Handle success, for example, redirect to login page
          this.router.navigate(['/login']);
        },
        (error) => {
          if (error.error?.username[0] == "A user with that username already exists."){
            this.alertService.showError('Username already exists!');
          }
          if (error.error?.email[0] == "Enter a valid email address.")
            console.log("Enter a valid email address.");
        }
      );
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
