import {
  Component,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { CategoryService } from '../services/category.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, ZXingScannerModule],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnDestroy, AfterViewInit {
  @ViewChild(ZXingScannerComponent)
  scanner?: ZXingScannerComponent;

  produto: Omit<Product, 'id'> = {
    name: '',
    code: '',
    price: 0,
    quantity: 0,
    category: '',
    cost: 0
  };

  categorias: string[] = [];
  mensagemFlutuante: string = '';
  mostrarMensagem: boolean = false;
  tipoMensagem: 'normal' | 'alerta' = 'normal';

  mostrarScanner: boolean = false;
  scannerRunning: boolean = false;
  hasPermission: boolean = false;

  formats: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.QR_CODE
  ];

  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;

  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.carregarCategorias();
  }

  ngAfterViewInit(): void {
  setTimeout(() => {
    if (this.scanner) {
      this.scanner.permissionResponse?.subscribe((hasPermission: boolean) => {
        this.ngZone.run(() => {
          this.hasPermission = hasPermission;
        });
      });

      this.scanner.camerasFound?.subscribe((devices: MediaDeviceInfo[]) => {
        this.ngZone.run(() => {
          this.availableDevices = devices;
          if (devices.length > 0) {
            this.currentDevice = devices[0];
          }
        });
      });
    }
  });
}



  carregarCategorias() {
    this.categoryService.getCategorias().subscribe({
      next: categorias => this.categorias = categorias,
      error: error => console.error('Erro ao carregar categorias:', error)
    });
  }

  async salvarProduto() {
    try {
      if (!this.produto.name || this.produto.price <= 0 || this.produto.quantity < 0) {
        this.exibirMensagem('Preencha os campos obrigatórios corretamente.', 'alerta');
        return;
      }

      await this.productService.add(this.produto);
      this.exibirMensagem('Produto criado com sucesso!');
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      this.exibirMensagem('Erro ao salvar produto.', 'alerta');
    }
  }

  voltar() {
    this.router.navigate(['/produtos']);
  }

  exibirMensagem(texto: string, tipo: 'normal' | 'alerta' = 'normal', duracaoMs: number = 2500) {
    this.mensagemFlutuante = texto;
    this.tipoMensagem = tipo;
    this.mostrarMensagem = true;
    setTimeout(() => this.mostrarMensagem = false, duracaoMs);
  }

async toggleScanner(): Promise<void> {
  // Se já está visível, apenas desligue
  if (this.mostrarScanner) {
    this.mostrarScanner = false;
    this.scannerRunning = false;
    return;
  }

  // Configuração inicial
  this.mostrarScanner = true;
  this.scannerRunning = false;

  try {
    // Espera a renderização do componente
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.scanner) {
      throw new Error('Scanner component not initialized');
    }

    // Verificação de permissão
    this.hasPermission = await this.scanner.askForPermission();
    if (!this.hasPermission) {
      throw new Error('Permissão da câmera negada');
    }

    // Verificação de dispositivos com timeout
    if (this.availableDevices.length === 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject('Nenhuma câmera encontrada'), 5000);
        
        const sub = this.scanner!.camerasFound.subscribe(devices => {
          clearTimeout(timeout);
          if (devices.length > 0) {
            this.availableDevices = devices;
            resolve();
          } else {
            reject('Nenhuma câmera disponível');
          }
          sub.unsubscribe();
        });
      });
    }

    // Configuração do dispositivo
    this.currentDevice = this.availableDevices[0];
    this.scanner.device = this.currentDevice;
    
    // Inicia o scanner
    this.scannerRunning = true;

  } catch (error) {
    this.handleScannerError(error);
    this.mostrarScanner = false;
    this.scannerRunning = false;
  }
}

private handleScannerError(error: unknown): void {
  let errorMessage = 'Erro no scanner';
  
  if (error instanceof Error) {
    console.error('Scanner error:', error);
    
    if (error.name === 'NotReadableError') {
      errorMessage = 'A câmera não pode ser acessada. Verifique se não está sendo usada por outro aplicativo.';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Permissão para usar a câmera foi negada.';
    } else if (error.message.includes('No scanning is running')) {
      // Não mostrar mensagem para esse erro específico
      return;
    } else {
      errorMessage = error.message;
    }
  }

  this.exibirMensagem(errorMessage, 'alerta');
}



  onCodeScanned(codigo: string): void {
    this.ngZone.run(() => {
      this.produto.code = codigo;
      this.exibirMensagem('Código escaneado: ' + codigo);
      this.mostrarScanner = false;
      this.safeResetScanner();
      this.scannerRunning = false;
    });
  }

  onScanError(error: any): void {
    console.error('Erro ao escanear:', error);
    this.ngZone.run(() => {
      if (error.name === 'NotReadableError') {
        this.exibirMensagem('A câmera está em uso por outro aplicativo ou bloqueada.', 'alerta');
      } else if (error.name === 'NotAllowedError') {
        this.exibirMensagem('Permissão para câmera negada.', 'alerta');
      } else {
        this.exibirMensagem('Erro ao acessar a câmera: ' + error.message, 'alerta');
      }
      this.mostrarScanner = false;
      this.scannerRunning = false;
      this.safeResetScanner();
    });
  }

  camerasFound(devices: MediaDeviceInfo[]): void {
  this.ngZone.run(() => {
    this.availableDevices = devices;
    if (devices.length > 0) {
      this.currentDevice = devices[0]; // ou permitir o usuário escolher depois
      if (this.scanner) {
        try {
          this.scanner.reset();  // reset para liberar câmera antiga
          this.scanner.device = this.currentDevice;  // atualiza dispositivo
        } catch (error) {
          console.warn('Erro ao resetar scanner:', error);
        }
      }
    } else {
      this.exibirMensagem('Nenhuma câmera encontrada.', 'alerta');
      this.mostrarScanner = false;
    }
  });
}


  onHasPermission(has: boolean): void {
    this.ngZone.run(() => {
      this.hasPermission = has;
      console.log('Permissão da câmera:', has);
    });
  }

  onScanStart(): void {
    this.ngZone.run(() => {
      this.scannerRunning = true;
      this.exibirMensagem('Escaneamento iniciado.');
    });
  }

  onScanStop(): void {
    this.ngZone.run(() => {
      this.scannerRunning = false;
      this.exibirMensagem('Escaneamento parado.');
    });
  }



private async safeResetScanner(): Promise<void> {
  if (!this.scanner) return;

  try {
    // Método mais seguro para v19.0.0
    if (this.scannerRunning) {
      await this.scanner.scanStop();
      // Delay para garantir que o scanner parou
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    // Ignora erros específicos da versão 19
    if (!(error instanceof Error) || 
        !error.message.includes('No scanning is running')) {
      console.warn('Aviso ao resetar scanner:', error);
    }
  } finally {
    this.scannerRunning = false;
  }
}

  ngOnDestroy() {
  // Não tentar resetar se já está fechado
  if (!this.mostrarScanner && !this.scannerRunning) return;
  
  // Fechar de forma limpa
  this.mostrarScanner = false;
  this.scannerRunning = false;
  
  // Resetar sem esperar para evitar problemas no ciclo de vida
  if (this.scanner) {
    try {
      this.scanner.reset();
    } catch (error) {
      // Ignorar erros durante a destruição
    }
  }
}


}
