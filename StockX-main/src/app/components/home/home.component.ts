import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { MetaMensalComponent } from '../meta-mensal/meta-mensal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, MetaMensalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
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

  // Configurações do usuário
  estoqueCritico: number = 2;      // padrão se não carregar do Firestore
  estoqueNotificacao: number = 2;  // padrão se não carregar do Firestore

  constructor(
    private productService: ProductService,
    private router: Router,
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async ngOnInit(): Promise<void> {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // Carregar nome da empresa
        const docRefUsuario = doc(this.firestore, `usuarios/${user.uid}`);
        const snapshotUsuario = await getDoc(docRefUsuario);
        if (snapshotUsuario.exists()) {
          const data = snapshotUsuario.data();
          this.nomeEmpresa = data['nomeEmpresa'] || '';
          console.log('nomeEmpresa:', this.nomeEmpresa);
        }

        // Carregar configurações do usuário
        await this.carregarConfiguracoes(user.uid);

        // Atualizar dados dos produtos usando as configurações carregadas
        await this.atualizarDados();

        // Mensagem caso tenha vindo via navegação
        const estado = history.state?.mensagemEstoqueBaixo;
        if (estado) {
          this.exibirMensagem(estado, 'alerta');
          history.replaceState({}, '', location.pathname);
        }
      }
    });
  }

  private async carregarConfiguracoes(userId: string) {
    try {
      const docRefConfig = doc(this.firestore, `configuracoes/${userId}`);
      const snapshotConfig = await getDoc(docRefConfig);
      if (snapshotConfig.exists()) {
        const dataConfig = snapshotConfig.data();

        // Validar e atribuir os valores corretamente
        const estoqueCriticoCarregado = Number(dataConfig['estoqueCritico']);
        const estoqueNotificacaoCarregado = Number(dataConfig['estoqueNotificacao']);

        if (!isNaN(estoqueCriticoCarregado) && estoqueCriticoCarregado > 0) {
          this.estoqueCritico = estoqueCriticoCarregado;
        }

        if (!isNaN(estoqueNotificacaoCarregado) && estoqueNotificacaoCarregado > 0) {
          this.estoqueNotificacao = estoqueNotificacaoCarregado;
        }

        console.log('Configurações carregadas:', {
          estoqueCritico: this.estoqueCritico,
          estoqueNotificacao: this.estoqueNotificacao
        });
      } else {
        console.log('Configurações do usuário não encontradas. Usando padrões.');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async atualizarDados() {
    this.produtos = await this.productService.getAll();

    // Filtra produtos com estoque menor ou igual ao estoqueCritico
    this.produtosFiltrados = this.produtos.filter(p => (p.quantity ?? 0) <= this.estoqueCritico);

    const resumo = await this.productService.getResumo();
    this.resumo = resumo;

    // Verifica produtos com estoque abaixo ou igual ao estoqueNotificacao para alertar
    const produtosComEstoqueBaixo = this.produtos.filter(p => (p.quantity ?? 0) <= this.estoqueNotificacao);
    if (produtosComEstoqueBaixo.length > 0) {
      const nomes = produtosComEstoqueBaixo.map(p => `"${p.name}"`).join(', ');
      const texto = `⚠ Produtos com estoque baixo: ${nomes}`;
      this.exibirMensagem(texto, 'alerta', 3500);
    }
  }

  filtrarProdutos() {
    const filtroLower = this.filtro.toLowerCase();
    // filtrar dentro dos produtos já filtrados por estoqueCritico para manter o filtro correto
    this.produtosFiltrados = this.produtos
      .filter(p => (p.quantity ?? 0) <= this.estoqueCritico)
      .filter(p => p.name.toLowerCase().includes(filtroLower));
  }

  // Métodos para exclusão
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
