import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreateProductComponent } from './pages/create-product.component';
import { EditProductComponent } from './pages/edit/edit-product/edit-product.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { NovaCategoriaComponent } from './pages/nova-categoria/nova-categoria.component';
import { ProductsComponent } from './pages/products/products.component';
import { VendaComponent } from './pages/venda/venda.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { AlterarEmailComponent } from './pages/alterar-email/alterar-email.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'recuperar-senha', component: ResetPasswordComponent },

  
  {
    path: '',
    component: HomeComponent,
    canActivate: [authGuard]
  },

    {
    path: 'produtos',
    component: ProductsComponent,
    canActivate: [authGuard]
  },

  {
    path: 'configurações',
    component: ConfiguracoesComponent,
    canActivate: [authGuard]
  },

   {
    path: 'alterar-email',
    component: AlterarEmailComponent,
    canActivate: [authGuard]
  },

  {
    path: 'venda',
    component: VendaComponent,
    canActivate: [authGuard]
  },

  { path: 'nova-categoria', 
    component:
     NovaCategoriaComponent,
    canActivate: [authGuard]
  },
  
  {
    path: 'novo-produto',
    component: CreateProductComponent,
    canActivate: [authGuard]
  },
  {
    path: 'editar-produto/:id',
    component: EditProductComponent,
    canActivate: [authGuard]
  }
];
