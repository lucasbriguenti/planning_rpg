import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-ios-install-banner',
  standalone: true,
  templateUrl: './ios-install-banner.component.html',
  styleUrl: './ios-install-banner.component.scss',
})
export class IosInstallBannerComponent {
  readonly visible = signal(this.shouldShow());

  private shouldShow(): boolean {
    const isIos =
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem('ios-pwa-dismissed') === '1';
    return isIos && !isStandalone && !dismissed;
  }

  dismiss(): void {
    localStorage.setItem('ios-pwa-dismissed', '1');
    this.visible.set(false);
  }
}
