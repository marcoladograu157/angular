import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  resumo = { totalItens: 0, totalValor: 0 };
  produtos: Product[] = [];
  produtosFiltrados: Product[] = [];
  filtro: string = '';

  nomeEmpresa: string = '';  // variável para nome da empresa

  mensagemFlutuante: string = '';
  mostrarMensagem = false;
  tipoMensagem: 'normal' | 'alerta' = 'normal';

  // id do produto para exclusão (string, pois id do produto é string)
  idProdutoParaExcluir: string | null = null;
  mostrarConfirmacaoExcluir = false;

  constructor(
    private productService: ProductService,
    private router: Router,
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async ngOnInit(): Promise<void> {
    // observar autenticação do usuário
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const docRef = doc(this.firestore, `usuarios/${user.uid}`);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          this.nomeEmpresa = data['nomeEmpresa'] || '';
          console.log('nomeEmpresa:', this.nomeEmpresa);
        }

        await this.atualizarDados();

        const estado = history.state?.mensagemEstoqueBaixo;
        if (estado) {
          this.exibirMensagem(estado, 'alerta');
          history.replaceState({}, '', location.pathname);
        }
      }
    });
  }

  async atualizarDados() {
    this.produtos = await this.productService.getAll();
    this.produtosFiltrados = [...this.produtos];
    const resumo = await this.productService.getResumo();
    this.resumo = resumo;

    // Verifica produtos com estoque baixo
    const produtosComEstoqueBaixo = this.produtos.filter(p => (p.quantity || 0) <= 2);
    if (produtosComEstoqueBaixo.length > 0) {
      const nomes = produtosComEstoqueBaixo.map(p => `"${p.name}"`).join(', ');
      const texto = `⚠ Produtos com estoque muito baixo: ${nomes}`;
      this.exibirMensagem(texto, 'alerta', 2500);
    }
  }

  filtrarProdutos() {
    const filtroLower = this.filtro.toLowerCase();
    this.produtosFiltrados = this.produtos.filter(p =>
      p.name.toLowerCase().includes(filtroLower)
    );
  }

  

  // Método chamado direto na confirmação sem prompt nativo
  exibirConfirmacaoExcluir(id: string) {
    this.idProdutoParaExcluir = id;
    this.mostrarConfirmacaoExcluir = true;
  }

  cancelarExclusao() {
    this.idProdutoParaExcluir = null;
    this.mostrarConfirmacaoExcluir = false;
  }

  async confirmarExclusao() {
  if (this.idProdutoParaExcluir !== null) {
    try {
      await this.productService.delete(this.idProdutoParaExcluir);
      await this.atualizarDados();
      this.filtrarProdutos();
      this.exibirMensagem('Produto excluído com sucesso!');
    } catch (error) {
      this.exibirMensagem('Erro ao excluir o produto.', 'alerta');
      console.error('Erro ao excluir produto:', error);
    }
  }
  this.cancelarExclusao();
}

  editarProduto(produto: Product) {
    this.router.navigate(['/editar-produto', produto.id]);
  }

  abrirDashboard() {
    this.router.navigate(['']);
  }

  abrirNovaCategoria() {
  // Pode abrir modal ou navegar para página /categoria-nova
  this.router.navigate(['/nova-categoria']);
}

  abrirCriarProduto() {
    this.router.navigate(['/novo-produto']);
  }

  irParaProdutos() {
  this.router.navigate(['/produtos']);
}

irParaVendas() {
  this.router.navigate(['/venda']);
}

irParaConfiguracoes() {
  this.router.navigate(['/configurações']);
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
