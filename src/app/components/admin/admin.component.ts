import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../services/content.service';
import { SiteContent, Schema, siteSchema } from '../../models/site-content';
import { ContentEditorComponent } from '../content-editor/content-editor.component';

@Component({
  selector: 'site-admin',
  standalone: true,
  imports: [FormsModule, ContentEditorComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  private readonly content = inject(ContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  draft: SiteContent = structuredClone(this.content.document);
  section: Exclude<keyof SiteContent, 'version'> = 'profile';
  readonly sections: { key: Exclude<keyof SiteContent, 'version'>; label: string }[] = [
    { key: 'profile', label: 'Profile' }, { key: 'navigation', label: 'Navigation' },
    { key: 'socialLinks', label: 'Social links' }, { key: 'about', label: 'About and interests' },
    { key: 'resume', label: 'Resume and skills' }, { key: 'projects', label: 'Projects' },
    { key: 'services', label: "Mig's World" }, { key: 'contact', label: 'Contact' },
    { key: 'footer', label: 'Footer' },
  ];
  email = '';
  password = '';
  busy = false;
  message = this.content.message;
  get schema(): Schema { return siteSchema.properties[this.section]; }
  get configured() { return this.content.configured; }
  get signedIn() { return this.content.signedIn; }

  async login(): Promise<void> {
    await this.perform(async () => {
      await this.content.signIn(this.email, this.password);
      this.password = '';
      this.message = 'Signed in.';
    });
  }
  async logout(): Promise<void> {
    await this.perform(async () => { await this.content.signOut(); this.message = 'Signed out.'; });
  }
  async publish(): Promise<void> {
    await this.perform(async () => {
      await this.content.publish(this.draft);
      this.message = 'Published. Reload the public site to see your changes.';
    });
  }
  exportContent(): void {
    try { this.content.exportContent(this.draft); this.message = 'Content exported.'; }
    catch (error) { this.message = String(error); }
  }
  async importContent(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.perform(async () => {
      this.draft = this.content.importContent(JSON.parse(await file.text()));
      this.message = 'Imported into your draft. Review changes, then publish or export.';
    });
    input.value = '';
  }
  reset(): void {
    if (confirm('Discard all unpublished changes?')) {
      this.draft = structuredClone(this.content.document);
      this.message = 'Draft reset to loaded content.';
    }
  }
  private async perform(action: () => Promise<void>): Promise<void> {
    this.busy = true;
    try { await action(); }
    catch (error) { this.message = String(error); }
    finally { this.busy = false; this.cdr.markForCheck(); }
  }
}
