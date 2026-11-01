import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SiteContent, validateContent } from '../models/site-content';
import { readContent } from '../models/content-migration';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private client?: SupabaseClient;
  document!: SiteContent;
  configured = false;
  signedIn = false;
  message = '';

  async load(): Promise<void> {
    const response = await fetch('content.json');
    if (!response.ok) throw new Error('Unable to load site content.');
    const bundled: unknown = await response.json();
    validateContent(bundled);
    this.document = bundled;
    try {
      const response = await fetch('content-config.json');
      if (!response.ok) throw new Error('Content configuration unavailable.');
      const config = await response.json();
      if (!config.supabaseUrl || !config.supabasePublishableKey) return;
      this.client = createClient(config.supabaseUrl, config.supabasePublishableKey);
      this.configured = true;
      const { data, error } = await this.client.from('site_content').select('fields').eq('id', 'main').maybeSingle();
      if (error) throw error;
      if (data) this.document = readContent(data.fields, this.document);
    } catch (error) {
      this.message = 'Published content unavailable or invalid; bundled content is displayed.';
      console.warn(this.message, error);
    }
    if (this.client) this.signedIn = !!(await this.client.auth.getSession()).data.session;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.signedIn = true;
  }

  async signOut(): Promise<void> {
    const { error } = await this.requireClient().auth.signOut();
    if (error) throw error;
    this.signedIn = false;
  }

  async publish(draft: SiteContent): Promise<void> {
    validateContent(draft);
    const { error } = await this.requireClient().from('site_content').upsert({
      id: 'main', fields: draft, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    this.document = structuredClone(draft);
  }

  exportContent(draft: SiteContent): void {
    validateContent(draft);
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  importContent(value: unknown): SiteContent { return readContent(value, this.document); }

  private requireClient(): SupabaseClient {
    if (!this.client) throw new Error('The content database has not been configured.');
    return this.client;
  }
}
