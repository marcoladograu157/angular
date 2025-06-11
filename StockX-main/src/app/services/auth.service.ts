import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) {}

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string): Promise<UserCredential> {
    console.log('Registrando com:', email, password);
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    const uid = userCredential.user.uid;

    // Criar documento do usuário no Firestore
    await setDoc(doc(this.firestore, `usuarios/${uid}`), {
      email: email,
      createdAt: new Date(),
      // Você pode adicionar outros campos padrão aqui
    });

    return userCredential;
  }

  logout(): Promise<void> {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
}
