import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomeComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'crud-pi';
  user$: Observable<any>;
  userData: any;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    this.user$ = authState(this.auth);
  }

  ngOnInit() {
    
    this.user$ = authState(this.auth);

this.user$.subscribe(async (user) => {
  if (!user) {
    console.log('Usuário não autenticado');
    this.router.navigate(['/login']);
    return;
  }
console.log('Usuário atual:', this.auth.currentUser);

  try {
    const userDocRef = doc(this.firestore, 'usuarios', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      this.userData = userDocSnap.data();
      console.log('Dados do usuário:', this.userData);
    } else {
      console.log('Documento do usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
  }
});
  }
}
