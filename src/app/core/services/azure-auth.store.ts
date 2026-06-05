import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AzureAuthStore {
  private readonly _pat = signal<string>('');
  readonly pat = this._pat.asReadonly();

  set(pat: string): void { this._pat.set(pat); }
  clear(): void { this._pat.set(''); }
}
