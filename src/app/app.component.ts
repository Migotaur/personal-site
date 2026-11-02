import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { AdminComponent } from './components/admin/admin.component';
import { PageComponent } from './components/page/page.component';
import { ContentService } from './services/content.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AdminComponent, PageComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private readonly content = inject(ContentService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly admin = location.hash === '#admin';
  loaded = false;
  error = '';

  // Start a fresh document when switching views so legacy plugins cannot retain stale DOM references.
  @HostListener('window:hashchange')
  onHashChange(): void {
    if ((location.hash === '#admin') !== this.admin) location.reload();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.content.load();
      this.loaded = true;
    } catch (error) {
      this.error = String(error);
    } finally {
      this.cdr.markForCheck();
    }
  }
}
