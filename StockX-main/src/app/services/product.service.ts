import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Product } from '../models/product.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // Pega o uid do usuário logado
  private async getUserId(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    return user.uid;
  }

  async getResumo(): Promise<{ totalItens: number, totalValor: number, totalCusto: number }> {
  const produtos = await this.getAll();
  const totalItens = produtos.reduce((sum, p) => sum + (p.quantity ?? 0), 0);
  const totalValor = produtos.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.price ?? 0), 0);
  const totalCusto = produtos.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.cost ?? 0), 0);
  return { totalItens, totalValor, totalCusto };
}


  // Busca todos produtos do usuário
  async getAll(): Promise<Product[]> {
    const userId = await this.getUserId();
    const produtosRef = collection(this.firestore, `usuarios/${userId}/produtos`);
    const produtos = await firstValueFrom(collectionData(produtosRef, { idField: 'id' })) as Product[];
    return produtos;
  }

  // Adiciona produto sem o campo id (Firestore gera)
 async add(product: Omit<Product, 'id'>): Promise<void> {
  const userId = await this.getUserId();
  const produtosRef = collection(this.firestore, `usuarios/${userId}/produtos`);
  
  await addDoc(produtosRef, {
    name: product.name,
    code: product.code ?? '',        // <-- aqui, passando explicitamente o code
    price: product.price,
    cost: product.cost ?? 0,
    category: product.category ?? '',
    quantity: product.quantity ?? 0
  });
}


  // Busca produto por id
  async getProductById(id: string): Promise<Product | undefined> {
    const userId = await this.getUserId();
    const produtoDocRef = doc(this.firestore, `usuarios/${userId}/produtos/${id}`);
    const produto = await firstValueFrom(docData(produtoDocRef, { idField: 'id' })) as Product | undefined;
    return produto;
  }

  // Atualiza produto pelo id
  async updateProduct(product: Product): Promise<void> {
    if (!product.id) throw new Error('Produto sem ID');
    const userId = await this.getUserId();
    const produtoDocRef = doc(this.firestore, `usuarios/${userId}/produtos/${product.id}`);
    await updateDoc(produtoDocRef, { ...product });
  }

  // Deleta produto pelo id
  async delete(id: string): Promise<void> {
    const userId = await this.getUserId();
    const produtoDocRef = doc(this.firestore, `usuarios/${userId}/produtos/${id}`);
    await deleteDoc(produtoDocRef);
  }

}
