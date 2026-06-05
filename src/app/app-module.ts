import { isDevMode, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';

import { IosInstallBannerComponent } from './core/components/ios-install-banner/ios-install-banner.component';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { XpLevelPipe } from './core/pipes/xp-level.pipe';
import { azureInterceptor } from './core/interceptors/azure.interceptor';

@NgModule({
  declarations: [App, XpLevelPipe],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    IosInstallBannerComponent,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([azureInterceptor])),
  ],
  bootstrap: [App],
  exports: [XpLevelPipe],
})
export class AppModule {}
