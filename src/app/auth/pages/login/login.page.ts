import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  onLogin() {
    if (this.loginForm.valid) {
      console.log("🔥 Datos enviados correctamente:", this.loginForm.value);
      // Aquí puedes hacer la autenticación con Firebase o tu backend
      this.router.navigate(['/tabs/tasks']); // Redirige a Tasks si el login es exitoso
    } else {
      console.log("⚠️ Formulario inválido");
    }
  }
}
