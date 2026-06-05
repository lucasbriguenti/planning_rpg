import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AzureAuthStore } from '../services/azure-auth.store';

export const azureInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('dev.azure.com')) return next(req);

  const pat = inject(AzureAuthStore).pat();
  if (!pat) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Basic ${btoa(':' + pat)}` },
  }));
};
