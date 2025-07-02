import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './app/home/home.component';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      { path: '', component: HomeComponent },
    ]),
    provideHttpClient(),
    importProvidersFrom(FormsModule, HttpClientModule),
  ],
}).catch((err) => console.error(err));
