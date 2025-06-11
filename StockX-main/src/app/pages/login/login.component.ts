import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';  // <-- authState é o correto aqui

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private auth: Auth
  ) {
    // Se já estiver logado, redireciona
    authState(this.auth).subscribe(u => {
      if (u) {
        this.router.navigate(['/']);
      }
    });
  }

  login() {
    this.authService.login(this.email, this.password)
      .then(() => {
        const sub = authState(this.auth).subscribe(user => {
          if (user) {
            sub.unsubscribe(); // Garante que só redireciona uma vez
            this.router.navigate(['/']);
          }
        });
      })
      .catch((err) => {
        console.error('Erro ao fazer login:', err);
        if (err.code === 'auth/user-not-found') {
          this.error = 'Usuário não encontrado.';
        } else if (err.code === 'auth/wrong-password') {
          this.error = 'Senha incorreta.';
        } else {
          this.error = 'Erro ao fazer login.';
        }
      });
  }
}
