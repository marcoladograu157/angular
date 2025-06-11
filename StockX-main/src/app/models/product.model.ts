export interface Product {
  id: string;          // ID gerado pelo Firestore
  name: string;
  quantity: number;
  price: number;        // preço de venda
  cost: number;         // custo do produto
  category?: string | null;
  code?: string | null;     
}
