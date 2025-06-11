import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { sendPasswordResetEmail } from 'firebase/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  email = '';
  mensagem = '';
  erro = '';

  constructor(private auth: Auth) {}

  reset() {
    this.mensagem = '';
    this.erro = '';

    sendPasswordResetEmail(this.auth, this.email)
      .then(() => {
        this.mensagem = 'Email de recuperação enviado!';
        this.email = '';
      })
      .catch(err => {
        this.erro = 'Erro ao enviar email. Verifique o endereço informado.';
        console.error(err);
      });
  }
}
