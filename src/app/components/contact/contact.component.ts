import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-contact',
  standalone: true,
  templateUrl: './contact.component.html',
  styles: [':host { display: contents; }'],
})
export class ContactComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
