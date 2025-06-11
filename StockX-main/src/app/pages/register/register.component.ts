import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  nomeEmpresa = '';  // novo campo
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private firestore: Firestore // <--- importe o Firestore aqui
  ) {}

  register(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.error = 'Por favor, preencha todos os campos corretamente.';
      return;
    }

    const email = form.value.email.trim();
    const password = form.value.password.trim();
    const nomeEmpresa = this.nomeEmpresa.trim();

    if (!nomeEmpresa) {
      this.error = 'Por favor, informe o nome da empresa.';
      return;
    }

    this.error = '';

    this.authService.register(email, password)
      .then((cred) => {
        // Salvar nomeEmpresa no Firestore
        return setDoc(doc(this.firestore, 'usuarios', cred.user.uid), {
          email,
          nomeEmpresa,
          criadoEm: new Date()
        });
      })
      .then(() => {
        this.ngZone.run(() => {
          alert('Conta criada com sucesso!');
          this.router.navigate(['/login']);
        });
      })
      .catch((err) => {
        this.ngZone.run(() => {
          if (err.code === 'auth/email-already-in-use') {
            this.error = 'Este email já está cadastrado.';
          } else if (err.code === 'auth/invalid-email') {
            this.error = 'Email inválido.';
          } else if (err.code === 'auth/weak-password') {
            this.error = 'A senha deve ter pelo menos 6 caracteres.';
          } else {
            this.error = 'Erro ao criar conta. Tente novamente.';
          }
          this.cd.detectChanges();
        });
      });
  }
}
