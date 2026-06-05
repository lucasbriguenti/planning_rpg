import { Injectable, inject } from '@angular/core';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';

import { FirebaseService } from './firebase.service';

export type AnalyticsParams = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly firebase = inject(FirebaseService);
  private analyticsPromise?: Promise<Analytics | null>;

  private getAnalyticsInstance(): Promise<Analytics | null> {
    if (!this.analyticsPromise) {
      this.analyticsPromise = isSupported()
        .then(supported => supported ? getAnalytics(this.firebase.app) : null)
        .catch(() => null);
    }
    return this.analyticsPromise;
  }

  async trackEvent(name: string, params: AnalyticsParams = {}): Promise<void> {
    const analytics = await this.getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, name, params);
  }
}
