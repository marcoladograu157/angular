import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
//import { provideFormsModule } from '@angular/forms'; // <-- Este aqui importa corretamente o FormsModule


import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
   // provideFormsModule(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
