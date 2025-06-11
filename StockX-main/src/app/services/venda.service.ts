import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class VendaService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // Salva a venda na coleção do usuário logado e atualiza o estoque dos produtos
  async salvarVenda(venda: any) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    // Atualizar o estoque para cada item da venda
    for (const item of venda.itens) {
      await this.atualizarEstoqueProduto(item.codigo, item.quantidade);
    }

    const vendasCollection = collection(this.firestore, `usuarios/${user.uid}/vendas`);
    return addDoc(vendasCollection, venda);
  }

  // Método para atualizar estoque do produto no Firestore
 async atualizarEstoqueProduto(produtoId: string, quantidadeVendida: number) {
  quantidadeVendida = Number(quantidadeVendida);
  if (isNaN(quantidadeVendida) || quantidadeVendida <= 0) {
    throw new Error(`Quantidade inválida para venda: ${quantidadeVendida}`);
  }

  const user = this.auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const produtoRef = doc(this.firestore, `usuarios/${user.uid}/produtos/${produtoId}`);
  const produtoSnap = await getDoc(produtoRef);

  if (!produtoSnap.exists()) {
    throw new Error(`Produto com ID ${produtoId} não encontrado para atualizar estoque`);
  }

  const produtoData = produtoSnap.data() as any;
  const estoqueAtual = Number(produtoData.quantity ?? 0);

  if (estoqueAtual < quantidadeVendida) {
    throw new Error(`Estoque insuficiente para o produto ${produtoId}. Estoque atual: ${estoqueAtual}, quantidade vendida: ${quantidadeVendida}`);
  }

  await updateDoc(produtoRef, {
    quantity: estoqueAtual - quantidadeVendida
  });
}


}
