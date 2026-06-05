import { Injectable, inject } from '@angular/core';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';

import { FirebaseService } from './firebase.service';

export type AnalyticsParams = Record<string, string | number | boolean>;
export interface PageViewParams {
  page_location: string;
  page_path: string;
  page_title: string;
}

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

  async trackPageView(pagePath = window.location.pathname + window.location.search + window.location.hash): Promise<void> {
    const analytics = await this.getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, 'page_view', {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    });
  }
}
