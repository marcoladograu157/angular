import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { switchMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { doc, setDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  getCategorias(): Observable<string[]> {
    return user(this.auth).pipe(
      switchMap(u => {
        if (!u) return of([]);  // Se não autenticado, retorna vazio
        const categoriasRef = collection(this.firestore, `usuarios/${u.uid}/categorias`);
        return collectionData(categoriasRef).pipe(
          map((docs: any[]) => docs.map(doc => doc.nome))
        );
      })
    );
  }

  async addCategoria(nome: string): Promise<void> {
  const currentUser = await this.auth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado');

  const categoriaRef = doc(this.firestore, `usuarios/${currentUser.uid}/categorias/${nome}`);
  return setDoc(categoriaRef, { nome });
}
}
