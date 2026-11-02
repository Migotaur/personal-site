import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styles: [':host { display: contents; }'],
})
export class FooterComponent {
  private readonly content = inject(ContentService);
  get site() { return this.content.document; }
}
