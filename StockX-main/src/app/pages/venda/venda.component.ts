import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';
import { VendaService } from '../../services/venda.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-venda',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZXingScannerModule,
    NavbarComponent
  ],
  templateUrl: './venda.component.html',
  styleUrls: ['./venda.component.css']
})
export class VendaComponent implements OnInit {

  mostrarScanner = false;
  vendaForm!: FormGroup;
  produtos: Product[] = [];
  produtosFiltrados: Observable<Product[]>[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private vendaService: VendaService
  ) {}

  async ngOnInit() {
    this.vendaForm = this.fb.group({
      formaPagamento: ['', Validators.required],
      itens: this.fb.array([this.criarItem()])
    });

    this.produtos = await this.productService.getAll();
    this.configurarAutocompleteParaItem(0);
  }

  get itens(): FormArray {
    return this.vendaForm.get('itens') as FormArray;
  }

  criarItem(): FormGroup {
    return this.fb.group({
      nome: ['', Validators.required],
      codigo: [''],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      preco: [0, Validators.required],
      categoria: ['']
    });
  }

  adicionarItem(): void {
    this.itens.push(this.criarItem());
    this.configurarAutocompleteParaItem(this.itens.length - 1);
  }

  removerItem(index: number): void {
    this.itens.removeAt(index);
    this.produtosFiltrados.splice(index, 1);
  }

  configurarAutocompleteParaItem(index: number): void {
    const nomeControl = this.itens.at(index).get('nome');
    if (nomeControl) {
      const filtro$ = nomeControl.valueChanges.pipe(
        startWith(''),
        debounceTime(200),
        map((valor: string) => this.filtrarProdutos(valor))
      );
      this.produtosFiltrados[index] = filtro$;
    }
  }

  filtrarProdutos(valor: string): Product[] {
    const termo = valor?.toLowerCase() || '';
    return this.produtos.filter(p =>
      p.name?.toLowerCase().includes(termo) || p.id?.toLowerCase().includes(termo)
    );
  }

  selecionarProduto(produto: Product, index: number): void {
    const item = this.itens.at(index);
    item.patchValue({
      nome: produto.name,
      codigo: produto.id,
      preco: produto.price,
      categoria: produto.category
    });
  }

  calcularTotal(): number {
    return this.itens.controls.reduce((total, item) => {
      const qtd = item.get('quantidade')?.value || 0;
      const preco = item.get('preco')?.value || 0;
      return total + qtd * preco;
    }, 0);
  }

  async finalizarVenda(): Promise<void> {
  if (this.vendaForm.invalid) {
    alert('Formulário inválido, preencha todos os campos corretamente!');
    return;
  }

  const venda = {
    formaPagamento: this.vendaForm.value.formaPagamento,
    itens: this.vendaForm.value.itens,
    total: this.calcularTotal(),
    data: new Date()
  };

  try {
    // Verificação de estoque antes de salvar a venda
    for (const item of venda.itens) {
      const produtoEstoque = this.produtos.find(p => p.id === item.codigo);
      if (produtoEstoque) {
        const quantidadeVendida = Number(item.quantidade);

        if (produtoEstoque.quantity < quantidadeVendida) {
          alert(`Estoque insuficiente para o produto ${produtoEstoque.name}.`);
          return;
        }
      }
    }

    // Aqui o serviço já atualiza o estoque corretamente
    await this.vendaService.salvarVenda(venda);

    alert('Venda salva e estoque atualizado com sucesso!');
    this.vendaForm.reset();
    this.itens.clear();
    this.adicionarItem();

  } catch (error) {
    console.error('Erro ao salvar venda ou atualizar estoque:', error);
    alert('Erro ao salvar a venda ou atualizar o estoque. Tente novamente.');
  }
}


  toggleScanner(): void {
    this.mostrarScanner = !this.mostrarScanner;
  }

  onCodeResult(result: string): void {
    this.mostrarScanner = false;
    const produto = this.produtos.find(p => p.id === result || p.code === result);
    if (!produto) {
      alert(`Produto com código "${result}" não encontrado.`);
      return;
    }

    const novoItem = this.criarItem();
    novoItem.patchValue({
      nome: produto.name,
      codigo: produto.id,
      preco: produto.price,
      categoria: produto.category
    });

    this.itens.push(novoItem);
    this.configurarAutocompleteParaItem(this.itens.length - 1);
  }

  onCodeScanned(code: string): void {
    const produtoEncontrado = this.produtos.find(p => p.id === code);
    if (produtoEncontrado) {
      const index = this.itens.length - 1;
      this.selecionarProduto(produtoEncontrado, index);
      this.mostrarScanner = false;
    } else {
      alert('Produto não encontrado com este código.');
    }
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

}
