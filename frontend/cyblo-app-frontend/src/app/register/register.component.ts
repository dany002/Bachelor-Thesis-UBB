import { Component } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators} from "@angular/forms";
import {ErrorStateMatcher} from "@angular/material/core";

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registrationForm: FormGroup;

  matcher = new MyErrorStateMatcher();

  constructor(private formBuilder: FormBuilder) {
    this.registrationForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: this.checkEmailsMatch('email', 'confirmEmail') && this.checkPasswordsMatch('password', 'confirmPassword') });
  }

  get username() { return this.registrationForm.get('username'); }
  get email() { return this.registrationForm.get('email'); }
  get confirmEmail() { return this.registrationForm.get('confirmEmail'); }
  get password() { return this.registrationForm.get('password'); }
  get confirmPassword() { return this.registrationForm.get('confirmPassword'); }

  checkEmailsMatch(emailKey: string, confirmEmailKey: string) {
    return (group: FormGroup): {[key: string]: any} | null => {
      const email = group.controls[emailKey];
      const confirmEmail = group.controls[confirmEmailKey];
      if (email.value !== confirmEmail.value) {
        confirmEmail.setErrors({ emailMismatch: true });
        return { emailMismatch: true }; // Return the error object
      } else {
        return null; // Return null if validation passes
      }
    };
  }

  checkPasswordsMatch(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup): {[key: string]: any} | null => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];
      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true }; // Return the error object
      } else {
        return null; // Return null if validation passes
      }
    };
  }


  onSubmit() {
    if (this.registrationForm.valid) {
      // Submit your registration data
    }
  }
}
