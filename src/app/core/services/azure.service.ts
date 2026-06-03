import { Injectable } from '@angular/core';

export interface AzureWorkItem {
  title: string;
  description?: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class AzureService {
  async getWorkItem(
    organization: string,
    project: string,
    pat: string,
    id: number,
  ): Promise<AzureWorkItem> {
    const url = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/wit/workitems/${id}?api-version=7.0`;

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${btoa(':' + pat)}` },
    });

    if (response.status === 401) throw new Error('PAT inválido ou sem permissão.');
    if (response.status === 404) throw new Error(`Work item #${id} não encontrado.`);
    if (!response.ok)            throw new Error(`Erro Azure API: ${response.status}`);

    const data = await response.json();
    const fields = data['fields'] ?? {};

    return {
      title:       fields['System.Title']       ?? '',
      description: this.stripHtml(fields['System.Description'] ?? ''),
      type:        fields['System.WorkItemType'] ?? 'Work Item',
    };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
