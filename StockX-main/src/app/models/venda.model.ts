// src/app/models/venda.model.ts

export interface ItemVenda {
  nome: string;
  codigo?: string;
  quantidade: number;
  preco: number;
  categoria?: string;
}

export interface Venda {
  formaPagamento: string;
  itens: ItemVenda[];
  total: number;
  data: Date;
}
