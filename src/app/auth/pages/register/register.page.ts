import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private firestore: Firestore
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async onRegister() {
    if (this.registerForm.valid) {
      const { name, email, password } = this.registerForm.value;
      try {
        // 🔥 Registrar el usuario en Firebase Authentication
        const userCredential = await this.authService.register(email, password);

        // 📦 Guardar en Firestore (Colección "usuarios")
        const usuariosRef = collection(this.firestore, 'usuarios');
        await addDoc(usuariosRef, {
          uid: userCredential.user.uid,
          nombre: name,
          email: email
        });

        console.log("🔥 Usuario registrado y guardado en Firebase");
        this.router.navigate(['/tabs/tasks']);
      } catch (error: any) {
        console.error("❌ Error al registrar: ", error.message);
      }
    }
  }
}
