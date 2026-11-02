import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-header',
  standalone: true,
  templateUrl: './header.component.html',
  styles: [':host { display: contents; }'],
})
export class HeaderComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
