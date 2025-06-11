import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Auth, sendPasswordResetEmail, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.css']
})
export class ConfiguracoesComponent implements OnInit {
  form: FormGroup;
  user: User | null = null;

  mensagemFlutuante: string = '';
  mostrarMensagem = false;
  tipoMensagem: 'normal' | 'alerta' = 'normal';

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router,
    private auth: Auth
  ) {
    this.form = this.fb.group({
      nome: [''],
      metaMensal: [0],
      estoqueNotificacao: [0],
      estoqueCritico: [0]
    });
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;
    if (!this.user) return;

    const uid = this.user.uid;

    // Buscar nomeEmpresa no documento 'usuarios/{uid}'
    const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
    const usuarioSnap = await getDoc(usuarioRef);

    if (usuarioSnap.exists()) {
      const usuarioData = usuarioSnap.data() as { [key: string]: any };
      this.form.patchValue({
        nome: usuarioData['nomeEmpresa'] || '',
      });
    }

    // Buscar configurações em 'usuarios/{uid}/configuracoes/{uid}'
    const configRef = doc(this.firestore, `usuarios/${uid}/configuracoes/${uid}`);
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const configData = configSnap.data() as { [key: string]: any };
      this.form.patchValue({
        metaMensal: configData['metaMensal'] || 0,
        estoqueNotificacao: configData['estoqueNotificacao'] || 0,
        estoqueCritico: configData['estoqueCritico'] || 0
      });
    }
  }

  async salvarConfiguracoes() {
    if (!this.user) return;

    const uid = this.user.uid;

    // Atualizar nomeEmpresa no documento 'usuarios/{uid}'
    const usuarioRef = doc(this.firestore, `usuarios/${uid}`);
    await setDoc(usuarioRef, { nomeEmpresa: this.form.value.nome }, { merge: true });

    // Atualizar configurações em 'usuarios/{uid}/configuracoes/{uid}'
    const { nome, ...configuracoes } = this.form.value;
    const configRef = doc(this.firestore, `usuarios/${uid}/configuracoes/${uid}`);
    await setDoc(configRef, configuracoes, { merge: true });

    this.exibirMensagem('Configurações salvas!');
  }

  irParaAlterarEmail() {
    this.router.navigate(['/alterar-email']);
  }

  async enviarEmailTrocaSenha() {
    if (this.user?.email) {
      await sendPasswordResetEmail(this.auth, this.user.email);
      this.exibirMensagem('E-mail de redefinição de senha enviado!');
    }
  }

  exibirMensagem(texto: string, tipo: 'normal' | 'alerta' = 'normal', duracaoMs: number = 2500) {
    this.mensagemFlutuante = texto;
    this.tipoMensagem = tipo;
    this.mostrarMensagem = true;

    setTimeout(() => {
      this.mostrarMensagem = false;
    }, duracaoMs);
  }
}
