import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nova-categoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nova-categoria.component.html',
  styleUrls: ['./nova-categoria.component.css']
})
export class NovaCategoriaComponent {
  nomeCategoria: string = '';
  mensagem: string = '';

  constructor(private categoryService: CategoryService, private router: Router) {}

  async salvarCategoria() {
    if (!this.nomeCategoria.trim()) {
      this.mensagem = 'Informe um nome válido para a categoria.';
      return;
    }

    try {
      await this.categoryService.addCategoria(this.nomeCategoria.trim());
      this.mensagem = 'Categoria criada com sucesso!';
      setTimeout(() => {
        this.router.navigate(['/']); // ou onde estiver a lista de produtos
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar categoria', error);
      this.mensagem = 'Erro ao criar categoria.';
    }
  }

  cancelar() {
  this.router.navigate(['/produtos']);
}

}
