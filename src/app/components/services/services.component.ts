import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-services',
  standalone: true,
  templateUrl: './services.component.html',
  styles: [':host { display: contents; }'],
})
export class ServicesComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
