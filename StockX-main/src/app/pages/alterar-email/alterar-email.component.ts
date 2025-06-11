import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, sendEmailVerification, User } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-alterar-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './alterar-email.component.html',
  styleUrl: './alterar-email.component.css'
})
export class AlterarEmailComponent {
  form: FormGroup;
  user: User | null = null;

   mensagemFlutuante: string = '';
  mostrarMensagem = false;
  tipoMensagem: 'normal' | 'alerta' = 'normal';

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router,) {
    this.form = this.fb.group({
      novoEmail: ['', [Validators.required, Validators.email]],
      senhaAtual: ['', [Validators.required]]
    });

    this.user = this.auth.currentUser;
  }

  async alterarEmail() {
  if (this.form.invalid) {
    this.form.markAllAsTouched(); // exibe os erros no template
    return;
  }

  const novoEmail = this.form.get('novoEmail')?.value;
  const senhaAtual = this.form.get('senhaAtual')?.value;

  if (!this.user || !novoEmail || !senhaAtual) {
    this.exibirMensagem("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const cred = EmailAuthProvider.credential(this.user.email!, senhaAtual);
    await reauthenticateWithCredential(this.user, cred);
    await updateEmail(this.user, novoEmail);
    await sendEmailVerification(this.user);
    this.exibirMensagem("E-mail alterado com sucesso! Verifique sua caixa de entrada.");
    this.router.navigate(['/']);
  } catch (err: any) {
  console.error("Erro ao alterar e-mail:", err);

  if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
    this.exibirMensagem("Senha atual inválida.", 'alerta');
  } else if (err.code === 'auth/too-many-requests') {
    this.exibirMensagem("Muitas tentativas. Tente novamente mais tarde.", 'alerta');
  } else {
    this.exibirMensagem("Erro: " + (err.message || err.code), 'alerta');
  }
}
}

  exibirMensagem(texto: string, tipo: 'normal' | 'alerta' = 'normal', duracaoMs: number = 2500) {
    console.log("Exibindo mensagem:", texto);
    this.mensagemFlutuante = texto;
    this.tipoMensagem = tipo;
    this.mostrarMensagem = true;

    setTimeout(() => {
      this.mostrarMensagem = false;
    }, duracaoMs);
  }
}
