import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { AzureAuthStore } from './azure-auth.store';

export interface AzureTaskItem {
  id: number;
  title: string;
}

interface WorkItemResponse {
  id: number;
  fields: Record<string, unknown>;
  relations?: Array<{
    rel: string;
    url: string;
    attributes: { name: string };
  }>;
}

@Injectable({ providedIn: 'root' })
export class AzureService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AzureAuthStore);
  private readonly analytics = inject(AnalyticsService);

  async getChildTasks(
    organization: string,
    project: string,
    pat: string,
    usId: number,
  ): Promise<AzureTaskItem[]> {
    this.authStore.set(pat);

    const usUrl = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/wit/workitems/${usId}?$expand=relations&api-version=7.1`;

    let us: WorkItemResponse;
    try {
      us = await firstValueFrom(this.http.get<WorkItemResponse>(usUrl));
    } catch (err) {
      this.authStore.clear();
      throw this.mapError(err, usId);
    }

    const childUrls = (us.relations ?? [])
      .filter(r => r.attributes?.name === 'Child')
      .map(r => r.url);

    if (childUrls.length === 0) {
      this.authStore.clear();
      void this.analytics.trackEvent('azure_import_tasks', {
        work_item_id: usId,
        task_count: 0,
      });
      return [];
    }

    const tasks = await Promise.allSettled(
      childUrls.map(url =>
        firstValueFrom(this.http.get<WorkItemResponse>(`${url}?api-version=7.1`))
      )
    );

    this.authStore.clear();
    void this.analytics.trackEvent('azure_import_tasks', {
      work_item_id: usId,
      task_count: tasks.filter((r): r is PromiseFulfilledResult<WorkItemResponse> => r.status === 'fulfilled').length,
    });

    return tasks
      .filter((r): r is PromiseFulfilledResult<WorkItemResponse> => r.status === 'fulfilled')
      .filter(r => r.value.fields['System.WorkItemType'] === 'Task')
      .map(r => ({
        id: r.value.id,
        title: String(r.value.fields['System.Title'] ?? ''),
      }));
  }

  async updateWorkItemEstimate(
    organization: string,
    project: string,
    pat: string,
    workItemId: number,
    estimate: number,
  ): Promise<void> {
    this.authStore.set(pat);
    const url = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
    const body = [
      { op: 'replace', path: '/fields/Microsoft.VSTS.Scheduling.OriginalEstimate', value: estimate },
      { op: 'replace', path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork',    value: estimate },
    ];
    try {
      await firstValueFrom(
        this.http.patch(url, body, { headers: { 'Content-Type': 'application/json-patch+json' } })
      );
      void this.analytics.trackEvent('azure_sync_estimate', {
        work_item_id: workItemId,
        estimate_kind: 'numeric',
      });
    } catch (err) {
      throw this.mapError(err, workItemId);
    } finally {
      this.authStore.clear();
    }
  }

  private mapError(err: unknown, id: number): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) return new Error('PAT inválido ou sem permissão.');
      if (err.status === 404) return new Error(`Work item #${id} não encontrado.`);
      return new Error(`Erro Azure API: ${err.status}`);
    }
    return new Error('Não foi possível conectar ao Azure DevOps.');
  }
}
